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

interface ChargeRequest {
  order: {
    items: unknown[];
    subtotal: number;
    tax: number;
    delivery_fee: number;
    tip: number;
    total: number;
    type: string;
    scheduled_time?: string;
    customer_note?: string;
    delivery_address?: unknown;
    curbside_vehicle?: string;
    is_asap: boolean;
  };
  callback_url: string;
  customer_email: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const paystackKey = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!paystackKey) {
      return fail("PAYSTACK_SECRET_KEY is not configured", 500);
    }

    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    const {
      data: { user },
    } = token
      ? await supabase.auth.getUser(token)
      : { data: { user: null } };

    const body: ChargeRequest = await req.json();
    const { order, callback_url, customer_email } = body;

    if (!order || !customer_email) {
      return fail("Missing order or customer_email");
    }

    // Amount in pesewas (GHS * 100)
    const amountPesewas = Math.round(order.total * 100);
    if (amountPesewas <= 0) {
      return fail("Invalid order total");
    }

    // Create a pending order in DB first
    const { data: dbOrder, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user?.id ?? null,
        items: order.items,
        subtotal: order.subtotal,
        tax: order.tax,
        delivery_fee: order.delivery_fee,
        tip: order.tip,
        total: order.total,
        type: order.type,
        status: "new",
        scheduled_time: order.scheduled_time ?? null,
        customer_note: order.customer_note ?? null,
        delivery_address: order.delivery_address ?? null,
        curbside_vehicle: order.curbside_vehicle ?? null,
        is_asap: order.is_asap,
        payment_method: "paystack",
        payment_status: "unpaid",
      })
      .select("id, order_number")
      .single();

    if (orderError || !dbOrder) {
      console.error("Order insert error:", orderError);
      return fail(`Failed to create order: ${JSON.stringify(orderError)}`, 500);
    }

    // Initialize Paystack transaction
    const paystackRes = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${paystackKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: customer_email,
          amount: amountPesewas,
          currency: "GHS",
          callback_url: `${callback_url}?order_id=${dbOrder.id}`,
          metadata: {
            order_id: dbOrder.id,
            order_number: dbOrder.order_number,
            user_id: user?.id ?? "",
            custom_fields: [
              {
                display_name: "Order Number",
                variable_name: "order_number",
                value: dbOrder.order_number,
              },
            ],
          },
        }),
      }
    );

    const paystackData = await paystackRes.json();

    if (!paystackData.status || !paystackData.data?.authorization_url) {
      console.error("Paystack init error:", paystackData);
      // Clean up the pending order
      await supabase.from("orders").delete().eq("id", dbOrder.id);
      return fail(paystackData.message || "Failed to initialize payment", 500);
    }

    // Save Paystack reference to order
    await supabase
      .from("orders")
      .update({ paystack_reference: paystackData.data.reference })
      .eq("id", dbOrder.id);

    return ok({
      authorization_url: paystackData.data.authorization_url,
      reference: paystackData.data.reference,
      order_id: dbOrder.id,
      order_number: dbOrder.order_number,
    });
  } catch (err) {
    console.error("create-paystack-charge error:", err);
    return fail(
      err instanceof Error ? err.message : "Payment initialization failed",
      500
    );
  }
});
