import { useState, useEffect } from 'react';
import { getMenuItems, toggleMenuItemAvailability, deleteMenuItem, updateMenuItem, createMenuItem, uploadMenuImage } from '@/services/menuService';
import type { MenuItem } from '@/types/types';
import { MENU_CATEGORIES } from '@/types/types';
import { useAuth } from '@/contexts/AuthContext';
import { StaffLayout } from '@/components/layout/StaffLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus, Edit2, Trash2, X, Loader2, Upload, ChefHat,
  ToggleLeft, ToggleRight, Search
} from 'lucide-react';
import { formatCurrency } from '@/utils/timeSlots';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type FormMode = 'create' | 'edit';

const EMPTY_ITEM: Omit<MenuItem, 'id' | 'created_at'> = {
  name: '',
  description: '',
  image_url: '',
  price: 0,
  category: 'Rice Dishes',
  dietary_tags: [],
  available: true,
  limited_stock: null,
  remaining: 999,
  is_combo: false,
  combo_items: [],
  customizations: [],
  sort_order: 0,
  average_rating: 0,
  review_count: 0,
};

export default function MenuManager() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>('create');
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [form, setForm] = useState<Omit<MenuItem, 'id' | 'created_at'>>(EMPTY_ITEM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchItems = async () => {
    const data = await getMenuItems();
    setItems(data);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const handleEdit = (item: MenuItem) => {
    setEditItem(item);
    setForm({
      name: item.name,
      description: item.description,
      image_url: item.image_url,
      price: item.price,
      category: item.category,
      dietary_tags: item.dietary_tags,
      available: item.available,
      limited_stock: item.limited_stock,
      remaining: item.remaining,
      is_combo: item.is_combo,
      combo_items: item.combo_items,
      customizations: item.customizations,
      sort_order: item.sort_order,
      average_rating: item.average_rating,
      review_count: item.review_count,
    });
    setFormMode('edit');
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditItem(null);
    setForm({ ...EMPTY_ITEM });
    setFormMode('create');
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || form.price < 0) { toast.error('Name and valid price required'); return; }
    setSaving(true);
    try {
      if (formMode === 'create') {
        await createMenuItem(form);
        toast.success('Item created');
      } else if (editItem) {
        await updateMenuItem(editItem.id, form);
        toast.success('Item updated');
      }
      setShowForm(false);
      fetchItems();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (item: MenuItem) => {
    await toggleMenuItemAvailability(item.id, !item.available);
    fetchItems();
    toast.success(item.available ? 'Item hidden' : 'Item available');
  };

  const handleDelete = async (item: MenuItem) => {
    if (!confirm(`Delete "${item.name}"?`)) return;
    await deleteMenuItem(item.id);
    toast.success('Item deleted');
    fetchItems();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be under 2MB'); return; }
    setUploading(true);
    try {
      const url = await uploadMenuImage(file);
      setForm(p => ({ ...p, image_url: url }));
      toast.success('Image uploaded');
    } catch {
      toast.error('Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const toggleDietaryTag = (tag: string) => {
    setForm(p => ({
      ...p,
      dietary_tags: p.dietary_tags.includes(tag)
        ? p.dietary_tags.filter(t => t !== tag)
        : [...p.dietary_tags, tag],
    }));
  };

  const DIETARY_OPTIONS = ['vegetarian', 'vegan', 'gluten-free', 'spicy', 'halal'];

  const filtered = items.filter(i =>
    !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <StaffLayout isAdmin={isAdmin}>
      <div className="p-4 md:p-8 lg:pl-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Menu Manager</h1>
            <p className="text-sm text-muted-foreground mt-1">{items.length} items total</p>
          </div>
          <Button
            onClick={handleAdd}
            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 h-9"
            size="sm"
          >
            <Plus size={14} />
            Add Item
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search menu items..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-10"
          />
        </div>

        {/* Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden min-w-0">
          <div className="overflow-x-auto w-full">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">Item</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">Category</th>
                  <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">Price</th>
                  <th className="text-center text-xs font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">Stock</th>
                  <th className="text-center text-xs font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">Available</th>
                  <th className="px-4 py-3 whitespace-nowrap"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      {[...Array(6)].map((_, j) => <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>)}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground text-sm">
                      <ChefHat size={32} className="mx-auto mb-2 opacity-30" />
                      No items found
                    </td>
                  </tr>
                ) : (
                  filtered.map(item => (
                    <tr key={item.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0">
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ChefHat size={14} className="text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground">{item.name}</p>
                            {item.is_combo && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">Combo</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{item.category}</td>
                      <td className="px-4 py-3 text-sm font-medium text-right whitespace-nowrap">{formatCurrency(item.price)}</td>
                      <td className="px-4 py-3 text-sm text-center whitespace-nowrap">
                        {item.limited_stock === null ? (
                          <span className="text-xs text-muted-foreground">∞</span>
                        ) : (
                          <span className={cn('text-xs font-medium', item.remaining <= 5 ? 'text-destructive' : 'text-foreground')}>
                            {item.remaining}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <button onClick={() => handleToggle(item)} className="flex items-center justify-center mx-auto">
                          {item.available ? (
                            <ToggleRight size={20} className="text-success" />
                          ) : (
                            <ToggleLeft size={20} className="text-muted-foreground" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(item)}
                            className="h-7 px-2 text-xs gap-1"
                          >
                            <Edit2 size={11} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(item)}
                            className="h-7 px-2 text-xs text-destructive hover:text-destructive/80 gap-1"
                          >
                            <Trash2 size={11} />
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

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border border-border w-full max-w-[calc(100%-2rem)] md:max-w-lg max-h-[90dvh] overflow-y-auto">
            <div className="p-4 border-b border-border flex items-center justify-between sticky top-0 bg-card">
              <h2 className="font-bold text-foreground">{formMode === 'create' ? 'Add Menu Item' : 'Edit Item'}</h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-4 space-y-4">
              {/* Image */}
              <div className="space-y-2">
                <Label className="text-sm font-normal">Image</Label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center overflow-hidden border border-border shrink-0">
                    {form.image_url ? (
                      <img src={form.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <ChefHat size={20} className="text-muted-foreground" />
                    )}
                  </div>
                  <label className="flex-1">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border bg-muted cursor-pointer hover:border-primary/50 transition-colors">
                      {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} className="text-muted-foreground" />}
                      <span className="text-xs text-muted-foreground">{uploading ? 'Uploading...' : 'Upload image'}</span>
                    </div>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                  </label>
                </div>
                <Input
                  placeholder="Or paste image URL..."
                  value={form.image_url}
                  onChange={e => setForm(p => ({ ...p, image_url: e.target.value }))}
                  className="h-9 px-3 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5 col-span-2">
                  <Label className="text-sm font-normal">Name *</Label>
                  <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required className="h-9 px-3 text-sm" placeholder="Item name" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-normal">Price *</Label>
                  <Input type="number" min={0} step={0.01} value={form.price} onChange={e => setForm(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))} required className="h-9 px-3 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-normal">Category</Label>
                  <select
                    value={form.category}
                    onChange={e => setForm(p => ({ ...p, category: e.target.value as MenuItem['category'] }))}
                    className="w-full h-9 px-3 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {MENU_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-normal">Description</Label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 text-sm bg-muted rounded-lg border border-border resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Brief description..."
                />
              </div>

              {/* Dietary tags */}
              <div className="space-y-2">
                <Label className="text-sm font-normal">Dietary Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {DIETARY_OPTIONS.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleDietaryTag(tag)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize',
                        form.dietary_tags.includes(tag)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-muted text-muted-foreground border-border'
                      )}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stock */}
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.limited_stock !== null}
                    onChange={e => setForm(p => ({ ...p, limited_stock: e.target.checked ? 50 : null, remaining: e.target.checked ? 50 : 999 }))}
                    className="accent-primary"
                  />
                  <span className="text-sm text-foreground">Limited stock</span>
                </label>
                {form.limited_stock !== null && (
                  <Input
                    type="number"
                    min={0}
                    value={form.remaining}
                    onChange={e => setForm(p => ({ ...p, remaining: parseInt(e.target.value) || 0, limited_stock: parseInt(e.target.value) || 0 }))}
                    className="w-24 h-8 px-2 text-sm"
                    placeholder="Qty"
                  />
                )}
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.available}
                  onChange={e => setForm(p => ({ ...p, available: e.target.checked }))}
                  className="accent-primary"
                />
                <span className="text-sm text-foreground">Available now</span>
              </label>

              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1 h-10">
                  Cancel
                </Button>
                <Button type="submit" disabled={saving} className="flex-1 h-10 bg-primary text-primary-foreground">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : formMode === 'create' ? 'Create Item' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </StaffLayout>
  );
}
