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

const STATUS_MESSAGES: Record<string, { title: string; body: string }> = {
  accepted: {
    title: "🍳 Order Accepted!",
    body: "Your order has been accepted and is being prepared.",
  },
  preparing: {
    title: "👨‍🍳 Cooking your order!",
    body: "Our kitchen team is preparing your delicious meal.",
  },
  ready: {
    title: "✅ Your order is ready!",
    body: "Your order is ready for pickup. Come get it!",
  },
  completed: {
    title: "🎉 Order Completed",
    body: "Thank you for ordering from Chef's Kitchen!",
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const fcmKey = Deno.env.get("FCM_SERVER_KEY");
    if (!fcmKey) {
      // Silently succeed if FCM is not configured — don't block order workflow
      console.warn("FCM_SERVER_KEY not configured — skipping notification");
      return ok({ sent: false, reason: "FCM not configured" });
    }

    const { order_id, new_status } = await req.json();
    if (!order_id || !new_status) {
      return fail("Missing order_id or new_status");
    }

    const message = STATUS_MESSAGES[new_status];
    if (!message) {
      return ok({ sent: false, reason: "No notification defined for this status" });
    }

    // Get the order's user_id and order_number
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("user_id, order_number")
      .eq("id", order_id)
      .maybeSingle();

    if (orderErr || !order?.user_id) {
      console.error("Order lookup error:", orderErr);
      return fail("Order not found or has no user", 404);
    }

    // Get the customer's FCM token(s)
    const { data: tokens, error: tokenErr } = await supabase
      .from("fcm_tokens")
      .select("token")
      .eq("user_id", order.user_id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (tokenErr || !tokens?.length) {
      return ok({ sent: false, reason: "No FCM token for this user" });
    }

    // Send to all tokens for the user
    const results = await Promise.allSettled(
      tokens.map((t) =>
        fetch("https://fcm.googleapis.com/fcm/send", {
          method: "POST",
          headers: {
            Authorization: `key=${fcmKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: t.token,
            notification: {
              title: message.title,
              body: `${message.body} (Order #${order.order_number})`,
              icon: "/icons/icon-192x192.png",
            },
            data: {
              order_id,
              status: new_status,
              order_number: order.order_number,
            },
          }),
        })
      )
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    return ok({ sent, total: tokens.length });
  } catch (err) {
    console.error("send-order-notification error:", err);
    // Don't block order workflow on notification failure
    return ok({ sent: false, reason: String(err) });
  }
});
