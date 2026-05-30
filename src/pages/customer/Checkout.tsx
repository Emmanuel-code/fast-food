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
  const [deliveryAddr, setDeliveryAddr] = useState<{ lat?: number; lng?: number; details?: string }>({});
  const [locationLoading, setLocationLoading] = useState(false);
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

  useEffect(() => {
    if (items.length === 0) navigate('/cart');
  }, [items.length, navigate]);

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  if (items.length === 0 || !user) return null;

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
    if (orderType === 'delivery' && (!deliveryAddr.lat || !deliveryAddr.lng)) {
      toast.error('Please capture your delivery location');
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
    if (orderType === 'delivery' && (!deliveryAddr.lat || !deliveryAddr.lng)) {
      toast.error('Please capture your delivery location');
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
      {/* Sticky header */}
      <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border/50 px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/cart')}
          className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center hover:bg-accent transition-colors shrink-0"
        >
          <ArrowLeft size={15} />
        </button>
        <h1 className="text-lg font-black tracking-tight text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>Checkout</h1>
      </div>

      <div className="px-4 pt-4 pb-40 space-y-4">
        {/* Order type */}
        <section className="premium-card p-4 space-y-3">
          <h2 className="font-black text-sm text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>Order Type</h2>
          <div className="grid grid-cols-3 gap-2">
            {(['pickup', 'delivery', 'curbside'] as OrderType[]).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setOrderType(t)}
                className={`py-4 rounded-2xl text-xs font-bold border capitalize transition-all duration-200 flex flex-col items-center gap-1.5 ${
                  orderType === t
                    ? 'text-primary-foreground border-transparent shadow-md scale-[1.03]'
                    : 'bg-muted text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
                }`}
                style={orderType === t ? { background: 'linear-gradient(135deg, hsl(38 100% 50%), hsl(24 95% 45%))' } : {}}
              >
                {t === 'pickup' && <UtensilsCrossed size={18} />}
                {t === 'delivery' && <MapPin size={18} />}
                {t === 'curbside' && <Car size={18} />}
                {t}
              </button>
            ))}
          </div>
        </section>

        {/* Delivery location */}
        {orderType === 'delivery' && (
          <section className="premium-card p-4 space-y-3">
            <h2 className="font-black text-sm text-foreground flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
              <MapPin size={14} className="text-primary" />
              Delivery Location
            </h2>
            {(!deliveryAddr.lat || !deliveryAddr.lng) ? (
              <Button 
                type="button" 
                variant="outline"
                className="w-full h-12 rounded-xl font-bold border-primary/50 text-primary hover:bg-primary/5"
                onClick={() => {
                  setLocationLoading(true);
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      setDeliveryAddr({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                      setLocationLoading(false);
                      toast.success('Location captured successfully!');
                    },
                    (err) => {
                      setLocationLoading(false);
                      toast.error('Failed to get location. Please enable location services.');
                    },
                    { enableHighAccuracy: true }
                  );
                }}
                disabled={locationLoading}
              >
                {locationLoading ? <Loader2 size={16} className="animate-spin mr-2" /> : <MapPin size={16} className="mr-2" />}
                Use Current Location
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/20 rounded-xl">
                  <CheckCircle2 size={18} className="text-success shrink-0" />
                  <p className="text-xs font-medium text-success-foreground">Location successfully captured!</p>
                </div>
                <Input 
                  placeholder="Special directions (e.g. Blue gate, call upon arrival)" 
                  value={deliveryAddr.details || ''} 
                  onChange={e => setDeliveryAddr(p => ({ ...p, details: e.target.value }))} 
                  className="h-11 px-3 text-sm rounded-xl" 
                />
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full h-9 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setDeliveryAddr({})}
                >
                  Change Location
                </Button>
              </div>
            )}
          </section>
        )}

        {/* Curbside vehicle */}
        {orderType === 'curbside' && (
          <section className="premium-card p-4 space-y-3">
            <h2 className="font-black text-sm text-foreground flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
              <Car size={14} className="text-primary" />
              Vehicle Description
            </h2>
            <Input placeholder="e.g. Red Honda Civic" value={curbsideVehicle} onChange={e => setCurbsideVehicle(e.target.value)} className="h-11 px-3 text-sm rounded-xl" />
          </section>
        )}

        {/* Date & Time */}
        <section className="premium-card p-4 space-y-3">
          <h2 className="font-black text-sm text-foreground flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
            <Calendar size={14} className="text-primary" />
            Date &amp; Time
          </h2>

          {isOpen && (
            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl bg-muted/60 hover:bg-muted transition-colors">
              <input
                type="checkbox"
                checked={isAsap}
                onChange={e => setIsAsap(e.target.checked)}
                className="accent-primary w-4 h-4"
              />
              <div>
                <span className="text-sm font-bold text-foreground">ASAP</span>
                <p className="text-xs text-muted-foreground">Ready in ~{settings?.prep_time_estimate_minutes ?? 15} mins</p>
              </div>
            </label>
          )}

          {(!isAsap || !isOpen) && (
            <>
              {/* Date selector */}
              <div>
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Select Date</Label>
                <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                  {availableDates.map((date, i) => {
                    const isSelected = selectedDate && format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => { setSelectedDate(date); setSelectedSlot(''); }}
                        className={`shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all duration-200 ${
                          isSelected ? 'text-primary-foreground border-transparent shadow-sm scale-105' : 'bg-muted text-muted-foreground border-border hover:border-primary/50'
                        }`}
                        style={isSelected ? { background: 'linear-gradient(135deg, hsl(38 100% 50%), hsl(24 95% 45%))' } : {}}
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
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1">
                    <Clock size={11} />
                    Select Time
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {timeSlots.map(slot => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2.5 rounded-xl text-xs font-bold border transition-all duration-200 ${
                          selectedSlot === slot ? 'text-primary-foreground border-transparent shadow-sm' : 'bg-muted text-muted-foreground border-border hover:border-primary/50'
                        }`}
                        style={selectedSlot === slot ? { background: 'linear-gradient(135deg, hsl(38 100% 50%), hsl(24 95% 45%))' } : {}}
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
        <section className="premium-card p-4 space-y-2">
          <h2 className="font-black text-sm text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>Special Instructions</h2>
          <textarea
            placeholder="Any special requests? (optional)"
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={2}
            className="w-full px-3 py-2.5 text-sm bg-muted rounded-xl border border-border/60 resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
          />
        </section>

        {/* Tip */}
        <section className="premium-card p-4 space-y-3">
          <h2 className="font-black text-sm text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>Add a Tip 🙏</h2>
          <div className="flex gap-2 flex-wrap">
            {TIP_OPTIONS.map(p => (
              <button
                key={p}
                type="button"
                onClick={() => { setTipPct(p); setCustomTip(''); }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all duration-200 ${
                  tipPct === p && !customTip ? 'text-primary-foreground border-transparent shadow-sm' : 'bg-muted text-muted-foreground border-border hover:border-primary/50'
                }`}
                style={tipPct === p && !customTip ? { background: 'linear-gradient(135deg, hsl(38 100% 50%), hsl(24 95% 45%))' } : {}}
              >
                {p === 0 ? 'No tip' : `${p}%`}
              </button>
            ))}
            <Input
              placeholder="Custom $"
              value={customTip}
              onChange={e => { setCustomTip(e.target.value); setTipPct(-1); }}
              className="w-24 h-9 text-sm px-2 rounded-xl"
              type="number"
              min="0"
            />
          </div>
          <p className="text-xs text-muted-foreground font-medium">
            Tip amount: <span className="text-foreground font-bold">{formatCurrency(isNaN(tipAmount) ? 0 : tipAmount)}</span>
          </p>
        </section>

        {/* Promo code */}
        <section className="premium-card p-4 space-y-3">
          <h2 className="font-black text-sm text-foreground flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
            <Tag size={14} className="text-primary" />
            Promo Code
          </h2>
          {appliedPromo ? (
            <div className="flex items-center justify-between bg-success/10 border border-success/30 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-success shrink-0" />
                <div>
                  <p className="text-sm font-black text-foreground font-mono">{appliedPromo.promo.code}</p>
                  <p className="text-xs text-success font-medium">{appliedPromo.message}</p>
                </div>
              </div>
              <button type="button" onClick={handleRemovePromo} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors" aria-label="Remove promo code">
                <X size={15} />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                placeholder="Enter code (e.g. CHEF20)"
                value={promoInput}
                onChange={e => setPromoInput(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleApplyPromo()}
                className="flex-1 h-11 px-3 text-sm font-mono rounded-xl tracking-widest"
              />
              <Button
                type="button"
                onClick={handleApplyPromo}
                disabled={promoLoading || !promoInput.trim()}
                variant="outline"
                className="h-11 px-5 shrink-0 rounded-xl font-bold"
              >
                {promoLoading ? <Loader2 size={14} className="animate-spin" /> : 'Apply'}
              </Button>
            </div>
          )}
        </section>

        {/* Order summary */}
        <section className="premium-card p-5 space-y-2">
          <h2 className="font-black text-sm text-foreground mb-3" style={{ fontFamily: 'Outfit, sans-serif' }}>Order Summary</h2>
          {items.map(item => (
            <div key={`${item.menu_item_id}-${item.modifications}`} className="flex justify-between text-sm">
              <span className="text-muted-foreground font-medium">{item.qty}× {item.name}</span>
              <span className="font-semibold">{formatCurrency(item.price)}</span>
            </div>
          ))}
          <div className="border-t border-border/60 pt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground font-medium">Subtotal</span>
              <span className="font-semibold">{formatCurrency(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-success flex items-center gap-1 font-medium"><Tag size={11} />Discount ({appliedPromo?.promo.code})</span>
                <span className="text-success font-bold">−{formatCurrency(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground font-medium">Tax</span>
              <span className="font-semibold">{formatCurrency(taxOnDiscounted)}</span>
            </div>
            {deliveryFee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground font-medium">Delivery Fee</span>
                <span className="font-semibold">{formatCurrency(deliveryFee)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground font-medium">Tip</span>
              <span className="font-semibold">{formatCurrency(isNaN(tipAmount) ? 0 : tipAmount)}</span>
            </div>
            <div className="flex justify-between font-black text-base pt-1">
              <span>Total</span>
              <span style={{ background: 'linear-gradient(90deg, hsl(38 100% 50%), hsl(24 95% 45%))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {formatCurrency(total)}
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* Floating payment bar */}
      <div className="fixed bottom-16 left-0 right-0 z-50 px-4 pb-3 pt-3 bg-card/85 backdrop-blur-xl border-t border-border/50 max-w-lg mx-auto space-y-2">
        {/* Paystack – Mobile Money / Card */}
        <Button
          type="button"
          onClick={handlePayWithPaystack}
          disabled={paystackLoading || loading}
          className="w-full font-extrabold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{
            height: '3.25rem',
            background: 'linear-gradient(135deg, hsl(38 100% 50%), hsl(24 95% 45%))',
            color: 'hsl(30 100% 8%)',
            boxShadow: '0 4px 20px 0 rgba(245,158,11,0.4)',
          }}
        >
          {paystackLoading
            ? <Loader2 size={18} className="animate-spin" />
            : <span className="flex items-center gap-2 text-sm"><Smartphone size={16} />Pay with Mobile Money · {formatCurrency(total)}</span>
          }
        </Button>
        {/* Cash fallback */}
        <Button
          type="button"
          variant="outline"
          onClick={handlePlaceOrder}
          disabled={loading || paystackLoading}
          className="w-full h-11 text-sm font-bold rounded-xl border-border/70 hover:border-primary/50"
        >
          {loading
            ? <Loader2 size={16} className="animate-spin" />
            : <span className="flex items-center gap-2"><Banknote size={15} />Pay at {orderType === 'delivery' ? 'Delivery' : 'Pickup'}</span>
          }
        </Button>
      </div>
    </CustomerLayout>
  );
}
