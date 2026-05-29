import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Trash2, ShoppingCart, ChefHat, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/utils/timeSlots';

export default function Cart() {
  const { items, removeItem, updateQty, clearCart, subtotal } = useCart();
  const { settings } = useRestaurant();
  const navigate = useNavigate();

  const taxRate = settings?.tax_rate ?? 0.08;
  const taxAmount = subtotal * taxRate;
  const estimatedTotal = subtotal + taxAmount;

  if (items.length === 0) {
    return (
      <CustomerLayout>
        <div className="flex flex-col items-center justify-center min-h-[72vh] px-4 text-center">
          <div className="w-24 h-24 rounded-3xl bg-muted flex items-center justify-center mb-5 shadow-inner">
            <ShoppingCart size={36} className="text-muted-foreground/50" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Your cart is empty
          </h2>
          <p className="text-muted-foreground text-sm mt-2 max-w-xs">
            Discover our delicious menu and add something amazing!
          </p>
          <Button
            className="mt-7 h-12 px-8 rounded-xl font-extrabold text-sm transition-all hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, hsl(38 100% 50%), hsl(24 95% 45%))',
              color: 'hsl(30 100% 8%)',
              boxShadow: '0 4px 18px 0 rgba(245,158,11,0.35)',
            }}
            onClick={() => navigate('/menu')}
          >
            <ChefHat size={16} className="mr-2" />
            Browse Menu
          </Button>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border/50 px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-black tracking-tight text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Your Cart
          <span className="ml-2 text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {items.reduce((s, i) => s + i.qty, 0)} items
          </span>
        </h1>
        <button
          type="button"
          onClick={clearCart}
          className="flex items-center gap-1.5 text-xs font-bold text-destructive hover:bg-destructive/10 px-3 py-1.5 rounded-lg transition-colors"
        >
          <Trash2 size={12} />
          Clear all
        </button>
      </div>

      {/* Extra bottom padding for the floating checkout bar */}
      <div className="px-4 pt-4 pb-32 space-y-3">
        {/* Cart items */}
        {items.map(item => (
          <div
            key={`${item.menu_item_id}-${item.modifications}`}
            className="bg-card rounded-2xl border border-border/60 p-3.5 flex gap-3.5 shadow-sm transition-all hover:shadow-md"
          >
            {item.image_url ? (
              <div className="w-[68px] h-[68px] rounded-xl overflow-hidden shrink-0 bg-muted">
                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-[68px] h-[68px] rounded-xl shrink-0 bg-muted flex items-center justify-center text-2xl">
                🍔
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-foreground truncate">{item.name}</p>
              {item.modifications && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 italic">{item.modifications}</p>
              )}
              <div className="flex items-center justify-between mt-2.5">
                <span className="font-black text-primary text-sm">{formatCurrency(item.price)}</span>
                <div className="flex items-center gap-1.5">
                  {/* Quantity controls */}
                  <button
                    type="button"
                    onClick={() => updateQty(item.menu_item_id, item.modifications, item.qty - 1)}
                    className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center hover:bg-accent transition-all active:scale-90"
                  >
                    <Minus size={11} />
                  </button>
                  <span className="w-6 text-center text-sm font-black">{item.qty}</span>
                  <button
                    type="button"
                    onClick={() => updateQty(item.menu_item_id, item.modifications, item.qty + 1)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-90 text-primary-foreground"
                    style={{ background: 'linear-gradient(135deg, hsl(38 100% 50%), hsl(24 95% 45%))' }}
                  >
                    <Plus size={11} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(item.menu_item_id, item.modifications)}
                    className="w-7 h-7 rounded-lg bg-destructive/10 flex items-center justify-center hover:bg-destructive/25 transition-all active:scale-90 ml-0.5"
                  >
                    <Trash2 size={11} className="text-destructive" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Order summary */}
        <div className="premium-card p-5 mt-4">
          <h2 className="font-black text-sm text-foreground mb-3" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Order Summary
          </h2>
          <div className="space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground font-medium">Subtotal</span>
              <span className="font-semibold">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground font-medium">Tax ({(taxRate * 100).toFixed(0)}%)</span>
              <span className="font-semibold">{formatCurrency(taxAmount)}</span>
            </div>
            <div className="border-t border-border/60 pt-2.5 flex justify-between">
              <span className="font-black text-foreground">Estimated Total</span>
              <span
                className="font-black text-lg"
                style={{ background: 'linear-gradient(90deg, hsl(38 100% 50%), hsl(24 95% 45%))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
              >
                {formatCurrency(estimatedTotal)}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground/70 mt-3 text-center">
            Final total confirmed at checkout
          </p>
        </div>
      </div>

      {/* Floating checkout bar */}
      <div className="fixed bottom-16 left-0 right-0 z-50 px-4 pb-3 pt-3 bg-card/85 backdrop-blur-xl border-t border-border/50 max-w-lg mx-auto">
        <Button
          type="button"
          className="w-full h-13 text-sm font-extrabold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-between px-5"
          style={{
            height: '3.25rem',
            background: 'linear-gradient(135deg, hsl(38 100% 50%), hsl(24 95% 45%))',
            color: 'hsl(30 100% 8%)',
            boxShadow: '0 4px 20px 0 rgba(245,158,11,0.4)',
          }}
          onClick={() => navigate('/checkout')}
        >
          <span>Proceed to Checkout</span>
          <div className="flex items-center gap-2">
            <span className="font-black">{formatCurrency(estimatedTotal)}</span>
            <ArrowRight size={16} />
          </div>
        </Button>
      </div>
    </CustomerLayout>
  );
}
