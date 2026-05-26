import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import type { MenuItem, OrderType } from '@/types/types';
import { MENU_CATEGORIES } from '@/types/types';
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CalendarClock, ChefHat, ArrowLeft, Plus, Minus, ShoppingCart,
  MapPin, Car, UtensilsCrossed, Loader2, Calendar, Clock
} from 'lucide-react';
import { formatCurrency, getAvailableDates, generateTimeSlots } from '@/utils/timeSlots';
import { format, addDays } from 'date-fns';
import { toast } from 'sonner';

export default function PreOrder() {
  const navigate = useNavigate();
  const { settings } = useRestaurant();
  const { user } = useAuth();
  const { addItem, items, subtotal, clearCart } = useCart();

  const [step, setStep] = useState<'date' | 'menu' | 'checkout'>('date');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [orderType, setOrderType] = useState<OrderType>('pickup');
  const [deliveryAddr, setDeliveryAddr] = useState({ line1: '', city: '', state: '', zip: '' });
  const [note, setNote] = useState('');
  const [tipPct, setTipPct] = useState(15);
  const [placing, setPlacing] = useState(false);

  // Only future dates (not today)
  const futureDates = settings
    ? getAvailableDates(settings).filter(d => format(d, 'yyyy-MM-dd') !== format(new Date(), 'yyyy-MM-dd'))
    : [];

  useEffect(() => {
    if (!selectedDate || !settings) return;
    setTimeSlots(generateTimeSlots(selectedDate, settings));
  }, [selectedDate, settings]);

  const fetchMenu = async () => {
    setMenuLoading(true);
    const { data } = await supabase
      .from('menu_items')
      .select('*')
      .eq('available', true)
      .gt('remaining', 0)
      .order('sort_order', { ascending: true });
    setMenuItems(Array.isArray(data) ? (data as MenuItem[]) : []);
    setMenuLoading(false);
  };

  const handleDateContinue = () => {
    if (!selectedDate) { toast.error('Please select a date'); return; }
    if (!selectedSlot) { toast.error('Please select a time slot'); return; }
    fetchMenu();
    setStep('menu');
  };

  const handleMenuContinue = () => {
    if (items.length === 0) { toast.error('Please add at least one item'); return; }
    setStep('checkout');
  };

  const handlePlaceOrder = async () => {
    if (!user) { navigate('/login'); return; }
    if (orderType === 'delivery' && (!deliveryAddr.line1 || !deliveryAddr.city)) {
      toast.error('Please enter your delivery address');
      return;
    }
    if (!selectedDate || !selectedSlot) { toast.error('Please select date and time'); return; }

    setPlacing(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const parsed = new Date(`${dateStr} ${selectedSlot}`);
      const timeStr = format(parsed, 'HH:mm');

      // Validate slot
      const { data: valData, error: valErr } = await supabase.functions.invoke(
        'validate-pre-order',
        { body: { scheduledDate: dateStr, slotTime: timeStr } }
      );
      if (valErr || !valData?.valid) {
        const msg = await valErr?.context?.text?.();
        toast.error(msg || valData?.reason || 'Time slot is not available');
        setPlacing(false);
        return;
      }

      const tax = subtotal * (settings?.tax_rate ?? 0.08);
      const deliveryFee = orderType === 'delivery' ? (settings?.delivery_fee ?? 3.99) : 0;
      const tipAmount = subtotal * (tipPct / 100);
      const total = subtotal + tax + deliveryFee + tipAmount;

      const orderItems = items.map(i => ({
        menu_item_id: i.menu_item_id,
        name: i.name,
        qty: i.qty,
        modifications: i.modifications,
        price: i.price,
      }));

      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          items: orderItems,
          subtotal,
          tax,
          delivery_fee: deliveryFee,
          tip: tipAmount,
          total,
          type: orderType,
          status: 'new',
          scheduled_time: parsed.toISOString(),
          customer_note: note,
          kitchen_note: '',
          delivery_address: orderType === 'delivery' ? deliveryAddr : null,
          is_asap: false,
        })
        .select()
        .maybeSingle();

      if (orderError) throw orderError;

      clearCart();
      toast.success('Pre-order placed!');
      navigate(`/orders/${newOrder.id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  const categories = ['All', ...MENU_CATEGORIES.filter(c => menuItems.some(i => i.category === c))];
  const filtered = activeCategory === 'All' ? menuItems : menuItems.filter(i => i.category === activeCategory);
  const tax = subtotal * (settings?.tax_rate ?? 0.08);
  const deliveryFee = orderType === 'delivery' ? (settings?.delivery_fee ?? 3.99) : 0;
  const tipAmount = subtotal * (tipPct / 100);
  const total = subtotal + tax + deliveryFee + tipAmount;

  return (
    <CustomerLayout>
      {/* Header */}
      <div className="px-4 pt-5 pb-3">
        <button
          onClick={() => step === 'date' ? navigate('/menu') : setStep(step === 'checkout' ? 'menu' : 'date')}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-3"
        >
          <ArrowLeft size={16} />
          {step === 'date' ? 'Back to Menu' : step === 'menu' ? 'Change Date' : 'Back to Menu'}
        </button>
        <div className="flex items-center gap-2">
          <CalendarClock size={20} className="text-primary" />
          <h1 className="text-xl font-bold text-foreground">Pre-Order</h1>
        </div>
        {/* Progress */}
        <div className="flex items-center gap-2 mt-3">
          {['date', 'menu', 'checkout'].map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`h-1 rounded-full flex-1 transition-all ${step === s || (i === 0 && step !== 'date') || (i === 1 && step === 'checkout') ? 'bg-primary' : 'bg-muted'}`} />
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 pb-32 space-y-4">
        {/* Step 1: Date & Time */}
        {step === 'date' && (
          <>
            <div className="bg-card rounded-xl border border-border p-4 space-y-4">
              <h2 className="font-semibold text-sm text-foreground flex items-center gap-2">
                <Calendar size={14} />
                Select a Date
              </h2>
              {futureDates.length === 0 ? (
                <p className="text-sm text-muted-foreground">No pre-order dates available right now.</p>
              ) : (
                <div className="flex gap-2 flex-wrap">
                  {futureDates.map((date, i) => {
                    const isSelected = selectedDate && format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                    return (
                      <button
                        key={i}
                        onClick={() => { setSelectedDate(date); setSelectedSlot(''); }}
                        className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors ${isSelected ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground border-border hover:border-primary/50'}`}
                      >
                        {i === 0 ? 'Tomorrow' : format(date, 'EEE, MMM d')}
                      </button>
                    );
                  })}
                </div>
              )}

              {selectedDate && timeSlots.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Clock size={13} />
                    Select Time
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {timeSlots.map(slot => (
                      <button
                        key={slot}
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2 rounded-lg text-xs font-medium border transition-colors ${selectedSlot === slot ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground border-border hover:border-primary/50'}`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Button
              onClick={handleDateContinue}
              disabled={!selectedDate || !selectedSlot}
              className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            >
              Continue to Menu
            </Button>
          </>
        )}

        {/* Step 2: Menu selection */}
        {step === 'menu' && (
          <>
            <div className="bg-primary/10 rounded-xl p-3 flex items-center gap-2">
              <CalendarClock size={16} className="text-primary" />
              <span className="text-sm font-medium text-foreground">
                {selectedDate && format(selectedDate, 'EEE, MMM d')} at {selectedSlot}
              </span>
            </div>

            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto pb-1 whitespace-nowrap">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors shrink-0 ${activeCategory === cat ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border'}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {menuLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filtered.map(item => (
                  <div
                    key={item.id}
                    className="bg-card rounded-xl border border-border overflow-hidden cursor-pointer"
                    onClick={() => navigate(`/menu/${item.id}`)}
                  >
                    <div className="aspect-[4/3] bg-muted">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><ChefHat size={24} className="text-muted-foreground" /></div>
                      )}
                    </div>
                    <div className="p-2.5">
                      <p className="font-semibold text-xs text-foreground truncate">{item.name}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-xs font-bold text-primary">{formatCurrency(item.price)}</span>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            addItem({ menu_item_id: item.id, name: item.name, price: item.price, qty: 1, modifications: '', image_url: item.image_url, unit_price: item.price });
                            toast.success(`${item.name} added`);
                          }}
                          className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {items.length > 0 && (
              <Button
                onClick={handleMenuContinue}
                className="w-full h-11 bg-primary text-primary-foreground font-semibold gap-2"
              >
                <ShoppingCart size={16} />
                Continue · {items.length} item{items.length !== 1 ? 's' : ''} · {formatCurrency(subtotal)}
              </Button>
            )}
          </>
        )}

        {/* Step 3: Checkout */}
        {step === 'checkout' && (
          <>
            <div className="bg-primary/10 rounded-xl p-3 flex items-center gap-2">
              <CalendarClock size={16} className="text-primary" />
              <span className="text-sm font-medium text-foreground">
                Pre-order for {selectedDate && format(selectedDate, 'EEE, MMM d')} at {selectedSlot}
              </span>
            </div>

            {/* Order type */}
            <div className="bg-card rounded-xl border border-border p-4 space-y-3">
              <h2 className="font-semibold text-sm">Order Type</h2>
              <div className="grid grid-cols-3 gap-2">
                {(['pickup', 'delivery', 'curbside'] as OrderType[]).map(t => (
                  <button key={t} onClick={() => setOrderType(t)}
                    className={`py-3 rounded-xl text-xs font-semibold border capitalize transition-colors ${orderType === t ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground border-border'}`}>
                    {t === 'pickup' && <UtensilsCrossed size={14} className="mx-auto mb-1" />}
                    {t === 'delivery' && <MapPin size={14} className="mx-auto mb-1" />}
                    {t === 'curbside' && <Car size={14} className="mx-auto mb-1" />}
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {orderType === 'delivery' && (
              <div className="bg-card rounded-xl border border-border p-4 space-y-2">
                <h2 className="font-semibold text-sm">Delivery Address</h2>
                <Input placeholder="Street address" value={deliveryAddr.line1} onChange={e => setDeliveryAddr(p => ({ ...p, line1: e.target.value }))} className="h-10 px-3 text-sm" />
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="City" value={deliveryAddr.city} onChange={e => setDeliveryAddr(p => ({ ...p, city: e.target.value }))} className="h-10 px-3 text-sm" />
                  <Input placeholder="State" value={deliveryAddr.state} onChange={e => setDeliveryAddr(p => ({ ...p, state: e.target.value }))} className="h-10 px-3 text-sm" />
                </div>
              </div>
            )}

            {/* Tip */}
            <div className="bg-card rounded-xl border border-border p-4 space-y-2">
              <h2 className="font-semibold text-sm">Tip</h2>
              <div className="flex gap-2">
                {[0, 10, 15, 20].map(p => (
                  <button key={p} onClick={() => setTipPct(p)}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-colors ${tipPct === p ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground border-border'}`}>
                    {p === 0 ? 'None' : `${p}%`}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-card rounded-xl border border-border p-4 space-y-2">
              <h2 className="font-semibold text-sm mb-2">Order Summary</h2>
              {items.map(item => (
                <div key={`${item.menu_item_id}-${item.modifications}`} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.qty}x {item.name}</span>
                  <span>{formatCurrency(item.price)}</span>
                </div>
              ))}
              <div className="border-t border-border pt-2 space-y-1">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Tax</span><span>{formatCurrency(tax)}</span></div>
                {deliveryFee > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Delivery</span><span>{formatCurrency(deliveryFee)}</span></div>}
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Tip</span><span>{formatCurrency(tipAmount)}</span></div>
                <div className="flex justify-between font-bold pt-1"><span>Total</span><span className="text-primary">{formatCurrency(total)}</span></div>
              </div>
              <p className="text-xs text-muted-foreground text-center">Pay at Pickup/Delivery</p>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Special Instructions</Label>
              <textarea
                placeholder="Any special requests?"
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 text-sm bg-muted rounded-lg border border-border resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <Button
              onClick={handlePlaceOrder}
              disabled={placing}
              className="w-full h-12 text-base font-bold bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {placing ? <Loader2 size={18} className="animate-spin" /> : `Place Pre-Order · ${formatCurrency(total)}`}
            </Button>
          </>
        )}
      </div>
    </CustomerLayout>
  );
}
