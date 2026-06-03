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

const CUSTOMER_MESSAGES: Record<string, { title: string; body: string }> = {
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
    body: "Thank you for ordering with us!",
  },
};

const STAFF_MESSAGES: Record<string, { title: string; body: string }> = {
  new: {
    title: "🔔 New Order Received!",
    body: "A new order has been placed and is waiting to be accepted.",
  },
  cancelled: {
    title: "❌ Order Cancelled",
    body: "A customer has cancelled their order.",
  },
};



Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {


    const { order_id, new_status } = await req.json();
    if (!order_id || !new_status) {
      return fail("Missing order_id or new_status");
    }

    // Fetch order along with customer profile for subscriber inline-creation
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("user_id, order_number, profiles!orders_user_id_fkey(name, email)")
      .eq("id", order_id)
      .maybeSingle();

    if (orderErr || !order?.user_id) {
      console.error("Order lookup error:", orderErr);
      return fail("Order not found or has no user", 404);
    }

    const customerProfile = order.profiles as { name: string | null; email: string | null } | null;

    const notificationsToInsert = [];

    // Notify customer
    const customerMsg = CUSTOMER_MESSAGES[new_status];
    if (customerMsg) {
      notificationsToInsert.push({
        user_id: order.user_id,
        title: customerMsg.title,
        message: `${customerMsg.body} (Order #${order.order_number})`,
        order_id: order_id,
        order_number: order.order_number
      });
    }

    // Notify all staff
    const staffMsg = STAFF_MESSAGES[new_status];
    if (staffMsg) {
      const { data: staffProfiles } = await supabase
        .from("profiles")
        .select("id")
        .in("role", ["manager", "admin", "staff", "chef"]);

      if (staffProfiles?.length) {
        for (const staffMember of staffProfiles) {
          notificationsToInsert.push({
            user_id: staffMember.id,
            title: staffMsg.title,
            message: `${staffMsg.body} (Order #${order.order_number})`,
            order_id: order_id,
            order_number: order.order_number
          });
        }
      }
    }

    if (notificationsToInsert.length > 0) {
      const { error: insertErr } = await supabase
        .from("notifications")
        .insert(notificationsToInsert);
        
      if (insertErr) {
        console.error("Failed to insert notifications:", insertErr);
      } else {
        console.log(`Inserted ${notificationsToInsert.length} notifications`);
      }
    }

    return ok({ sent: true, status: new_status, order_number: order.order_number });
  } catch (err) {
    console.error("send-order-notification error:", err);
    return ok({ sent: false, reason: String(err) });
  }
});
