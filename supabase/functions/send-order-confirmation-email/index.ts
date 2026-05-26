// @ts-nocheck
import { createClient } from "jsr:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function ok(data: unknown): Response {
  return new Response(JSON.stringify({ code: "SUCCESS", data }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function fail(msg: string, code = 400): Response {
  return new Response(JSON.stringify({ code: "FAIL", message: msg }), {
    status: code,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function formatGHS(amount: number): string {
  return `GHS ${amount.toFixed(2)}`;
}

function buildEmailHtml(order: {
  order_number: string;
  items: { name: string; qty: number; modifications: string; price: number }[];
  subtotal: number;
  discount: number;
  tax: number;
  delivery_fee: number;
  tip: number;
  total: number;
  type: string;
  scheduled_time: string | null;
  payment_method: string;
}): string {
  const itemRows = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;">
          <strong>${item.qty}× ${item.name}</strong>
          ${item.modifications ? `<br><span style="font-size:12px;color:#6b7280;">${item.modifications}</span>` : ""}
        </td>
        <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;text-align:right;">
          ${formatGHS(item.price)}
        </td>
      </tr>`
    )
    .join("");

  const scheduledTime = order.scheduled_time
    ? new Date(order.scheduled_time).toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "ASAP";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#faf9f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(120,53,15,0.08);">
    <!-- Header -->
    <div style="background:#b45309;padding:28px 32px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">Chef's Kitchen</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Order Confirmed ✓</p>
    </div>
    <!-- Body -->
    <div style="padding:28px 32px;">
      <p style="margin:0 0 4px;font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Order Number</p>
      <p style="margin:0 0 20px;font-size:24px;font-weight:700;color:#1f2937;font-family:monospace;">${order.order_number}</p>

      <div style="display:flex;gap:24px;margin-bottom:20px;flex-wrap:wrap;">
        <div>
          <p style="margin:0 0 2px;font-size:12px;color:#6b7280;">Order Type</p>
          <p style="margin:0;font-size:14px;font-weight:600;color:#1f2937;text-transform:capitalize;">${order.type}</p>
        </div>
        <div>
          <p style="margin:0 0 2px;font-size:12px;color:#6b7280;">Scheduled</p>
          <p style="margin:0;font-size:14px;font-weight:600;color:#1f2937;">${scheduledTime}</p>
        </div>
        <div>
          <p style="margin:0 0 2px;font-size:12px;color:#6b7280;">Payment</p>
          <p style="margin:0;font-size:14px;font-weight:600;color:#1f2937;text-transform:capitalize;">${order.payment_method === "paystack" ? "Paid Online" : "Pay at Pickup"}</p>
        </div>
      </div>

      <!-- Items -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
        <thead>
          <tr style="background:#faf9f6;">
            <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;">Item</th>
            <th style="padding:8px 12px;text-align:right;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;">Price</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>

      <!-- Totals -->
      <div style="border-top:2px solid #f3f4f6;padding-top:16px;space-y:4px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
          <span style="font-size:13px;color:#6b7280;">Subtotal</span>
          <span style="font-size:13px;color:#1f2937;">${formatGHS(order.subtotal)}</span>
        </div>
        ${order.discount > 0 ? `
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
          <span style="font-size:13px;color:#059669;">Discount</span>
          <span style="font-size:13px;color:#059669;">−${formatGHS(order.discount)}</span>
        </div>` : ""}
        ${order.delivery_fee > 0 ? `
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
          <span style="font-size:13px;color:#6b7280;">Delivery</span>
          <span style="font-size:13px;color:#1f2937;">${formatGHS(order.delivery_fee)}</span>
        </div>` : ""}
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
          <span style="font-size:13px;color:#6b7280;">Tax</span>
          <span style="font-size:13px;color:#1f2937;">${formatGHS(order.tax)}</span>
        </div>
        ${order.tip > 0 ? `
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
          <span style="font-size:13px;color:#6b7280;">Tip</span>
          <span style="font-size:13px;color:#1f2937;">${formatGHS(order.tip)}</span>
        </div>` : ""}
        <div style="display:flex;justify-content:space-between;border-top:1px solid #e5e7eb;padding-top:10px;margin-top:6px;">
          <span style="font-size:15px;font-weight:700;color:#1f2937;">Total</span>
          <span style="font-size:15px;font-weight:700;color:#b45309;">${formatGHS(order.total)}</span>
        </div>
      </div>
    </div>
    <!-- Footer -->
    <div style="background:#faf9f6;padding:20px 32px;text-align:center;border-top:1px solid #f3f4f6;">
      <p style="margin:0;font-size:13px;color:#6b7280;">Thank you for ordering from Chef's Kitchen, Navrongo! 🍽️</p>
    </div>
  </div>
</body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  try {
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      // Gracefully skip if Resend not configured
      console.warn("RESEND_API_KEY not configured — skipping confirmation email");
      return ok({ skipped: true });
    }

    const { order_id } = await req.json();
    if (!order_id) return fail("Missing order_id");

    // Fetch order with profile
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("*, profiles!orders_user_id_fkey(name, email)")
      .eq("id", order_id)
      .maybeSingle();

    if (orderErr || !order) return fail("Order not found", 404);

    const customerEmail = (order.profiles as { email: string | null } | null)?.email;
    const customerName = (order.profiles as { name: string | null } | null)?.name || "Customer";

    if (!customerEmail) {
      console.warn(`No email for order ${order_id} — skipping`);
      return ok({ skipped: true });
    }

    const html = buildEmailHtml(order);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Chef's Kitchen <orders@chefskitchen.gh>",
        to: [customerEmail],
        subject: `Order Confirmed — ${order.order_number}`,
        html,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Resend error:", errText);
      // Non-fatal — don't block the order flow
      return ok({ sent: false, reason: errText });
    }

    const resData = await res.json();
    return ok({ sent: true, id: resData.id, to: customerEmail, customer: customerName });
  } catch (err) {
    console.error("send-order-confirmation-email error:", err);
    // Non-fatal
    return ok({ sent: false, reason: err instanceof Error ? err.message : "Unknown error" });
  }
});
