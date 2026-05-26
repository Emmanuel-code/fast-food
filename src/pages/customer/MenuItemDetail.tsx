import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMenuItem } from '@/services/menuService';
import type { MenuItem, CartItem } from '@/types/types';
import { useCart } from '@/contexts/CartContext';
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChefHat, Minus, Plus, ShoppingCart, Star } from 'lucide-react';
import { formatCurrency } from '@/utils/timeSlots';
import { toast } from 'sonner';
import { getReviewsForItem } from '@/services/reviewService';
import type { Review } from '@/services/reviewService';

const DIETARY_COLORS: Record<string, string> = {
  vegetarian: 'bg-green-100 text-green-700',
  vegan: 'bg-green-100 text-green-800',
  'gluten-free': 'bg-yellow-100 text-yellow-700',
  spicy: 'bg-red-100 text-red-700',
  halal: 'bg-blue-100 text-blue-700',
};

export default function MenuItemDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [item, setItem] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    getMenuItem(id)
      .then(data => {
        setItem(data);
        setLoading(false);
        // Load reviews
        setReviewsLoading(true);
        getReviewsForItem(id)
          .then(r => setReviews(r))
          .finally(() => setReviewsLoading(false));
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <CustomerLayout>
        <div className="p-4 space-y-4">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="aspect-[4/3] rounded-2xl" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </CustomerLayout>
    );
  }

  if (!item) {
    return (
      <CustomerLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
          <ChefHat size={48} className="text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">Item not found</p>
          <Button variant="outline" onClick={() => navigate('/menu')} className="mt-4">
            Back to Menu
          </Button>
        </div>
      </CustomerLayout>
    );
  }

  const buildModifications = () => {
    const parts: string[] = [];
    Object.entries(selectedOptions).forEach(([customName, optLabel]) => {
      if (optLabel) parts.push(`${customName}: ${optLabel}`);
    });
    return parts.join(', ');
  };

  const calcUnitPrice = () => {
    let price = item.price;
    item.customizations.forEach(c => {
      const selected = selectedOptions[c.name];
      if (selected) {
        const opt = c.options.find(o => o.label === selected);
        if (opt) price += opt.price_adj;
      }
    });
    return price;
  };

  const unitPrice = calcUnitPrice();
  const totalPrice = unitPrice * qty;

  const handleAddToCart = () => {
    const cartItem: CartItem = {
      menu_item_id: item.id,
      name: item.name,
      price: totalPrice,
      qty,
      modifications: buildModifications(),
      image_url: item.image_url,
      unit_price: unitPrice,
    };
    addItem(cartItem);
    toast.success(`${qty}x ${item.name} added to cart`);
    navigate('/menu');
  };

  return (
    <CustomerLayout>
      {/* Back button */}
      <div className="px-4 pt-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </button>
      </div>

      {/* Image */}
      <div className="mt-3 mx-4 rounded-2xl overflow-hidden">
        <div className="aspect-[4/3] w-full bg-muted">
          {item.image_url ? (
            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <ChefHat size={48} />
            </div>
          )}
        </div>
      </div>

      <div className="px-4 pt-4 pb-32 space-y-4">
        {/* Header */}
        <div>
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-xl font-bold text-foreground text-balance">{item.name}</h1>
            <span className="text-xl font-bold text-primary shrink-0">{formatCurrency(item.price)}</span>
          </div>
          {item.description && (
            <p className="text-sm text-muted-foreground mt-1 text-pretty">{item.description}</p>
          )}
          {/* Rating summary */}
          {item.review_count > 0 && (
            <div className="flex items-center gap-1.5 mt-2">
              {[1,2,3,4,5].map(s => (
                <Star
                  key={s}
                  size={14}
                  className={s <= Math.round(item.average_rating) ? 'fill-primary text-primary' : 'fill-muted text-muted-foreground'}
                />
              ))}
              <span className="text-sm font-semibold text-foreground ml-1">{Number(item.average_rating).toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">({item.review_count} review{item.review_count !== 1 ? 's' : ''})</span>
            </div>
          )}
          {item.dietary_tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {item.dietary_tags.map(tag => (
                <span key={tag} className={`text-xs px-2 py-0.5 rounded-full font-medium ${DIETARY_COLORS[tag] || 'bg-muted text-muted-foreground'}`}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Customizations */}
        {item.customizations.map(customization => (
          <div key={customization.name} className="space-y-2">
            <h3 className="font-semibold text-sm text-foreground">{customization.name}</h3>
            <div className="space-y-2">
              {customization.options.map(opt => (
                <label
                  key={opt.label}
                  className="flex items-center justify-between p-3 rounded-xl border border-border bg-card cursor-pointer hover:border-primary/50 transition-colors min-h-12"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={customization.name}
                      value={opt.label}
                      checked={selectedOptions[customization.name] === opt.label}
                      onChange={() => setSelectedOptions(prev => ({ ...prev, [customization.name]: opt.label }))}
                      className="accent-primary"
                    />
                    <span className="text-sm text-foreground">{opt.label}</span>
                  </div>
                  {opt.price_adj !== 0 && (
                    <span className="text-sm font-medium text-primary">
                      {opt.price_adj > 0 ? '+' : ''}{formatCurrency(opt.price_adj)}
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>
        ))}

        {/* Customer reviews */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-foreground">
            Customer Reviews
            {item.review_count > 0 && <span className="text-muted-foreground font-normal ml-1">({item.review_count})</span>}
          </h3>
          {reviewsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 rounded-xl" />
              <Skeleton className="h-16 rounded-xl" />
            </div>
          ) : reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No reviews yet — be the first!</p>
          ) : (
            reviews.map(review => (
              <div key={review.id} className="bg-card rounded-xl border border-border p-3 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-foreground truncate">
                    {(review.profiles as { name: string | null } | undefined)?.name || 'Customer'}
                  </span>
                  <div className="flex gap-0.5 shrink-0">
                    {[1,2,3,4,5].map(s => (
                      <Star
                        key={s}
                        size={12}
                        className={s <= review.rating ? 'fill-primary text-primary' : 'fill-muted text-muted-foreground'}
                      />
                    ))}
                  </div>
                </div>
                {review.review_text && (
                  <p className="text-xs text-muted-foreground text-pretty">{review.review_text}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-16 left-0 right-0 px-4 pb-4 bg-background/95 backdrop-blur-sm border-t border-border pt-3 max-w-lg mx-auto">
        <div className="flex items-center gap-3">
          {/* Qty */}
          <div className="flex items-center gap-2 bg-muted rounded-xl p-1">
            <button
              onClick={() => setQty(q => Math.max(1, q - 1))}
              className="w-9 h-9 rounded-lg bg-card flex items-center justify-center hover:bg-accent transition-colors"
            >
              <Minus size={14} />
            </button>
            <span className="w-8 text-center font-bold text-sm">{qty}</span>
            <button
              onClick={() => setQty(q => q + 1)}
              className="w-9 h-9 rounded-lg bg-card flex items-center justify-center hover:bg-accent transition-colors"
            >
              <Plus size={14} />
            </button>
          </div>

          <Button
            onClick={handleAddToCart}
            className="flex-1 h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold gap-2"
          >
            <ShoppingCart size={16} />
            Add to Cart · {formatCurrency(totalPrice)}
          </Button>
        </div>
      </div>
    </CustomerLayout>
  );
}
