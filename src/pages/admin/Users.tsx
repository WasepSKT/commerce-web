
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { useAuth } from '@/hooks/useAuth';
import type { UserProfile } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

// Safe error message extractor to avoid `any` casts for lint
function getErrorMessage(err: unknown, fallback = 'Gagal mengambil data pengguna'): string {
  if (!err) return fallback;
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && 'message' in err) {
    const maybe = (err as { message?: unknown }).message;
    if (typeof maybe === 'string') return maybe;
  }
  return fallback;
}

function formatDateIso(iso?: string | null) {
  if (!iso) return '-';
  try {
    const d = new Date(iso);
    return d.toLocaleString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return iso;
  }
}


export default function AdminUsersPage() {
  const auth = useAuth();
  const currentUser = auth.user;

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [total, setTotal] = useState(0);
  const [lastRaw, setLastRaw] = useState<{ data: UserProfile[] | null; count: number | null } | null>(null);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total]);

  const { toast } = useToast();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const start = (page - 1) * pageSize;
      const end = start + pageSize - 1;
      // Query profiles (admins should see all users)
      const query = supabase.from('profiles').select('*', { count: 'exact' }).order('created_at', { ascending: false }).range(start, end);

      const { data, error, count } = await query;
      if (error) throw error;
      setUsers((data as UserProfile[]) || []);
      setTotal(count ?? 0);
      setLastRaw({ data, count });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { void fetchUsers(); }, [fetchUsers, currentUser]);

  // Edit/Delete modal state
  const [editing, setEditing] = useState<UserProfile | null>(null);
  const [deleting, setDeleting] = useState<UserProfile | null>(null);

  const refresh = () => {
    void fetchUsers();
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Pengguna dihapus' });
      setDeleting(null);
      await fetchUsers();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Gagal menghapus pengguna', description: getErrorMessage(err) });
    }
  };

  const handleSave = async (updated: Partial<UserProfile> & { id: string }) => {
    try {
      const { error } = await supabase.from('profiles').update(updated).eq('id', updated.id);
      if (error) throw error;
      toast({ title: 'Perubahan tersimpan' });
      setEditing(null);
      await fetchUsers();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Gagal menyimpan perubahan', description: getErrorMessage(err) });
    }
  };

  // Edit dialog form state
  const [editValues, setEditValues] = useState<Partial<UserProfile>>({});

  // sync when editing changes
  useEffect(() => {
    setEditValues(editing ?? {});
  }, [editing]);

  return (
    <div className="w-full">
      <AdminLayout>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1 text-primary">User Management</h1>
            <p className="text-sm md:text-base text-muted-foreground">Kelola pengguna dan peran</p>
          </div>
          {/* future CTA: add user */}
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle style={{ color: 'hsl(var(--primary))' }}>Daftar Pengguna</CardTitle>
            <CardDescription>Kelola data pengguna di bawah ini.</CardDescription>
          </CardHeader>
          <CardContent className="min-h-[50vh]">

            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading data pengguna...</div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">{error}</div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Belum ada data pengguna.</div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <tr>
                      <TableHead>Nama</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </tr>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="w-[320px]">{u.full_name || '-'}</TableCell>
                        <TableCell className="text-sm">{u.email || '-'}</TableCell>
                        <TableCell className="text-sm">{u.role || '-'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDateIso(u.created_at)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDateIso(u.updated_at)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button size="sm" variant="ghost" onClick={() => setEditing(u)}><Edit className="h-4 w-4" /></Button>
                            <Button size="sm" variant="destructive" onClick={() => setDeleting(u)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Delete confirmation (animated AlertDialog) */}
                <AlertDialog open={!!deleting} onOpenChange={(open) => { if (!open) setDeleting(null); }}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Hapus pengguna?</AlertDialogTitle>
                    </AlertDialogHeader>
                    <AlertDialogDescription>Pengguna yang dihapus tidak dapat dikembalikan. Lanjutkan?</AlertDialogDescription>
                    <div className="mt-4 flex justify-end gap-2">
                      <AlertDialogCancel>Batal</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleting && void handleDelete(deleting.id)}>Hapus</AlertDialogAction>
                    </div>
                  </AlertDialogContent>
                </AlertDialog>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">Menampilkan {Math.min(pageSize, users.length)} dari {total} pengguna</div>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious onClick={() => setPage((p) => Math.max(1, p - 1))} />
                      </PaginationItem>

                      {/* simple page numbers: show few pages around current */}
                      {Array.from({ length: totalPages }).map((_, idx) => {
                        const p = idx + 1;
                        return (
                          <PaginationItem key={p}>
                            <PaginationLink isActive={p === page} onClick={() => setPage(p)}>{p}</PaginationLink>
                          </PaginationItem>
                        );
                      })}

                      <PaginationItem>
                        <PaginationNext onClick={() => setPage((p) => Math.min(totalPages, p + 1))} />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        {/* Edit dialog */}
        <Dialog open={!!editing} onOpenChange={(open) => { if (!open) setEditing(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit pengguna</DialogTitle>
            </DialogHeader>
            <div className="grid gap-2">
              <label className="text-xs text-muted-foreground">Email (readonly)</label>
              <Input value={editValues?.email ?? ''} readOnly />

              <label className="text-xs text-muted-foreground">Nama lengkap</label>
              <Input value={editValues?.full_name ?? ''} onChange={(e) => setEditValues({ ...editValues, full_name: e.target.value })} />

              <label className="text-xs text-muted-foreground">Role</label>
              <select className="w-full rounded-md border px-2 py-1" value={editValues?.role ?? 'customer'} onChange={(e) => setEditValues({ ...editValues, role: e.target.value as UserProfile['role'] })}>
                <option value="customer">customer</option>
                <option value="admin">admin</option>
              </select>

              {/* reward_points intentionally hidden from edit modal */}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
              <Button onClick={() => { if (editing) void handleSave({ id: editing.id, ...editValues }); }}>Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </div>
  );
}


