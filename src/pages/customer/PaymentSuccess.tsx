// Payment success / verification page — shown after Paystack redirect
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2, ShoppingBag, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/utils/timeSlots';
import { toast } from 'sonner';

interface VerificationResult {
  verified: boolean;
  order_id: string;
  order_number: string;
  amount_ghs: number;
  already_processed?: boolean;
}

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VerificationResult | null>(null);

  const reference = searchParams.get('reference') || searchParams.get('trxref');
  const orderId = searchParams.get('order_id');

  useEffect(() => {
    if (!reference) {
      setError('No payment reference found. If you paid, please contact support with your transaction reference.');
      setLoading(false);
      return;
    }

    const verifyPayment = async () => {
      try {
        const { data, error: funcError } = await supabase.functions.invoke('verify-paystack-payment', {
          body: { reference },
        });

        if (funcError) {
          const msg = await funcError?.context?.text?.();
          throw new Error(msg || 'Verification failed');
        }

        if (data?.code === 'FAIL') {
          throw new Error(data.message || 'Payment verification failed');
        }

        const verificationData = data?.data;
        if (verificationData?.verified) {
          setResult({
            verified: true,
            order_id: verificationData.order_id || orderId || '',
            order_number: verificationData.order_number || '—',
            amount_ghs: verificationData.amount_ghs || 0,
            already_processed: verificationData.already_processed,
          });
        } else {
          throw new Error('Your payment was not successful or is still pending. Reference: ' + reference);
        }
      } catch (err: any) {
        console.error('Error verifying payment:', err);
        setError(err.message || 'An unexpected error occurred while verifying your payment. Please contact support.');
        toast.error(err.message || 'Payment verification failed');
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [reference, orderId]);

  return (
    <CustomerLayout>
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-card/60 backdrop-blur-md rounded-2xl border border-border shadow-xl p-6 md:p-8 text-center space-y-6">
          {loading ? (
            <div className="space-y-4 py-8">
              <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-pulse" />
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Confirming Payment</h2>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                We are securely verifying your transaction with Paystack. This will only take a moment.
              </p>
            </div>
          ) : error ? (
            <div className="space-y-4 py-6">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto text-destructive">
                <XCircle size={40} className="stroke-[1.5]" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Payment Verification Issue</h2>
              <p className="text-sm text-muted-foreground text-pretty max-w-sm mx-auto">
                {error}
              </p>
              <div className="pt-4 flex flex-col gap-2">
                {orderId && (
                  <Button
                    onClick={() => navigate(`/orders/${orderId}`)}
                    className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
                  >
                    View Order Details
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => navigate('/menu')}
                  className="w-full h-11 border-border text-foreground hover:bg-muted font-semibold"
                >
                  Return to Menu
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 py-4 animate-in fade-in zoom-in-95 duration-300">
              {/* Success Badge */}
              <div className="relative w-20 h-20 mx-auto">
                {/* Background glow */}
                <div className="absolute inset-0 bg-success/20 rounded-full blur-md animate-pulse" />
                <div className="relative w-20 h-20 bg-success/10 rounded-full flex items-center justify-center text-success border border-success/20">
                  <CheckCircle2 size={44} className="stroke-[1.5]" />
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-black tracking-tight text-foreground" style={{ color: 'var(--color-primary)' }}>
                  Order Confirmed!
                </h2>
                <p className="text-sm text-muted-foreground">
                  Thank you! Your payment was processed successfully.
                </p>
              </div>

              {/* Order Info Card */}
              {result && (
                <div className="bg-muted/40 border border-border/60 rounded-xl p-4 text-left space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Order Number</span>
                    <span className="font-mono font-bold text-foreground">{result.order_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount Paid</span>
                    <span className="font-bold text-success">{formatCurrency(result.amount_ghs)}</span>
                  </div>
                  {reference && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Payment Reference</span>
                      <span className="font-mono text-xs text-muted-foreground truncate max-w-[150px]">{reference}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-4 flex flex-col gap-2.5">
                <Button
                  onClick={() => navigate(`/orders/${result?.order_id || orderId}`)}
                  className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-bold flex items-center justify-center gap-2"
                >
                  <span>Track Your Order</span>
                  <ArrowRight size={16} />
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/menu')}
                  className="w-full h-10 text-muted-foreground hover:text-foreground font-semibold flex items-center justify-center gap-2"
                >
                  <ShoppingBag size={15} />
                  <span>Order Something Else</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </CustomerLayout>
  );
}
