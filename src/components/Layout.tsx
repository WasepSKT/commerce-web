import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { ShoppingCart, User, LogOut, Settings, Package } from 'lucide-react';
import useCart from '@/hooks/useCart';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { profile, signOut, isAuthenticated } = useAuth();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const { totalItems } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="w-full px-4">
          <div className="grid grid-cols-3 items-center h-16">
            {/* Logo (left) */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <img src="/regalpaw.png" alt="Regal Paw" className="h-10 w-auto" />
              </Link>
            </div>

            {/* Navigation (center) */}
            <div className="hidden md:flex items-center justify-center">
              <nav className="flex items-center space-x-8">
                <Link to="/" className={`text-sm font-medium transition-colors hover:text-primary ${location.pathname === '/' ? 'text-primary' : 'text-muted-foreground'}`}>
                  Home
                </Link>
                <Link to="/products" className={`text-sm font-medium transition-colors hover:text-primary ${location.pathname === '/products' ? 'text-primary' : 'text-muted-foreground'}`}>
                  Product
                </Link>
                <Link to="/about" className={`text-sm font-medium transition-colors hover:text-primary ${location.pathname === '/about' ? 'text-primary' : 'text-muted-foreground'}`}>
                  About
                </Link>
                <Link to="/career" className={`text-sm font-medium transition-colors hover:text-primary ${location.pathname === '/career' ? 'text-primary' : 'text-muted-foreground'}`}>
                  Career
                </Link>
                <Link to="/blog" className={`text-sm font-medium transition-colors hover:text-primary ${location.pathname === '/blog' ? 'text-primary' : 'text-muted-foreground'}`}>
                  Blog
                </Link>
                <Link to="/contact" className={`text-sm font-medium transition-colors hover:text-primary ${location.pathname === '/contact' ? 'text-primary' : 'text-muted-foreground'}`}>
                  Contact
                </Link>
              </nav>
            </div>

            {/* User Menu (right) */}
            <div className="flex items-center justify-end space-x-2">
              {isAuthenticated ? (
                <>
                  {profile?.role === 'admin' && (
                    <Badge variant="secondary" className="mr-2">
                      Admin
                    </Badge>
                  )}
                  {/* cart indicator */}
                  <Link to="/cart" className="mr-2">
                    <div className="relative inline-flex">
                      <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full">
                        <ShoppingCart className="h-4 w-4" />
                      </Button>
                      <span className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-primary text-xs text-primary-foreground w-5 h-5">{totalItems}</span>
                    </div>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full cursor-pointer hover:opacity-90">
                        <User className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <div className="flex items-center justify-start gap-2 p-2">
                        <div className="flex flex-col space-y-1 leading-none">
                          <p className="font-medium text-sm">{profile?.full_name || profile?.email}</p>
                          <p className="text-xs text-muted-foreground">{profile?.email}</p>
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      {profile?.role === 'admin' ? (
                        <DropdownMenuItem asChild>
                          <Link to="/admin" className="flex items-center">
                            <Settings className="mr-2 h-4 w-4" />
                            Admin Panel
                          </Link>
                        </DropdownMenuItem>
                      ) : (
                        <>
                          <DropdownMenuItem asChild>
                            <Link to="/dashboard" className="flex items-center">
                              <User className="mr-2 h-4 w-4" />
                              Dashboard
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to="/profile" className="flex items-center">
                              <Settings className="mr-2 h-4 w-4" />
                              Profil
                            </Link>
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="cursor-pointer" onSelect={() => setLogoutOpen(true)}>
                        <span className="flex items-center"><LogOut className="mr-2 h-4 w-4" />Keluar</span>
                      </DropdownMenuItem>
                      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Keluar dari akun?</AlertDialogTitle>
                          </AlertDialogHeader>
                          <AlertDialogDescription>Apakah Anda yakin ingin logout? Anda akan dialihkan ke halaman utama.</AlertDialogDescription>
                          <div className="mt-4 flex justify-end gap-2">
                            <AlertDialogCancel className="mr-2">Batal</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={async () => {
                                const { error } = await signOut();
                                if (error) {
                                  const errMsg = (error as unknown as { message?: string })?.message ?? String(error);
                                  toast({ variant: 'destructive', title: 'Gagal logout', description: errMsg });
                                } else {
                                  toast({ title: 'Anda telah logout' });
                                  navigate('/');
                                }
                              }}
                            >
                              Keluar
                            </AlertDialogAction>
                          </div>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <div className="hidden md:flex items-center space-x-3">
                  <Button asChild size="sm" className="rounded-full px-4 py-2" style={{ backgroundColor: '#7A1316', color: '#F8DF7C' }}>
                    <Link to="/auth/login">Login</Link>
                  </Button>
                  <Button asChild size="sm" className="rounded-full px-4 py-2" style={{ backgroundColor: '#7A1316', color: '#F8DF7C' }}>
                    <Link to="/auth/signup">Sign Up</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t bg-card">
        <div className="w-full px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold mb-4">Regal Paw</h3>
              <p className="text-sm text-muted-foreground">
                Penyedia makanan kucing berkualitas tinggi untuk kesehatan dan kebahagiaan kucing Anda.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Kategori</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Makanan Kering</li>
                <li>Makanan Basah</li>
                <li>Makanan Kitten</li>
                <li>Makanan Dewasa</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Kontak</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Email: info@regalpaw.com</li>
                <li>WhatsApp: +62 812-3456-7890</li>
                <li>Instagram: @regalpaw</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>&copy; 2024 Regal Paw. Semua hak dilindungi.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}