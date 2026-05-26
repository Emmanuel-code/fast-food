import { useState } from 'react';
import { submitReview } from '@/services/reviewService';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface RatingModalProps {
  orderId: string;
  userId: string;
  items: { menu_item_id: string; name: string }[];
  onClose: () => void;
  onDone: () => void;
}

export function RatingModal({ orderId, userId, items, onClose, onDone }: RatingModalProps) {
  const [step, setStep] = useState(0); // index into items[]
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  const item = items[step];
  const isLast = step === items.length - 1;

  const handleSubmit = async () => {
    if (rating === 0) { toast.error('Please select a star rating'); return; }
    setSaving(true);
    try {
      await submitReview({
        order_id: orderId,
        user_id: userId,
        menu_item_id: item.menu_item_id,
        rating,
        review_text: text.trim() || '',
      });
      if (isLast) {
        toast.success('Thanks for your feedback!');
        onDone();
      } else {
        setStep(s => s + 1);
        setRating(0);
        setText('');
        setHovered(0);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    if (isLast) {
      onDone();
    } else {
      setStep(s => s + 1);
      setRating(0);
      setText('');
      setHovered(0);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-[calc(100%-2rem)] md:max-w-md shadow-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <h2 className="font-bold text-foreground text-base">Rate Your Order</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Item {step + 1} of {items.length}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-muted mx-5 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${((step + 1) / items.length) * 100}%` }}
          />
        </div>

        {/* Item name */}
        <div className="px-5 mb-4">
          <p className="text-sm font-semibold text-foreground text-balance">{item.name}</p>
        </div>

        {/* Stars */}
        <div className="px-5 mb-4 flex gap-2">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              className="transition-transform hover:scale-110 active:scale-95"
              aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
            >
              <Star
                size={32}
                className={cn(
                  'transition-colors',
                  (hovered || rating) >= star
                    ? 'fill-primary text-primary'
                    : 'fill-muted text-muted-foreground'
                )}
              />
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="px-5 text-xs text-muted-foreground mb-3">
            {['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent!'][rating]}
          </p>
        )}

        {/* Review text */}
        <div className="px-5 mb-5">
          <Textarea
            placeholder="What did you think? (optional)"
            value={text}
            onChange={e => setText(e.target.value)}
            rows={3}
            className="text-sm resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 px-5 pb-5">
          <Button variant="outline" onClick={handleSkip} className="flex-1 h-10">
            Skip
          </Button>
          <Button onClick={handleSubmit} disabled={saving || rating === 0} className="flex-1 h-10">
            {saving ? <Loader2 size={15} className="animate-spin mr-1" /> : null}
            {isLast ? 'Submit' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
}
