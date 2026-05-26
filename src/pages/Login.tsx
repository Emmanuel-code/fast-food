import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ChefHat, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { registerFCMToken } from '@/utils/fcm';

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
    if (role === 'manager') return '/dashboard';
    if (role === 'admin') return '/dashboard';
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
        toast.success('Welcome back!');
        // Register FCM token in the background
        const userId = data?.user?.id;
        if (userId) registerFCMToken(userId);
        setTimeout(() => { navigate('/menu'); }, 100);
      } else {
        const { data, error } = await signUp(name, email, password);
        if (error) { toast.error(error.message || 'Sign up failed. Please try again.'); return; }
        toast.success('Account created! Welcome to Chef\'s Kitchen!');
        const userId = data?.user?.id;
        if (userId) registerFCMToken(userId);
        navigate('/menu');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-8">
      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-3 shadow-card">
          <ChefHat size={32} className="text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Chef's Kitchen</h1>
        <p className="text-sm text-muted-foreground mt-1">Fast food, made with love</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-card rounded-2xl shadow-card border border-border p-6">
        {/* Tabs */}
        <div className="flex rounded-xl bg-muted p-1 mb-6">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'login' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'signup' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm font-normal">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Smith"
                value={name}
                onChange={e => setName(e.target.value)}
                className="h-11 px-3"
                autoComplete="name"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-normal">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="h-11 px-3"
              autoComplete="email"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm font-normal">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="h-11 px-3 pr-10"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {mode === 'signup' && (
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedTerms}
                onChange={e => setAgreedTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-primary"
              />
              <span className="text-xs text-muted-foreground leading-relaxed">
                I agree to the{' '}
                <span className="text-primary underline cursor-pointer">Terms of Service</span>
                {' '}and{' '}
                <span className="text-primary underline cursor-pointer">Privacy Policy</span>
              </span>
            </label>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 font-semibold text-base bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : mode === 'login' ? 'Sign In' : 'Create Account'}
          </Button>
        </form>
      </div>

      <p className="text-xs text-muted-foreground mt-6 text-center max-w-xs">
        Please modify the User Agreement &amp; Privacy Policy to match your actual terms.
      </p>
    </div>
  );
}
