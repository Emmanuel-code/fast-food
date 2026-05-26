import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Trash2, ShoppingCart, ChefHat } from 'lucide-react';
import { formatCurrency } from '@/utils/timeSlots';

export default function Cart() {
  const { items, removeItem, updateQty, clearCart, subtotal } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <CustomerLayout>
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <ShoppingCart size={28} className="text-muted-foreground" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Your cart is empty</h2>
          <p className="text-muted-foreground text-sm mt-1">Add some delicious items to get started!</p>
          <Button
            className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90"
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
      <div className="px-4 pt-5 pb-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Your Cart</h1>
        <button
          onClick={clearCart}
          className="text-xs text-destructive hover:text-destructive/80 transition-colors flex items-center gap-1"
        >
          <Trash2 size={12} />
          Clear all
        </button>
      </div>

      <div className="px-4 space-y-3">
        {/* Items */}
        {items.map(item => (
          <div
            key={`${item.menu_item_id}-${item.modifications}`}
            className="bg-card rounded-xl border border-border p-3 flex gap-3"
          >
            {item.image_url && (
              <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-muted">
                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground truncate">{item.name}</p>
              {item.modifications && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.modifications}</p>
              )}
              <div className="flex items-center justify-between mt-2">
                <span className="font-bold text-primary text-sm">{formatCurrency(item.price)}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => updateQty(item.menu_item_id, item.modifications, item.qty - 1)}
                    className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center hover:bg-accent transition-colors"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="w-6 text-center text-sm font-medium">{item.qty}</span>
                  <button
                    onClick={() => updateQty(item.menu_item_id, item.modifications, item.qty + 1)}
                    className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center hover:bg-accent transition-colors"
                  >
                    <Plus size={12} />
                  </button>
                  <button
                    onClick={() => removeItem(item.menu_item_id, item.modifications)}
                    className="w-7 h-7 rounded-lg bg-destructive/10 flex items-center justify-center hover:bg-destructive/20 transition-colors ml-1"
                  >
                    <Trash2 size={12} className="text-destructive" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Summary */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tax (8%)</span>
            <span className="font-medium">{formatCurrency(subtotal * 0.08)}</span>
          </div>
          <div className="border-t border-border pt-2 flex justify-between font-bold">
            <span>Estimated Total</span>
            <span className="text-primary">{formatCurrency(subtotal * 1.08)}</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">Final total calculated at checkout</p>
      </div>

      {/* Checkout button */}
      <div className="fixed bottom-16 left-0 right-0 px-4 pb-4 pt-3 bg-background/95 backdrop-blur-sm border-t border-border max-w-lg mx-auto">
        <Button
          className="w-full h-12 text-base font-bold bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={() => navigate('/checkout')}
        >
          Proceed to Checkout · {formatCurrency(subtotal * 1.08)}
        </Button>
      </div>
    </CustomerLayout>
  );
}
