import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { updateMyProfile } from '@/services/staffService';
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, Mail, Phone, LogOut, Edit2, Check, X, MapPin, Shield } from 'lucide-react';
import { toast } from 'sonner';

const ROLE_EMOJI: Record<string, string> = {
  customer: '🛒',
  worker: '👨‍🍳',
  manager: '📋',
  admin: '⚡',
};

export default function Profile() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const { settings } = useRestaurant();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile?.name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [saving, setSaving] = useState(false);

  if (!user || !profile) {
    return (
      <CustomerLayout>
        <div className="flex flex-col items-center justify-center min-h-[70vh] p-4">
          <div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center mb-4">
            <User size={32} className="text-muted-foreground/50" />
          </div>
          <p className="text-foreground font-bold text-lg">Not signed in</p>
          <p className="text-sm text-muted-foreground mt-1">Sign in to view your profile</p>
          <Button
            className="mt-6 px-8 rounded-xl font-bold transition-all hover:scale-105 active:scale-95"
            style={{ background: 'linear-gradient(135deg, hsl(38 100% 50%), hsl(24 95% 45%))', color: 'hsl(30 100% 8%)' }}
            onClick={() => navigate('/login')}
          >
            Sign In
          </Button>
        </div>
      </CustomerLayout>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateMyProfile(user.id, { name, phone });
      await refreshProfile();
      setEditing(false);
      toast.success('Profile updated! ✨');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const initials = (profile.name || profile.email || '?').slice(0, 2).toUpperCase();

  return (
    <CustomerLayout>
      {/* Header */}
      <div className="px-4 pt-6 pb-2">
        <h1 className="text-2xl font-black tracking-tight text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>
          My Profile
        </h1>
      </div>

      <div className="px-4 pb-8 space-y-3 mt-2">
        {/* Hero avatar card */}
        <div className="relative rounded-3xl overflow-hidden border border-border/60 shadow-card">
          {/* Gradient background */}
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(135deg, hsl(38 100% 50%) 0%, hsl(24 95% 45%) 100%)' }}
          />
          {/* Decorative circles */}
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/5" />

          <div className="relative p-6 flex items-center gap-5">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-2xl bg-white/25 backdrop-blur-sm flex items-center justify-center shrink-0 border-2 border-white/30">
              <span className="text-2xl font-black text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {initials}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-black text-white text-xl tracking-tight truncate" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {profile.name || 'Guest User'}
              </p>
              <p className="text-white/75 text-sm truncate font-medium mt-0.5">{profile.email}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/20 backdrop-blur-sm text-white text-xs font-bold capitalize">
                  {ROLE_EMOJI[profile.role] || '👤'} {profile.role}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Personal Info card */}
        <div className="premium-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield size={14} className="text-primary" />
              </div>
              <h2 className="font-bold text-sm text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>Personal Info</h2>
            </div>
            {!editing ? (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 bg-primary/8 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Edit2 size={11} />
                Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1 text-xs font-bold text-success hover:opacity-80 bg-success/10 px-3 py-1.5 rounded-lg transition-all"
                >
                  <Check size={12} />
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground bg-muted px-3 py-1.5 rounded-lg transition-all"
                >
                  <X size={12} />
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {/* Name */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
              <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center shrink-0 shadow-sm">
                <User size={14} className="text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Name</p>
                {editing ? (
                  <Input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Your name"
                    className="h-8 px-2 text-sm mt-0.5 border-0 bg-transparent p-0 font-semibold focus-visible:ring-0"
                  />
                ) : (
                  <p className="text-sm font-semibold text-foreground mt-0.5">{profile.name || '—'}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
              <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center shrink-0 shadow-sm">
                <Mail size={14} className="text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Email</p>
                <p className="text-sm font-semibold text-foreground mt-0.5 truncate">{profile.email}</p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
              <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center shrink-0 shadow-sm">
                <Phone size={14} className="text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Phone</p>
                {editing ? (
                  <Input
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="Your phone number"
                    className="h-8 px-2 text-sm mt-0.5 border-0 bg-transparent p-0 font-semibold focus-visible:ring-0"
                    type="tel"
                  />
                ) : (
                  <p className="text-sm font-semibold text-foreground mt-0.5">{profile.phone || '—'}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Restaurant info */}
        {settings && (
          <div className="premium-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <MapPin size={14} className="text-primary" />
              </div>
              <h2 className="font-bold text-sm text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>Restaurant</h2>
            </div>
            <p className="text-sm font-semibold text-foreground leading-relaxed">{settings.restaurant_address}</p>
          </div>
        )}

        {/* Sign out */}
        <Button
          type="button"
          variant="outline"
          onClick={handleSignOut}
          className="w-full h-12 border-destructive/25 text-destructive hover:bg-destructive/8 gap-2 rounded-xl font-bold transition-all hover:scale-[1.01] active:scale-[0.99]"
        >
          <LogOut size={16} />
          Sign Out
        </Button>
      </div>
    </CustomerLayout>
  );
}
