import { useState, useEffect } from 'react';
import { supabase } from '@/db/supabase';
import { getAllStaff, toggleStaffDisabled } from '@/services/staffService';
import type { Profile, UserRole } from '@/types/types';
import { useAuth } from '@/contexts/AuthContext';
import { StaffLayout } from '@/components/layout/StaffLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Plus, UserX, UserCheck, X, Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function StaffManager() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const [staff, setStaff] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'worker' as UserRole });
  const [adding, setAdding] = useState(false);

  const fetchStaff = async () => {
    const data = await getAllStaff();
    setStaff(data);
    setLoading(false);
  };

  useEffect(() => { fetchStaff(); }, []);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) { toast.error('Email and password required'); return; }
    setAdding(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      const { data, error } = await supabase.functions.invoke('create-staff-user', {
        body: { ...formData },
        headers: { Authorization: `Bearer ${token}` },
      });
      if (error) {
        const msg = await error?.context?.text?.();
        toast.error(msg || error.message || 'Failed to create staff');
        return;
      }
      if (data?.error) { toast.error(data.error); return; }
      toast.success(`Staff member ${formData.name || formData.email} created`);
      setShowAdd(false);
      setFormData({ name: '', email: '', password: '', role: 'worker' });
      fetchStaff();
    } finally {
      setAdding(false);
    }
  };

  const handleToggle = async (s: Profile) => {
    await toggleStaffDisabled(s.id, !s.disabled);
    toast.success(s.disabled ? 'Staff enabled' : 'Staff disabled');
    fetchStaff();
  };

  const ROLE_COLORS: Record<string, string> = {
    admin: 'bg-primary/10 text-primary',
    manager: 'bg-blue-100 text-blue-700',
    worker: 'bg-green-100 text-green-700',
  };

  return (
    <StaffLayout isAdmin={isAdmin}>
      <div className="p-4 md:p-8 lg:pl-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Staff</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your team members</p>
          </div>
          <Button
            onClick={() => setShowAdd(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 h-9"
            size="sm"
          >
            <Plus size={14} />
            Add Staff
          </Button>
        </div>

        {/* Staff table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden min-w-0">
          <div className="overflow-x-auto w-full">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">Name</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">Email</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">Role</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">Status</th>
                  <th className="px-4 py-3 whitespace-nowrap"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(3)].map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      {[...Array(5)].map((_, j) => <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>)}
                    </tr>
                  ))
                ) : staff.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-muted-foreground text-sm">
                      <Users size={32} className="mx-auto mb-2 opacity-30" />
                      No staff members yet
                    </td>
                  </tr>
                ) : (
                  staff.map(s => (
                    <tr key={s.id} className="border-b border-border">
                      <td className="px-4 py-3 text-sm font-medium text-foreground whitespace-nowrap">{s.name || '—'}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">{s.email}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium capitalize', ROLE_COLORS[s.role] || 'bg-muted text-muted-foreground')}>
                          {s.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', s.disabled ? 'bg-destructive/10 text-destructive' : 'bg-green-100 text-green-700')}>
                          {s.disabled ? 'Disabled' : 'Active'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {(isAdmin || s.role === 'worker') && s.role !== 'admin' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggle(s)}
                            className={cn('h-7 px-2 text-xs gap-1', s.disabled ? 'text-success hover:text-success/80' : 'text-destructive hover:text-destructive/80')}
                          >
                            {s.disabled ? <><UserCheck size={12} /> Enable</> : <><UserX size={12} /> Disable</>}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add staff modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border border-border w-full max-w-[calc(100%-2rem)] md:max-w-sm">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-bold text-foreground">Add Staff Member</h2>
              <button onClick={() => setShowAdd(false)} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddStaff} className="p-4 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-normal">Name</Label>
                <Input
                  placeholder="Full name"
                  value={formData.name}
                  onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                  className="h-10 px-3"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-normal">Email *</Label>
                <Input
                  type="email"
                  placeholder="staff@example.com"
                  value={formData.email}
                  onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                  className="h-10 px-3"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-normal">Temporary Password *</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
                  className="h-10 px-3"
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-normal">Role</Label>
                <select
                  value={formData.role}
                  onChange={e => setFormData(p => ({ ...p, role: e.target.value as UserRole }))}
                  className="w-full h-10 px-3 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="worker">Worker</option>
                  {isAdmin && <option value="manager">Manager</option>}
                </select>
              </div>
              <div className="flex gap-2 pt-1">
                <Button type="button" variant="outline" onClick={() => setShowAdd(false)} className="flex-1 h-10">
                  Cancel
                </Button>
                <Button type="submit" disabled={adding} className="flex-1 h-10 bg-primary text-primary-foreground">
                  {adding ? <Loader2 size={16} className="animate-spin" /> : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </StaffLayout>
  );
}
