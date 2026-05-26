import { useState, useEffect } from 'react';
import {
  getAllPromoCodes, createPromoCode, updatePromoCode, deletePromoCode,
} from '@/services/promoService';
import type { PromoCode } from '@/services/promoService';
import { useAuth } from '@/contexts/AuthContext';
import { StaffLayout } from '@/components/layout/StaffLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit2, Trash2, Tag, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const EMPTY: Omit<PromoCode, 'id' | 'usage_count' | 'created_at'> = {
  code: '',
  discount_type: 'percentage',
  discount_value: 10,
  expiration_date: null,
  active: true,
};

export default function PromoCodesManager() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<PromoCode, 'id' | 'usage_count' | 'created_at'>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchCodes = async () => {
    try {
      const data = await getAllPromoCodes();
      setCodes(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCodes(); }, []);

  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY);
    setShowForm(true);
  };

  const openEdit = (c: PromoCode) => {
    setEditId(c.id);
    setForm({
      code: c.code,
      discount_type: c.discount_type,
      discount_value: c.discount_value,
      expiration_date: c.expiration_date,
      active: c.active,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.code.trim()) { toast.error('Code is required'); return; }
    if (form.discount_value <= 0) { toast.error('Discount value must be > 0'); return; }

    setSaving(true);
    try {
      if (editId) {
        await updatePromoCode(editId, form);
        toast.success('Promo code updated');
      } else {
        await createPromoCode(form);
        toast.success('Promo code created');
      }
      setShowForm(false);
      fetchCodes();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (c: PromoCode) => {
    try {
      await updatePromoCode(c.id, { active: !c.active });
      setCodes(prev => prev.map(p => p.id === c.id ? { ...p, active: !c.active } : p));
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deletePromoCode(id);
      setCodes(prev => prev.filter(c => c.id !== id));
      toast.success('Promo code deleted');
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  const isExpired = (dateStr: string | null) =>
    dateStr ? new Date(dateStr) < new Date() : false;

  return (
    <StaffLayout isAdmin={isAdmin}>
      <div className="p-4 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground text-balance">Promo Codes</h1>
            <p className="text-sm text-muted-foreground mt-1">Create and manage discount codes</p>
          </div>
          <Button onClick={openCreate} className="gap-2 shrink-0">
            <Plus size={16} />
            <span className="hidden md:inline">New Code</span>
          </Button>
        </div>

        {/* Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3 whitespace-nowrap">Code</th>
                  <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3 whitespace-nowrap">Discount</th>
                  <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3 whitespace-nowrap">Expires</th>
                  <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3 whitespace-nowrap">Used</th>
                  <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3 whitespace-nowrap">Active</th>
                  <th className="text-right text-xs text-muted-foreground font-medium px-4 py-3 whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(4)].map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      {[...Array(6)].map((_, j) => <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>)}
                    </tr>
                  ))
                ) : codes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3 text-muted-foreground">
                        <Tag size={32} className="opacity-30" />
                        <p className="text-sm">No promo codes yet. Create your first one!</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  codes.map(c => (
                    <tr key={c.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-mono font-bold text-sm text-foreground">{c.code}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">
                        {c.discount_type === 'percentage'
                          ? `${c.discount_value}% off`
                          : `GHS ${c.discount_value} off`}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {c.expiration_date ? (
                          <span className={cn('text-xs', isExpired(c.expiration_date) ? 'text-destructive' : 'text-muted-foreground')}>
                            {isExpired(c.expiration_date) ? 'Expired · ' : ''}
                            {new Date(c.expiration_date).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">No expiry</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">{c.usage_count}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Switch checked={c.active} onCheckedChange={() => handleToggle(c)} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(c)} className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                            <Edit2 size={14} />
                          </Button>
                          <Button
                            variant="ghost" size="sm"
                            onClick={() => handleDelete(c.id)}
                            disabled={deletingId === c.id}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                          >
                            {deletingId === c.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl border border-border p-5 w-full max-w-[calc(100%-2rem)] md:max-w-md shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-foreground">{editId ? 'Edit Promo Code' : 'New Promo Code'}</h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground p-1">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="code" className="text-sm font-normal">Code</Label>
                <Input
                  id="code"
                  value={form.code}
                  onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g. CHEF20"
                  className="mt-1 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-normal">Type</Label>
                  <Select
                    value={form.discount_type}
                    onValueChange={v => setForm(f => ({ ...f, discount_type: v as 'percentage' | 'flat' }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="flat">Flat Amount (GHS)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="val" className="text-sm font-normal">
                    Value {form.discount_type === 'percentage' ? '(%)' : '(GHS)'}
                  </Label>
                  <Input
                    id="val"
                    type="number"
                    min={0}
                    max={form.discount_type === 'percentage' ? 100 : undefined}
                    value={form.discount_value}
                    onChange={e => setForm(f => ({ ...f, discount_value: parseFloat(e.target.value) || 0 }))}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="exp" className="text-sm font-normal">Expiration Date (optional)</Label>
                <Input
                  id="exp"
                  type="date"
                  value={form.expiration_date ?? ''}
                  onChange={e => setForm(f => ({ ...f, expiration_date: e.target.value || null }))}
                  className="mt-1"
                />
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  checked={form.active}
                  onCheckedChange={v => setForm(f => ({ ...f, active: v }))}
                />
                <Label className="text-sm font-normal cursor-pointer">Active</Label>
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1 h-10">Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="flex-1 h-10">
                {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                {editId ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </StaffLayout>
  );
}
