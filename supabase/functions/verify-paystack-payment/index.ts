// @ts-nocheck
import { createClient } from "jsr:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function ok(data: unknown): Response {
  return new Response(JSON.stringify({ code: "SUCCESS", message: "ok", data }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function fail(msg: string, code = 400): Response {
  return new Response(
    JSON.stringify({ code: "FAIL", message: msg }),
    {
      status: code,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    }
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const paystackKey = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!paystackKey) {
      return fail("PAYSTACK_SECRET_KEY is not configured", 500);
    }

    const { reference } = await req.json();
    if (!reference) {
      return fail("Missing reference parameter");
    }

    // Verify with Paystack
    const paystackRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${paystackKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const paystackData = await paystackRes.json();

    if (!paystackData.status) {
      return fail(paystackData.message || "Payment verification failed", 400);
    }

    const txn = paystackData.data;
    const isPaid = txn.status === "success";

    if (!isPaid) {
      return ok({
        verified: false,
        status: txn.status,
        reference,
      });
    }

    // Find the order by paystack_reference
    const { data: order, error: fetchErr } = await supabase
      .from("orders")
      .select("id, status, payment_status, order_number, total")
      .eq("paystack_reference", reference)
      .maybeSingle();

    if (fetchErr || !order) {
      console.error("Order lookup error:", fetchErr);
      return fail("Order not found for this payment reference", 404);
    }

    // Idempotent: already processed
    if (order.payment_status === "paid") {
      return ok({
        verified: true,
        status: "success",
        reference,
        order_id: order.id,
        order_number: order.order_number,
        amount_ghs: order.total,
        already_processed: true,
      });
    }

    // Update payment status using optimistic locking
    const { error: updateErr } = await supabase
      .from("orders")
      .update({
        payment_status: "paid",
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id)
      .eq("payment_status", "unpaid"); // optimistic lock

    if (updateErr) {
      console.error("Order update error:", updateErr);
      return fail("Failed to update order payment status", 500);
    }

    // Fire-and-forget: send confirmation email (non-blocking)
    supabase.functions.invoke("send-order-confirmation-email", {
      body: { order_id: order.id },
    }).catch((e) => console.warn("Email send failed:", e));

    return ok({
      verified: true,
      status: "success",
      reference,
      order_id: order.id,
      order_number: order.order_number,
      amount_ghs: order.total,
      customer_email: txn.customer?.email,
      channel: txn.channel, // "mobile_money" or "card"
      currency: txn.currency,
    });
  } catch (err) {
    console.error("verify-paystack-payment error:", err);
    return fail(
      err instanceof Error ? err.message : "Payment verification failed",
      500
    );
  }
});
