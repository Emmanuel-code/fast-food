import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { updateMyProfile } from '@/services/staffService';
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Mail, Phone, LogOut, Edit2, Check, X } from 'lucide-react';
import { toast } from 'sonner';

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
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
          <p className="text-muted-foreground">Please sign in to view your profile</p>
          <Button className="mt-4 bg-primary text-primary-foreground" onClick={() => navigate('/login')}>Sign In</Button>
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
      toast.success('Profile updated!');
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

  return (
    <CustomerLayout>
      <div className="px-4 pt-5 pb-4">
        <h1 className="text-xl font-bold text-foreground">My Profile</h1>
      </div>

      <div className="px-4 pb-8 space-y-4">
        {/* Avatar block */}
        <div className="bg-card rounded-xl border border-border p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shrink-0">
            <span className="text-xl font-bold text-primary-foreground">
              {(profile.name || profile.email || '?')[0].toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-bold text-foreground truncate">{profile.name || 'No name set'}</p>
            <p className="text-sm text-muted-foreground truncate">{profile.email}</p>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium capitalize mt-1 inline-block">
              {profile.role}
            </span>
          </div>
        </div>

        {/* Edit profile */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm text-foreground">Personal Info</h2>
            {!editing ? (
              <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80">
                <Edit2 size={12} />
                Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-1 text-xs text-success hover:opacity-80">
                  <Check size={12} />
                  Save
                </button>
                <button onClick={() => setEditing(false)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                  <X size={12} />
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <User size={16} className="text-muted-foreground shrink-0" />
              {editing ? (
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  className="h-9 px-2 text-sm flex-1"
                />
              ) : (
                <span className="text-sm text-foreground">{profile.name || '—'}</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Mail size={16} className="text-muted-foreground shrink-0" />
              <span className="text-sm text-muted-foreground">{profile.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone size={16} className="text-muted-foreground shrink-0" />
              {editing ? (
                <Input
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="Your phone number"
                  className="h-9 px-2 text-sm flex-1"
                  type="tel"
                />
              ) : (
                <span className="text-sm text-foreground">{profile.phone || '—'}</span>
              )}
            </div>
          </div>
        </div>

        {/* Restaurant status */}
        {settings && (
          <div className="bg-card rounded-xl border border-border p-4">
            <p className="text-xs text-muted-foreground">Restaurant</p>
            <p className="font-semibold text-sm text-foreground mt-0.5">{settings.restaurant_address}</p>
          </div>
        )}

        {/* Sign out */}
        <Button
          variant="outline"
          onClick={handleSignOut}
          className="w-full h-11 border-destructive/30 text-destructive hover:bg-destructive/10 gap-2"
        >
          <LogOut size={16} />
          Sign Out
        </Button>
      </div>
    </CustomerLayout>
  );
}
