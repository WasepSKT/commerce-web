import { ReactNode, useState } from 'react';
import regalpawIcon from '/regalpaw-icon.png';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarSeparator,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { User, AlertTriangle, Settings, LogOut, Gift, CreditCard } from 'lucide-react';
import { NotificationDropdown } from '@/components/admin/NotificationDropdown';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import AdminSidebarNav from '@/components/admin/AdminSidebarNav';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

interface AdminLayoutProps {
  active?: 'products' | 'users' | 'campaign';
  onChange?: (key: 'products' | 'users' | 'campaign') => void;
  children: ReactNode;
}

export function AdminLayout({ active, onChange, children }: AdminLayoutProps) {
  const { signOut, profile } = useAuth();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const LogoutFooter = () => {
    const handleLogout = async () => {
      const { error } = await signOut();
      if (error) {
        toast({ variant: 'destructive', title: 'Gagal logout', description: String(error.message || error) });
      } else {
        toast({ title: 'Anda telah logout' });
        navigate('/');
      }
    };
    return (
      <div className="w-full">
        <AlertDialog>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Keluar dari akun?</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogDescription>Apakah Anda yakin ingin logout? Anda akan dialihkan ke halaman utama.</AlertDialogDescription>
            <div className="mt-4 flex justify-end gap-2">
              <AlertDialogCancel className="mr-2">Batal</AlertDialogCancel>
              <AlertDialogAction onClick={handleLogout} className="bg-destructive text-destructive-foreground">Keluar</AlertDialogAction>
            </div>
          </AlertDialogContent>
          <button className="w-full flex items-center justify-center gap-2 rounded-md px-3 py-2 bg-primary text-primary-foreground font-semibold hover:opacity-95">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">Logout</span>
          </button>
        </AlertDialog>
      </div>
    );
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="h-10 w-10 flex items-center justify-center text-primary-foreground overflow-hidden">
                <img src={regalpawIcon} alt="Regal Paw" className="h-10 w-10 object-contain" />
              </div>
              <div>
                <div className="text-sm font-semibold">Admin Menu</div>
                <div className="text-xs text-muted-foreground">Panel pengelolaan</div>
              </div>
            </div>
          </SidebarHeader>
          <SidebarSeparator className="mt-2" />
          <AdminSidebarNav />

          <div className="mt-auto">
            {/* Footer with logout */}
            <div className="px-3 py-3">
              <LogoutFooter />
            </div>
          </div>
        </Sidebar>
        <SidebarInset className="flex-1 min-w-0">
          <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
            <div className="w-full px-4">
              <div className="flex h-16 items-center justify-between">
                <div className="flex items-center gap-3">
                  <SidebarTrigger aria-label="Toggle sidebar" />
                  <div>
                    <div className="text-sm font-medium">Admin Panel</div>
                    <div className="text-xs text-muted-foreground">Kelola toko dan konten</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="hidden md:flex items-center rounded-md px-3 py-1 text-sm font-medium text-muted-foreground">
                    {profile?.full_name ?? profile?.email ?? 'Admin'}
                  </div>

                  {/* Notification dropdown */}
                  <NotificationDropdown />

                  {/* User dropdown */}
                  <div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="inline-flex items-center rounded-full bg-muted/40 p-1 cursor-pointer hover:bg-primary/10 hover:text-primary">
                          <User className="h-5 w-5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <div className="flex items-center justify-start gap-2 p-2">
                          <div className="flex flex-col space-y-1 leading-none">
                            <p className="font-medium text-sm">{profile?.full_name || profile?.email}</p>
                            <p className="text-xs text-muted-foreground">{profile?.email}</p>
                          </div>
                        </div>
                        <DropdownMenuSeparator />
                        {/* Role-based menu: only admin sees Pengguna; remove general Settings link as requested */}
                        {profile?.role === 'admin' && (
                          <>
                            <DropdownMenuItem asChild>
                              <a href="/admin/users" className="flex items-center cursor-pointer"><User className="mr-2 h-4 w-4" />Pengguna</a>
                            </DropdownMenuItem>
                          </>
                        )}

                        {/* Referral quick links: visible to admin, marketing, admin_sales */}
                        {(profile?.role === 'admin' || profile?.role === 'marketing' || profile?.role === 'admin_sales') && (
                          <>
                            <DropdownMenuItem asChild>
                              <a href="/admin/referrals" className="flex items-center cursor-pointer"><Gift className="mr-2 h-4 w-4" />Semua Referral</a>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <a href="/admin/referrals/purchases" className="flex items-center cursor-pointer"><CreditCard className="mr-2 h-4 w-4" />Pembelian</a>
                            </DropdownMenuItem>
                            {/* Pengaturan Referral hanya untuk admin dan marketing */}
                            {(profile?.role === 'admin' || profile?.role === 'marketing') && (
                              <DropdownMenuItem asChild>
                                <a href="/admin/referrals/settings" className="flex items-center cursor-pointer"><Settings className="mr-2 h-4 w-4" />Pengaturan Referral</a>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                          </>
                        )}
                        <DropdownMenuItem className="cursor-pointer" onSelect={() => setLogoutOpen(true)}>
                          <span className="flex items-center"><LogOut className="mr-2 h-4 w-4" />Keluar</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Logout confirmation dialog controlled by state */}
                    <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Keluar dari akun?</AlertDialogTitle>
                        </AlertDialogHeader>
                        <AlertDialogDescription>Apakah Anda yakin ingin logout? Anda akan dialihkan ke halaman utama.</AlertDialogDescription>
                        <div className="mt-4 flex justify-end gap-2">
                          <AlertDialogCancel className="mr-2">Batal</AlertDialogCancel>
                          <AlertDialogAction onClick={async () => {
                            const { error } = await signOut();
                            if (error) {
                              toast({ variant: 'destructive', title: 'Gagal logout', description: String(error.message || error) });
                            } else {
                              toast({ title: 'Anda telah logout' });
                              navigate('/');
                            }
                          }} className="bg-destructive text-destructive-foreground">Keluar</AlertDialogAction>
                        </div>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            </div>
          </header>
          <div className="w-full max-w-full px-4 md:px-6 py-6 md:py-8">{children}</div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

export default AdminLayout;


