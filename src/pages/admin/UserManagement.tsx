import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Edit, Trash2, Users, Shield, Eye, Loader2, UserPlus } from 'lucide-react';
import { TableSkeleton, PaginationSkeleton } from '@/components/ui/AdminSkeleton';

// Extended user roles using Supabase types
export type UserRole = Database['public']['Enums']['user_role'];

export interface ExtendedUserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at?: string | null;
  updated_at?: string | null;
  last_login?: string | null;
  is_active: boolean;
}

interface UserFormData {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
}

// Role configuration for permissions and display
const ROLE_CONFIG = {
  admin: {
    label: 'Administrator',
    description: 'Full access to all admin features',
    color: 'destructive' as const,
    permissions: ['products', 'users', 'campaign', 'referral', 'blogs', 'payments', 'orders', 'shipping', 'settings']
  },
  marketing: {
    label: 'Marketing',
    description: 'Access to blogs, campaigns, and referrals',
    color: 'default' as const,
    permissions: ['blogs', 'campaign', 'referral']
  },
  admin_sales: {
    label: 'Admin Sales',
    description: 'Access to products, payments, orders, and shipping',
    color: 'secondary' as const,
    permissions: ['products', 'payments', 'orders', 'shipping']
  },
  customer: {
    label: 'Customer',
    description: 'Regular customer account',
    color: 'outline' as const,
    permissions: []
  }
};

function formatDate(iso?: string | null) {
  if (!iso) return '-';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '-';
  }
}

function getErrorMessage(err: unknown, fallback = 'Terjadi kesalahan'): string {
  if (!err) return fallback;
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && 'message' in err) {
    const maybe = (err as { message?: unknown }).message;
    if (typeof maybe === 'string') return maybe;
  }
  return fallback;
}

export default function EnhancedUserManagement() {
  const { isAdmin, profile } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<ExtendedUserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');

  // Dialog states
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [deleteUserOpen, setDeleteUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ExtendedUserProfile | null>(null);

  // Form data
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    password: '',
    full_name: '',
    role: 'customer'
  });

  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Fetch users from database
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          email,
          full_name,
          role,
          referral_code,
          referred_by,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false });

      // Apply role filter
      if (roleFilter !== 'all') {
        query = query.eq('role', roleFilter);
      }

      // Apply search filter
      if (searchTerm) {
        query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      const { data, error, count } = await query
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

      if (error) throw error;

      const usersWithStatus = (data || []).filter(user => user !== null).map(user => ({
        id: user.id,
        user_id: user.user_id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        referral_code: user.referral_code,
        referred_by: user.referred_by,
        created_at: user.created_at,
        updated_at: user.updated_at,
        is_active: true, // You might want to add this to your database schema
        last_login: null // You might want to track this
      }));

      setUsers(usersWithStatus);
      setTotalPages(Math.ceil((count || 0) / itemsPerPage));
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        variant: 'destructive',
        title: 'Gagal memuat pengguna',
        description: getErrorMessage(error)
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, roleFilter, itemsPerPage, toast]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin, fetchUsers]);

  // Reset form data
  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      full_name: '',
      role: 'customer'
    });
  };

  // Handle add user
  const handleAddUser = async () => {
    if (!formData.email || !formData.password || !formData.full_name) {
      toast({
        variant: 'destructive',
        title: 'Form tidak lengkap',
        description: 'Email, password, dan nama lengkap harus diisi'
      });
      return;
    }

    setSaving(true);
    try {
      // Create user account (admin creation - no verification email sent)
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: formData.email,
        password: formData.password,
        email_confirm: true, // Mark as confirmed to skip verification
        user_metadata: {
          full_name: formData.full_name,
          created_by_admin: true
        }
      });

      if (authError) throw authError;

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: authData.user.id,
          email: formData.email,
          full_name: formData.full_name,
          role: formData.role
        });

      if (profileError) throw profileError;

      toast({
        title: 'Berhasil menambah pengguna',
        description: `Pengguna ${formData.full_name} berhasil ditambahkan dengan role ${ROLE_CONFIG[formData.role].label}. Akun langsung aktif tanpa verifikasi email.`
      });

      setAddUserOpen(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      console.error('Error adding user:', error);
      toast({
        variant: 'destructive',
        title: 'Gagal menambah pengguna',
        description: getErrorMessage(error)
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle edit user
  const handleEditUser = (user: ExtendedUserProfile) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      password: '', // Don't prefill password for security
      full_name: user.full_name || '',
      role: user.role
    });
    setEditUserOpen(true);
  };

  // Handle update user
  const handleUpdateUser = async () => {
    if (!selectedUser || !formData.full_name) {
      toast({
        variant: 'destructive',
        title: 'Form tidak lengkap',
        description: 'Nama lengkap harus diisi'
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          role: formData.role,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedUser.id);

      if (error) throw error;

      toast({
        title: 'Berhasil memperbarui pengguna',
        description: `Data ${formData.full_name} berhasil diperbarui`
      });

      setEditUserOpen(false);
      resetForm();
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        variant: 'destructive',
        title: 'Gagal memperbarui pengguna',
        description: getErrorMessage(error)
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle delete user
  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setSaving(true);
    try {
      // Delete from auth (this will cascade delete the profile)
      const { error: authError } = await supabase.auth.admin.deleteUser(selectedUser.user_id);

      if (authError) throw authError;

      toast({
        title: 'Berhasil menghapus pengguna',
        description: `Pengguna ${selectedUser.full_name} berhasil dihapus`
      });

      setDeleteUserOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        variant: 'destructive',
        title: 'Gagal menghapus pengguna',
        description: getErrorMessage(error)
      });
    } finally {
      setSaving(false);
    }
  };

  // Filtered and paginated users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = !searchTerm ||
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole = roleFilter === 'all' || user.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  if (!isAdmin) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Shield className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Akses Ditolak</h3>
            <p className="text-muted-foreground">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-primary">User Management</h1>
            <p className="text-muted-foreground">
              Kelola pengguna dan atur role akses untuk tim Anda
            </p>
          </div>
          <Button onClick={() => setAddUserOpen(true)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Tambah Pengguna
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Users className="h-5 w-5 text-primary" />
              Filter Pengguna
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="search">Cari Pengguna</Label>
                <Input
                  id="search"
                  placeholder="Cari berdasarkan nama atau email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="role-filter">Filter Role</Label>
                <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as UserRole | 'all')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih role..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Role</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="admin_sales">Admin Sales</SelectItem>
                    <SelectItem value="customer">Customer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="items-per-page">Tampilkan Per Halaman</Label>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => {
                    setItemsPerPage(Number(value));
                    setCurrentPage(1); // Reset to first page when changing items per page
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 pengguna</SelectItem>
                    <SelectItem value="10">10 pengguna</SelectItem>
                    <SelectItem value="25">25 pengguna</SelectItem>
                    <SelectItem value="50">50 pengguna</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className='text-primary'>Daftar Pengguna ({filteredUsers.length})</CardTitle>
            <CardDescription>
              Kelola akun pengguna dan role akses mereka
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <TableSkeleton />
            ) : (
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama & Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Terdaftar</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="flex flex-col items-center gap-2">
                            <Users className="h-8 w-8 text-muted-foreground" />
                            <span className="text-muted-foreground">Tidak ada pengguna ditemukan</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{user.full_name || 'Nama tidak tersedia'}</div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={ROLE_CONFIG[user.role].color}>
                              {ROLE_CONFIG[user.role].label}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(user.created_at)}</TableCell>
                          <TableCell>
                            <Badge variant={user.is_active ? 'default' : 'secondary'}>
                              {user.is_active ? 'Aktif' : 'Nonaktif'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditUser(user)}
                                disabled={user.id === profile?.id}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setDeleteUserOpen(true);
                                }}
                                disabled={user.id === profile?.id}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                {/* Pagination Info and Controls */}
                {filteredUsers.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
                    <div className="text-sm text-muted-foreground">
                      Menampilkan {Math.min((currentPage - 1) * itemsPerPage + 1, filteredUsers.length)} - {Math.min(currentPage * itemsPerPage, filteredUsers.length)} dari {filteredUsers.length} pengguna
                    </div>
                    {totalPages > 1 && (
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                              className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                          </PaginationItem>
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <PaginationItem key={page}>
                              <PaginationLink
                                onClick={() => setCurrentPage(page)}
                                isActive={currentPage === page}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          ))}
                          <PaginationItem>
                            <PaginationNext
                              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                              className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add User Dialog */}
      <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <UserPlus className="h-5 w-5" />
              Tambah Pengguna Baru
            </DialogTitle>
            <DialogDescription>
              Buat akun pengguna baru dan atur role akses mereka
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimal 6 karakter"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="full_name">Nama Lengkap</Label>
              <Input
                id="full_name"
                placeholder="Nama lengkap pengguna"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value as UserRole }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div>
                      <div className="font-medium">Administrator</div>
                      <div className="text-xs text-muted-foreground">Akses penuh ke semua fitur</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="marketing">
                    <div>
                      <div className="font-medium">Marketing</div>
                      <div className="text-xs text-muted-foreground">Blog, Campaign, Referral</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="admin_sales">
                    <div>
                      <div className="font-medium">Admin Sales</div>
                      <div className="text-xs text-muted-foreground">Product, Payment, Orders, Shipping</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="customer">
                    <div>
                      <div className="font-medium">Customer</div>
                      <div className="text-xs text-muted-foreground">Akun pelanggan biasa</div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300"
              onClick={() => {
                setAddUserOpen(false);
                resetForm();
              }}
              disabled={saving}
            >
              Batal
            </Button>
            <Button onClick={handleAddUser} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Membuat...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Buat Pengguna
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editUserOpen} onOpenChange={setEditUserOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <Edit className="h-5 w-5" />
              Edit Pengguna
            </DialogTitle>
            <DialogDescription>
              Perbarui informasi dan role pengguna
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">Email tidak dapat diubah</p>
            </div>
            <div>
              <Label htmlFor="edit-full_name">Nama Lengkap</Label>
              <Input
                id="edit-full_name"
                placeholder="Nama lengkap pengguna"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="edit-role">Role</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value as UserRole }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="admin_sales">Admin Sales</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300"
              onClick={() => {
                setEditUserOpen(false);
                resetForm();
                setSelectedUser(null);
              }}
              disabled={saving}
            >
              Batal
            </Button>
            <Button onClick={handleUpdateUser} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Simpan
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <AlertDialog open={deleteUserOpen} onOpenChange={setDeleteUserOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Hapus Pengguna</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus pengguna <strong>{selectedUser?.full_name}</strong>?
              Tindakan ini tidak dapat dibatalkan dan akan menghapus semua data terkait.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel
              disabled={saving}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300"
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={saving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Hapus
                </>
              )}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}