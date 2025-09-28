import { ReactNode } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarSeparator,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Search, User, AlertTriangle } from 'lucide-react';
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
  active?: 'products' | 'users' | 'kampanye';
  onChange?: (key: 'products' | 'users' | 'kampanye') => void;
  children: ReactNode;
}

export function AdminLayout({ active, onChange, children }: AdminLayoutProps) {
  const { signOut, profile } = useAuth();
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
              <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12l2-2 4 4 8-8 4 4v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>
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
                  {/* User dropdown */}
                  <div>
                    <DropdownMenu>
                      <DropdownMenu.Trigger asChild>
                        <button className="inline-flex items-center rounded-full bg-muted/40 p-1">
                          <User className="h-5 w-5" />
                        </button>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Content align="end" className="w-56">
                        <div className="flex items-center justify-start gap-2 p-2">
                          <div className="flex flex-col space-y-1 leading-none">
                            <p className="font-medium text-sm">{profile?.full_name || profile?.email}</p>
                            <p className="text-xs text-muted-foreground">{profile?.email}</p>
                          </div>
                        </div>
                        <DropdownMenu.Separator />
                        <DropdownMenu.Item asChild>
                          <a href="/admin/settings" className="flex items-center"><Settings className="mr-2 h-4 w-4" />Pengaturan</a>
                        </DropdownMenu.Item>
                        <DropdownMenu.Item asChild>
                          <a href="/admin/users" className="flex items-center"><User className="mr-2 h-4 w-4" />Pengguna</a>
                        </DropdownMenu.Item>
                        <DropdownMenu.Separator />
                        <DropdownMenu.Item>
                          <AlertDialog>
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
                            <span className="text-destructive flex items-center">
                              <LogOut className="mr-2 h-4 w-4" />
                              Keluar
                            </span>
                          </AlertDialog>
                        </DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu>
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


