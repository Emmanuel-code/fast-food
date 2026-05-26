import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import type { OrderType } from '@/types/types';
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft, MapPin, Clock, Calendar, Car, UtensilsCrossed, Smartphone, Banknote, Tag, CheckCircle2, X } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { formatCurrency, getAvailableDates, generateTimeSlots } from '@/utils/timeSlots';
import { validatePromoCode } from '@/services/promoService';
import type { PromoCode } from '@/services/promoService';

const TIP_OPTIONS = [0, 10, 15, 20, 25];

export default function Checkout() {
  const navigate = useNavigate();
  const { items, subtotal, clearCart } = useCart();
  const { settings, isOpen } = useRestaurant();
  const { user } = useAuth();

  const [orderType, setOrderType] = useState<OrderType>('pickup');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string>('ASAP');
  const [isAsap, setIsAsap] = useState(true);
  const [deliveryAddr, setDeliveryAddr] = useState({ line1: '', city: '', state: '', zip: '' });
  const [curbsideVehicle, setCurbsideVehicle] = useState('');
  const [note, setNote] = useState('');
  const [tipPct, setTipPct] = useState(15);
  const [customTip, setCustomTip] = useState('');
  const [loading, setLoading] = useState(false);
  const [paystackLoading, setPaystackLoading] = useState(false);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  // Promo code state
  const [promoInput, setPromoInput] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<{ promo: PromoCode; discount: number; message: string } | null>(null);

  const availableDates = settings ? getAvailableDates(settings) : [];

  useEffect(() => {
    if (!settings) return;
    if (selectedDate) {
      setTimeSlots(generateTimeSlots(selectedDate, settings));
    } else if (availableDates.length > 0) {
      setSelectedDate(availableDates[0]);
    }
  }, [selectedDate, settings]);

  useEffect(() => {
    if (!selectedDate || !settings) return;
    setTimeSlots(generateTimeSlots(selectedDate, settings));
  }, [selectedDate, settings]);

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  const deliveryFee = orderType === 'delivery' ? (settings?.delivery_fee ?? 3.99) : 0;
  const tipAmount = customTip ? parseFloat(customTip) : subtotal * (tipPct / 100);
  const discount = appliedPromo?.discount ?? 0;
  const discountedSubtotal = Math.max(0, subtotal - discount);
  const taxOnDiscounted = discountedSubtotal * (settings?.tax_rate ?? 0.08);
  const total = discountedSubtotal + taxOnDiscounted + deliveryFee + (isNaN(tipAmount) ? 0 : tipAmount);

  const getScheduledTime = (): string | null => {
    if (isAsap) return null;
    if (!selectedDate || !selectedSlot || selectedSlot === 'ASAP') return null;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const parsed = new Date(`${dateStr} ${selectedSlot}`);
    return isNaN(parsed.getTime()) ? null : parsed.toISOString();
  };

  const buildOrderPayload = () => ({
    items: items.map(i => ({
      menu_item_id: i.menu_item_id,
      name: i.name,
      qty: i.qty,
      modifications: i.modifications,
      price: i.price,
    })),
    subtotal,
    discount,
    tax: taxOnDiscounted,
    delivery_fee: deliveryFee,
    tip: isNaN(tipAmount) ? 0 : tipAmount,
    total,
    type: orderType,
    scheduled_time: getScheduledTime() ?? undefined,
    customer_note: note,
    delivery_address: orderType === 'delivery' ? deliveryAddr : undefined,
    curbside_vehicle: orderType === 'curbside' ? curbsideVehicle : undefined,
    is_asap: isAsap,
    promo_code: appliedPromo?.promo.code ?? null,
  });

  const validateSlot = async (): Promise<boolean> => {
    if (isAsap || !selectedDate || selectedSlot === 'ASAP') return true;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const parsed = new Date(`${format(selectedDate, 'yyyy-MM-dd')} ${selectedSlot}`);
    const timeStr = format(parsed, 'HH:mm');
    const { data, error } = await supabase.functions.invoke('validate-pre-order', {
      body: { scheduledDate: dateStr, slotTime: timeStr },
    });
    if (error) {
      const msg = await error?.context?.text?.();
      toast.error(msg || 'Could not validate time slot');
      return false;
    }
    if (!data?.valid) {
      toast.error(data?.reason || 'Selected time slot is no longer available');
      return false;
    }
    return true;
  };

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    try {
      const result = await validatePromoCode(promoInput, subtotal);
      if (result.valid && result.promo) {
        setAppliedPromo({ promo: result.promo, discount: result.discount, message: result.message });
        toast.success(result.message);
        setPromoInput('');
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('Failed to validate promo code');
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoInput('');
  };

  // Cash / Pay-at-pickup flow
  const handlePlaceOrder = async () => {
    if (orderType === 'delivery' && (!deliveryAddr.line1 || !deliveryAddr.city)) {
      toast.error('Please enter your delivery address');
      return;
    }
    setLoading(true);
    try {
      if (!(await validateSlot())) return;

      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user!.id,
          ...buildOrderPayload(),
          status: 'new',
          payment_method: 'cash',
          payment_status: 'unpaid',
        })
        .select()
        .maybeSingle();

      if (orderError) throw orderError;
      clearCart();
      toast.success('Order placed! Pay at pickup.');
      navigate(`/orders/${newOrder.id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  // Paystack / Mobile Money flow
  const handlePayWithPaystack = async () => {
    if (orderType === 'delivery' && (!deliveryAddr.line1 || !deliveryAddr.city)) {
      toast.error('Please enter your delivery address');
      return;
    }
    if (!user?.email) {
      toast.error('Please log in to pay online');
      return;
    }
    setPaystackLoading(true);
    try {
      if (!(await validateSlot())) return;

      const callbackUrl = `${window.location.origin}/payment-success`;
      const { data, error } = await supabase.functions.invoke('create-paystack-charge', {
        body: {
          order: buildOrderPayload(),
          callback_url: callbackUrl,
          customer_email: user.email,
        },
      });

      if (error) {
        const msg = await error?.context?.text?.();
        toast.error(msg || 'Failed to initialize payment');
        return;
      }

      if (!data?.data?.authorization_url) {
        toast.error('No payment URL received. Please try again.');
        return;
      }

      clearCart();
      toast.success('Redirecting to secure payment...');
      window.open(data.data.authorization_url, '_blank');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Payment initialization failed');
    } finally {
      setPaystackLoading(false);
    }
  };

  return (
    <CustomerLayout>
      <div className="px-4 pt-5 pb-4">
        <button onClick={() => navigate('/cart')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft size={16} />
          Back to Cart
        </button>
        <h1 className="text-xl font-bold text-foreground">Checkout</h1>
      </div>

      <div className="px-4 pb-40 space-y-5">
        {/* Order type */}
        <section className="bg-card rounded-xl border border-border p-4 space-y-3">
          <h2 className="font-semibold text-sm text-foreground">Order Type</h2>
          <div className="grid grid-cols-3 gap-2">
            {(['pickup', 'delivery', 'curbside'] as OrderType[]).map(t => (
              <button
                key={t}
                onClick={() => setOrderType(t)}
                className={`py-3 rounded-xl text-xs font-semibold border capitalize transition-colors ${
                  orderType === t ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground border-border hover:border-primary/50'
                }`}
              >
                {t === 'pickup' && <UtensilsCrossed size={14} className="mx-auto mb-1" />}
                {t === 'delivery' && <MapPin size={14} className="mx-auto mb-1" />}
                {t === 'curbside' && <Car size={14} className="mx-auto mb-1" />}
                {t}
              </button>
            ))}
          </div>
        </section>

        {/* Delivery address */}
        {orderType === 'delivery' && (
          <section className="bg-card rounded-xl border border-border p-4 space-y-3">
            <h2 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <MapPin size={14} />
              Delivery Address
            </h2>
            <div className="space-y-2">
              <Input
                placeholder="Street address"
                value={deliveryAddr.line1}
                onChange={e => setDeliveryAddr(p => ({ ...p, line1: e.target.value }))}
                className="h-10 px-3 text-sm"
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="City"
                  value={deliveryAddr.city}
                  onChange={e => setDeliveryAddr(p => ({ ...p, city: e.target.value }))}
                  className="h-10 px-3 text-sm"
                />
                <Input
                  placeholder="State"
                  value={deliveryAddr.state}
                  onChange={e => setDeliveryAddr(p => ({ ...p, state: e.target.value }))}
                  className="h-10 px-3 text-sm"
                />
              </div>
              <Input
                placeholder="ZIP code"
                value={deliveryAddr.zip}
                onChange={e => setDeliveryAddr(p => ({ ...p, zip: e.target.value }))}
                className="h-10 px-3 text-sm"
              />
            </div>
          </section>
        )}

        {/* Curbside vehicle */}
        {orderType === 'curbside' && (
          <section className="bg-card rounded-xl border border-border p-4 space-y-3">
            <h2 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <Car size={14} />
              Vehicle Description
            </h2>
            <Input
              placeholder="e.g. Red Honda Civic"
              value={curbsideVehicle}
              onChange={e => setCurbsideVehicle(e.target.value)}
              className="h-10 px-3 text-sm"
            />
          </section>
        )}

        {/* Date & Time */}
        <section className="bg-card rounded-xl border border-border p-4 space-y-3">
          <h2 className="font-semibold text-sm text-foreground flex items-center gap-2">
            <Calendar size={14} />
            Date &amp; Time
          </h2>

          {isOpen && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isAsap}
                onChange={e => setIsAsap(e.target.checked)}
                className="accent-primary"
              />
              <span className="text-sm font-medium text-foreground">ASAP (as soon as possible)</span>
            </label>
          )}

          {(!isAsap || !isOpen) && (
            <>
              {/* Date selector */}
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Select Date</Label>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {availableDates.map((date, i) => {
                    const isSelected = selectedDate && format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                    return (
                      <button
                        key={i}
                        onClick={() => { setSelectedDate(date); setSelectedSlot(''); }}
                        className={`shrink-0 px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                          isSelected ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground border-border hover:border-primary/50'
                        }`}
                      >
                        {i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : format(date, 'EEE, MMM d')}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Slot selector */}
              {selectedDate && timeSlots.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block flex items-center gap-1">
                    <Clock size={12} />
                    Select Time
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {timeSlots.map(slot => (
                      <button
                        key={slot}
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2 rounded-lg text-xs font-medium border transition-colors ${
                          selectedSlot === slot ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground border-border hover:border-primary/50'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        {/* Special instructions */}
        <section className="bg-card rounded-xl border border-border p-4 space-y-2">
          <h2 className="font-semibold text-sm text-foreground">Special Instructions</h2>
          <textarea
            placeholder="Any special requests? (optional)"
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 text-sm bg-muted rounded-lg border border-border resize-none focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </section>

        {/* Tip */}
        <section className="bg-card rounded-xl border border-border p-4 space-y-3">
          <h2 className="font-semibold text-sm text-foreground">Add a Tip</h2>
          <div className="flex gap-2 flex-wrap">
            {TIP_OPTIONS.map(p => (
              <button
                key={p}
                onClick={() => { setTipPct(p); setCustomTip(''); }}
                className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                  tipPct === p && !customTip ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground border-border'
                }`}
              >
                {p === 0 ? 'No tip' : `${p}%`}
              </button>
            ))}
            <Input
              placeholder="Custom $"
              value={customTip}
              onChange={e => { setCustomTip(e.target.value); setTipPct(-1); }}
              className="w-24 h-9 text-sm px-2"
              type="number"
              min="0"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Tip: {formatCurrency(isNaN(tipAmount) ? 0 : tipAmount)}
          </p>
        </section>

        {/* Promo code */}
        <section className="bg-card rounded-xl border border-border p-4 space-y-3">
          <h2 className="font-semibold text-sm text-foreground flex items-center gap-2">
            <Tag size={14} />
            Promo Code
          </h2>
          {appliedPromo ? (
            <div className="flex items-center justify-between bg-success/10 border border-success/30 rounded-lg px-3 py-2.5">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-success shrink-0" />
                <div>
                  <p className="text-sm font-bold text-foreground font-mono">{appliedPromo.promo.code}</p>
                  <p className="text-xs text-success">{appliedPromo.message}</p>
                </div>
              </div>
              <button onClick={handleRemovePromo} className="p-1 text-muted-foreground hover:text-destructive transition-colors" aria-label="Remove promo code">
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                placeholder="Enter code (e.g. CHEF20)"
                value={promoInput}
                onChange={e => setPromoInput(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleApplyPromo()}
                className="flex-1 h-10 px-3 text-sm font-mono"
              />
              <Button
                onClick={handleApplyPromo}
                disabled={promoLoading || !promoInput.trim()}
                variant="outline"
                className="h-10 px-4 shrink-0"
              >
                {promoLoading ? <Loader2 size={14} className="animate-spin" /> : 'Apply'}
              </Button>
            </div>
          )}
        </section>

        {/* Order summary */}
        <section className="bg-card rounded-xl border border-border p-4 space-y-2">
          <h2 className="font-semibold text-sm text-foreground mb-1">Order Summary</h2>
          {items.map(item => (
            <div key={`${item.menu_item_id}-${item.modifications}`} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{item.qty}x {item.name}</span>
              <span>{formatCurrency(item.price)}</span>
            </div>
          ))}
          <div className="border-t border-border pt-2 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-success flex items-center gap-1"><Tag size={11} />Discount ({appliedPromo?.promo.code})</span>
                <span className="text-success">−{formatCurrency(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax</span>
              <span>{formatCurrency(taxOnDiscounted)}</span>
            </div>
            {deliveryFee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delivery Fee</span>
                <span>{formatCurrency(deliveryFee)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tip</span>
              <span>{formatCurrency(isNaN(tipAmount) ? 0 : tipAmount)}</span>
            </div>
            <div className="flex justify-between font-bold text-base pt-1">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(total)}</span>
            </div>
          </div>
        </section>
      </div>

      {/* Bottom action buttons */}
      <div className="fixed bottom-16 left-0 right-0 px-4 pb-4 pt-3 bg-background/95 backdrop-blur-sm border-t border-border max-w-lg mx-auto space-y-2">
        {/* Paystack – Mobile Money / Card */}
        <Button
          onClick={handlePayWithPaystack}
          disabled={paystackLoading || loading}
          className="w-full h-12 text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {paystackLoading
            ? <Loader2 size={18} className="animate-spin" />
            : (
              <span className="flex items-center gap-2">
                <Smartphone size={16} />
                Pay with Mobile Money / Card · {formatCurrency(total)}
              </span>
            )}
        </Button>
        {/* Cash fallback */}
        <Button
          variant="outline"
          onClick={handlePlaceOrder}
          disabled={loading || paystackLoading}
          className="w-full h-10 text-sm font-semibold"
        >
          {loading
            ? <Loader2 size={16} className="animate-spin" />
            : (
              <span className="flex items-center gap-2">
                <Banknote size={15} />
                Pay at {orderType === 'delivery' ? 'Delivery' : 'Pickup'}
              </span>
            )}
        </Button>
      </div>
    </CustomerLayout>
  );
}
