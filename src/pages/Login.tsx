import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, getProfile } from '@/contexts/AuthContext';
import { Eye, EyeOff, Loader2, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { registerFCMToken } from '@/utils/fcm';
import { tenantConfig } from '@/config/tenantConfig';

type Mode = 'login' | 'signup';

export default function Login() {
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const getRoleRoute = (role: string) => {
    if (role === 'worker') return '/kitchen';
    if (role === 'manager' || role === 'admin') return '/dashboard';
    return '/menu';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Please fill in all fields.'); return; }
    if (mode === 'signup' && !name) { toast.error('Please enter your name.'); return; }
    if (mode === 'signup' && !agreedTerms) { toast.error('Please agree to the Terms and Privacy Policy.'); return; }

    setLoading(true);
    try {
      if (mode === 'login') {
        const { data, error } = await signIn(email, password);
        if (error) { toast.error(error.message || 'Login failed. Please check your credentials.'); return; }
        toast.success('Welcome back! 🔥');
        const userId = data?.user?.id;
        if (userId) {
          registerFCMToken(userId);
          const p = await getProfile(userId);
          setTimeout(() => { navigate(getRoleRoute(p?.role || 'customer')); }, 100);
        } else {
          setTimeout(() => { navigate('/menu'); }, 100);
        }
      } else {
        const { data, error } = await signUp(name, email, password);
        if (error) { toast.error(error.message || 'Sign up failed. Please try again.'); return; }
        toast.success(`Welcome to ${tenantConfig.appName}! 🍔`);
        const userId = data?.user?.id;
        if (userId) {
          registerFCMToken(userId);
          const p = await getProfile(userId);
          navigate(getRoleRoute(p?.role || 'customer'));
        } else {
          navigate('/menu');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-background">
      {/* Ambient glow backgrounds */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, hsl(38 100% 50%) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full opacity-15 blur-3xl"
          style={{ background: 'radial-gradient(circle, hsl(24 95% 45%) 0%, transparent 70%)' }} />
      </div>

      <div className="relative z-10 w-full max-w-sm px-4 py-10">
        {/* Logo block */}
        <div className="flex flex-col items-center mb-10">
          <div className="relative mb-4">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg, hsl(38 100% 50%), hsl(24 95% 45%))' }}>
              <Flame size={36} className="text-white drop-shadow" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-card border-2 border-background flex items-center justify-center text-xs">🍔</div>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {tenantConfig.appName}
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-medium">Fast food, made with love 🤌</p>
        </div>

        {/* Card */}
        <div className="bg-card/90 backdrop-blur-md rounded-3xl shadow-xl border border-border/60 p-7">
          {/* Mode switcher */}
          <div className="flex rounded-2xl bg-muted p-1 mb-7 gap-1">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                mode === 'login'
                  ? 'bg-card text-foreground shadow-sm scale-[1.02]'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                mode === 'signup'
                  ? 'bg-card text-foreground shadow-sm scale-[1.02]'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Smith"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="h-12 px-4 rounded-xl border-border/70 bg-background/50 backdrop-blur-sm text-sm focus:border-primary transition-all"
                  autoComplete="name"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="h-12 px-4 rounded-xl border-border/70 bg-background/50 backdrop-blur-sm text-sm focus:border-primary transition-all"
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="h-12 px-4 pr-12 rounded-xl border-border/70 bg-background/50 backdrop-blur-sm text-sm focus:border-primary transition-all"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedTerms}
                  onChange={e => setAgreedTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-primary rounded"
                />
                <span className="text-xs text-muted-foreground leading-relaxed">
                  I agree to the{' '}
                  <span className="text-primary font-semibold cursor-pointer">Terms of Service</span>
                  {' '}and{' '}
                  <span className="text-primary font-semibold cursor-pointer">Privacy Policy</span>
                </span>
              </label>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-13 text-sm font-extrabold tracking-wide rounded-xl mt-2 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                height: '3.25rem',
                background: 'linear-gradient(135deg, hsl(38 100% 50%), hsl(24 95% 45%))',
                color: 'hsl(30 100% 8%)',
                boxShadow: '0 4px 18px 0 rgba(245, 158, 11, 0.35)',
              }}
            >
              {loading
                ? <Loader2 size={18} className="animate-spin" />
                : mode === 'login' ? '🔥 Sign In' : '🚀 Create Account'
              }
            </Button>
          </form>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-6">
          By using {tenantConfig.appName} you agree to our{' '}
          <span className="text-primary font-medium">Terms</span> and{' '}
          <span className="text-primary font-medium">Privacy Policy</span>.
        </p>
      </div>
    </div>
  );
}
