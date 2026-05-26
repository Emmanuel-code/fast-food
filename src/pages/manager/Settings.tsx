import { useState, useEffect } from 'react';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { updateSettings, closeKitchen, openKitchen } from '@/services/settingsService';
import { useAuth } from '@/contexts/AuthContext';
import type { RestaurantSettings, OpeningHours } from '@/types/types';
import { StaffLayout } from '@/components/layout/StaffLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Save, Power, PowerOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

export default function Settings() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const { settings, loading, refreshSettings } = useRestaurant();
  const [form, setForm] = useState<Partial<RestaurantSettings>>({});
  const [saving, setSaving] = useState(false);
  const [closingKitchen, setClosingKitchen] = useState(false);

  useEffect(() => {
    if (settings) setForm({ ...settings });
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings(form);
      await refreshSettings();
      toast.success('Settings saved');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleKitchen = async () => {
    setClosingKitchen(true);
    try {
      if (settings?.closed_temporarily) {
        await openKitchen();
        toast.success('Kitchen is now open');
      } else {
        await closeKitchen(form.custom_closed_message);
        toast.success('Kitchen closed for today');
      }
      await refreshSettings();
    } catch {
      toast.error('Failed to update kitchen status');
    } finally {
      setClosingKitchen(false);
    }
  };

  const setHours = (day: string, field: 'open' | 'close', value: string) => {
    setForm(prev => {
      const base = (prev.opening_hours ?? settings?.opening_hours ?? {}) as OpeningHours;
      const dayKey = day as keyof OpeningHours;
      return {
        ...prev,
        opening_hours: {
          ...base,
          [day]: { ...(base[dayKey] ?? { open: '08:00', close: '22:00', enabled: true }), [field]: value },
        } as OpeningHours,
      };
    });
  };

  const setDayEnabled = (day: string, enabled: boolean) => {
    setForm(prev => {
      const base = (prev.opening_hours ?? settings?.opening_hours ?? {}) as OpeningHours;
      const dayKey = day as keyof OpeningHours;
      return {
        ...prev,
        opening_hours: {
          ...base,
          [day]: { ...(base[dayKey] ?? { open: '08:00', close: '22:00', enabled: true }), enabled },
        } as OpeningHours,
      };
    });
  };

  if (loading) {
    return (
      <StaffLayout isAdmin={isAdmin}>
        <div className="p-4 md:p-8 lg:pl-8 space-y-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      </StaffLayout>
    );
  }

  const hours = (form.opening_hours ?? settings?.opening_hours ?? {}) as Partial<OpeningHours>;

  return (
    <StaffLayout isAdmin={isAdmin}>
      <div className="p-4 md:p-8 lg:pl-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Settings</h1>
            <p className="text-sm text-muted-foreground mt-1">Configure restaurant operations</p>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 h-9"
            size="sm"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save All
          </Button>
        </div>

        <div className="space-y-5 max-w-2xl">
          {/* Kitchen status */}
          <section className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-foreground">Kitchen Status</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Currently: <span className={settings?.closed_temporarily ? 'text-destructive font-medium' : 'text-success font-medium'}>
                    {settings?.closed_temporarily ? 'Closed' : 'Open'}
                  </span>
                </p>
              </div>
              <Button
                onClick={handleToggleKitchen}
                disabled={closingKitchen}
                variant="outline"
                className={`gap-2 h-9 ${settings?.closed_temporarily ? 'border-success/50 text-success hover:bg-success/10' : 'border-destructive/30 text-destructive hover:bg-destructive/10'}`}
                size="sm"
              >
                {closingKitchen ? <Loader2 size={14} className="animate-spin" /> :
                  settings?.closed_temporarily ? <><Power size={14} />Open Kitchen</> : <><PowerOff size={14} />Close Kitchen</>}
              </Button>
            </div>
            <div className="mt-3">
              <Label className="text-xs text-muted-foreground">Closed message (shown to customers)</Label>
              <Input
                value={form.custom_closed_message || ''}
                onChange={e => setForm(p => ({ ...p, custom_closed_message: e.target.value }))}
                placeholder="We'll be back soon!"
                className="mt-1.5 h-9 px-3 text-sm"
              />
            </div>
          </section>

          {/* Opening hours */}
          <section className="bg-card rounded-xl border border-border p-4">
            <h2 className="font-semibold text-foreground mb-4">Opening Hours</h2>
            <div className="space-y-3">
              {DAYS.map(day => {
                const dayHours = hours[day] || { open: '08:00', close: '22:00', enabled: true };
                return (
                  <div key={day} className="flex items-center gap-3">
                    <label className="flex items-center gap-2 w-28 shrink-0">
                      <input
                        type="checkbox"
                        checked={dayHours.enabled !== false}
                        onChange={e => setDayEnabled(day, e.target.checked)}
                        className="accent-primary"
                      />
                      <span className={`text-sm capitalize ${dayHours.enabled !== false ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {day.slice(0, 3)}
                      </span>
                    </label>
                    {dayHours.enabled !== false ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="time"
                          value={dayHours.open || '08:00'}
                          onChange={e => setHours(day, 'open', e.target.value)}
                          className="flex-1 h-8 px-2 text-sm bg-muted border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <span className="text-xs text-muted-foreground">–</span>
                        <input
                          type="time"
                          value={dayHours.close || '22:00'}
                          onChange={e => setHours(day, 'close', e.target.value)}
                          className="flex-1 h-8 px-2 text-sm bg-muted border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground italic">Closed</span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Pre-order settings */}
          <section className="bg-card rounded-xl border border-border p-4 space-y-3">
            <h2 className="font-semibold text-foreground">Pre-Order Settings</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Max pre-order days</Label>
                <Input
                  type="number"
                  min={1}
                  max={14}
                  value={form.max_pre_order_days ?? 2}
                  onChange={e => setForm(p => ({ ...p, max_pre_order_days: parseInt(e.target.value) || 2 }))}
                  className="h-9 px-3 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Max orders per slot</Label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={form.max_orders_per_slot ?? 10}
                  onChange={e => setForm(p => ({ ...p, max_orders_per_slot: parseInt(e.target.value) || 10 }))}
                  className="h-9 px-3 text-sm"
                />
              </div>
            </div>
          </section>

          {/* Delivery settings */}
          <section className="bg-card rounded-xl border border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground">Delivery Settings</h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.delivery_enabled ?? true}
                  onChange={e => setForm(p => ({ ...p, delivery_enabled: e.target.checked }))}
                  className="accent-primary"
                />
                <span className="text-sm text-muted-foreground">Enable delivery</span>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Delivery radius (km)</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.delivery_radius_km ?? 10}
                  onChange={e => setForm(p => ({ ...p, delivery_radius_km: parseFloat(e.target.value) || 10 }))}
                  className="h-9 px-3 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Delivery fee ($)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  value={form.delivery_fee ?? 3.99}
                  onChange={e => setForm(p => ({ ...p, delivery_fee: parseFloat(e.target.value) || 3.99 }))}
                  className="h-9 px-3 text-sm"
                />
              </div>
            </div>
          </section>

          {/* Operational settings */}
          <section className="bg-card rounded-xl border border-border p-4 space-y-3">
            <h2 className="font-semibold text-foreground">Operational</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Prep time estimate (min)</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.prep_time_estimate_minutes ?? 15}
                  onChange={e => setForm(p => ({ ...p, prep_time_estimate_minutes: parseInt(e.target.value) || 15 }))}
                  className="h-9 px-3 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Alert threshold (min)</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.order_alert_threshold_minutes ?? 8}
                  onChange={e => setForm(p => ({ ...p, order_alert_threshold_minutes: parseInt(e.target.value) || 8 }))}
                  className="h-9 px-3 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Tax rate (%)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  value={((form.tax_rate ?? 0.08) * 100).toFixed(1)}
                  onChange={e => setForm(p => ({ ...p, tax_rate: parseFloat(e.target.value) / 100 || 0.08 }))}
                  className="h-9 px-3 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Restaurant address</Label>
                <Input
                  value={form.restaurant_address || ''}
                  onChange={e => setForm(p => ({ ...p, restaurant_address: e.target.value }))}
                  className="h-9 px-3 text-sm"
                  placeholder="123 Main St..."
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </StaffLayout>
  );
}
