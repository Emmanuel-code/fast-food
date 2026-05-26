import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { scheduledDate, slotTime } = await req.json();

    if (!scheduledDate || !slotTime) {
      return new Response(JSON.stringify({ valid: false, reason: 'Missing scheduledDate or slotTime' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get settings
    const { data: settings } = await supabaseAdmin
      .from('restaurant_settings')
      .select('max_orders_per_slot, closed_temporarily, opening_hours, max_pre_order_days')
      .eq('id', 1)
      .maybeSingle();

    if (!settings) {
      return new Response(JSON.stringify({ valid: false, reason: 'Could not load settings' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (settings.closed_temporarily) {
      return new Response(JSON.stringify({ valid: false, reason: 'Restaurant is currently closed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if date is within max_pre_order_days
    const today = new Date();
    const orderDate = new Date(scheduledDate);
    const daysDiff = Math.floor((orderDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > settings.max_pre_order_days) {
      return new Response(JSON.stringify({ valid: false, reason: 'Date exceeds max pre-order days' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Count existing orders for this slot
    const slotStart = `${scheduledDate}T${slotTime}:00`;
    const slotEnd = `${scheduledDate}T${slotTime}:59`;

    const { count, error: countError } = await supabaseAdmin
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .gte('scheduled_time', slotStart)
      .lte('scheduled_time', slotEnd)
      .eq('is_asap', false)
      .not('status', 'eq', 'cancelled');

    if (countError) {
      return new Response(JSON.stringify({ valid: false, reason: 'Could not check slot capacity' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const currentCount = count ?? 0;
    if (currentCount >= settings.max_orders_per_slot) {
      return new Response(JSON.stringify({
        valid: false,
        reason: `Time slot is full (${currentCount}/${settings.max_orders_per_slot} orders)`,
        currentCount,
        maxOrders: settings.max_orders_per_slot,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      valid: true,
      currentCount,
      maxOrders: settings.max_orders_per_slot,
      remaining: settings.max_orders_per_slot - currentCount,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ valid: false, reason: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
