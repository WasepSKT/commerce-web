import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import {
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import {
  Home,
  Package,
  Users,
  Megaphone,
  Gift,
  Settings as SettingsIcon,
  CreditCard,
  Truck,
  ShoppingBag,
  Newspaper,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { hasPermission, canAccessAdmin } from '@/utils/rolePermissions';
import { UserRole } from '@/pages/admin/UserManagement';

export default function AdminSidebarNav() {
  const { isAuthenticated, profile, loading } = useAuth();
  const location = useLocation();
  const [isReferralOpen, setIsReferralOpen] = useState(
    location.pathname.startsWith('/admin/referrals') || location.pathname.startsWith('/admin/referral')
  );

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');
  // Dashboard should only be active on the exact /admin route, not its subpaths
  const isDashboardActive = location.pathname === '/admin';

  // Check if any referral submenu is active
  const isReferralActive = location.pathname.startsWith('/admin/referral');
  
  // Get user role for permission checks
  const userRole = (profile?.role as UserRole) || 'customer';
  
  // Check if user can access admin panel at all
  if (!isAuthenticated || !canAccessAdmin(userRole)) {
    return null;
  }
  return (
    <div className="admin-sidebar mt-4">
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isDashboardActive}>
              <Link
                to="/admin"
                className={`sidebar-link flex items-center gap-4 px-4 py-3 rounded-l-md transition-colors text-base ${isDashboardActive
                  ? 'sidebar-link--active text-primary-foreground font-semibold' // bright theme active via CSS var
                  : 'text-muted-foreground hover:bg-muted/10 hover:text-muted-foreground'
                  }`}
                aria-current={isDashboardActive ? 'page' : undefined}
              >
                <Home className={`h-5 w-5 ${isDashboardActive ? 'text-primary-foreground' : ''}`} />
                <span className="text-base">Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {isAuthenticated && isAdmin && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive('/admin/products')}>
                <Link
                  to="/admin/products"
                  className={`sidebar-link flex items-center gap-4 px-4 py-3 rounded-l-md transition-colors text-base ${isActive('/admin/products')
                    ? 'sidebar-link--active text-primary-foreground font-semibold'
                    : 'text-muted-foreground hover:bg-muted/10 hover:text-muted-foreground'
                    }`}
                  aria-current={isActive('/admin/products') ? 'page' : undefined}
                >
                  <Package className={`h-5 w-5 ${isActive('/admin/products') ? 'text-primary-foreground' : ''}`} />
                  <span className="text-base">Product</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          {isAuthenticated && isAdmin && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive('/admin/blogs')}>
                <Link
                  to="/admin/blogs"
                  className={`sidebar-link flex items-center gap-4 px-4 py-3 rounded-l-md transition-colors text-base ${isActive('/admin/blogs')
                    ? 'sidebar-link--active text-primary-foreground font-semibold'
                    : 'text-muted-foreground hover:bg-muted/10 hover:text-muted-foreground'
                    }`}
                  aria-current={isActive('/admin/blogs') ? 'page' : undefined}
                >
                  <Newspaper className={`h-5 w-5 ${isActive('/admin/blogs') ? 'text-primary-foreground' : ''}`} />
                  <span className="text-base">Blogs</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          {isAuthenticated && isAdmin && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive('/admin/users')}>
                <Link
                  to="/admin/users"
                  className={`sidebar-link flex items-center gap-4 px-4 py-3 rounded-l-md transition-colors text-base ${isActive('/admin/users')
                    ? 'sidebar-link--active text-primary-foreground font-semibold'
                    : 'text-muted-foreground hover:bg-muted/10 hover:text-muted-foreground'
                    }`}
                  aria-current={isActive('/admin/users') ? 'page' : undefined}
                >
                  <Users className={`h-5 w-5 ${isActive('/admin/users') ? 'text-primary-foreground' : ''}`} />
                  <span className="text-base">User</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          {isAuthenticated && isAdmin && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive('/admin/campaign')}>
                <Link
                  to="/admin/campaign"
                  className={`sidebar-link flex items-center gap-4 px-4 py-3 rounded-l-md transition-colors text-base ${isActive('/admin/campaign')
                    ? 'sidebar-link--active text-primary-foreground font-semibold'
                    : 'text-muted-foreground hover:bg-muted/10 hover:text-muted-foreground'
                    }`}
                  aria-current={isActive('/admin/campaign') ? 'page' : undefined}
                >
                  <Megaphone className={`h-5 w-5 ${isActive('/admin/campaign') ? 'text-primary-foreground' : ''}`} />
                  <span className="text-base">Campaign</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          {isAuthenticated && isAdmin && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive('/admin/payments')}>
                <Link
                  to="/admin/payments"
                  className={`sidebar-link flex items-center gap-4 px-4 py-3 rounded-l-md transition-colors text-base ${isActive('/admin/payments')
                    ? 'sidebar-link--active text-primary-foreground font-semibold'
                    : 'text-muted-foreground hover:bg-muted/10 hover:text-muted-foreground'
                    }`}
                  aria-current={isActive('/admin/payments') ? 'page' : undefined}
                >
                  <CreditCard className={`h-5 w-5 ${isActive('/admin/payments') ? 'text-primary-foreground' : ''}`} />
                  <span className="text-base">Payments</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          {isAuthenticated && isAdmin && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive('/admin/orders')}>
                <Link
                  to="/admin/orders"
                  className={`sidebar-link flex items-center gap-4 px-4 py-3 rounded-l-md transition-colors text-base ${isActive('/admin/orders')
                    ? 'sidebar-link--active text-primary-foreground font-semibold'
                    : 'text-muted-foreground hover:bg-muted/10 hover:text-muted-foreground'
                    }`}
                  aria-current={isActive('/admin/orders') ? 'page' : undefined}
                >
                  <ShoppingBag className={`h-5 w-5 ${isActive('/admin/orders') ? 'text-primary-foreground' : ''}`} />
                  <span className="text-base">Orders</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          {isAuthenticated && isAdmin && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive('/admin/shipings')}>
                <Link
                  to="/admin/shipings"
                  className={`sidebar-link flex items-center gap-4 px-4 py-3 rounded-l-md transition-colors text-base ${isActive('/admin/shipings')
                    ? 'sidebar-link--active text-primary-foreground font-semibold'
                    : 'text-muted-foreground hover:bg-muted/10 hover:text-muted-foreground'
                    }`}
                  aria-current={isActive('/admin/shipings') ? 'page' : undefined}
                >
                  <Truck className={`h-5 w-5 ${isActive('/admin/shipings') ? 'text-primary-foreground' : ''}`} />
                  <span className="text-base">Shipings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          {isAuthenticated && isAdmin && (
            <SidebarMenuItem>
              {/* Referral Main Menu with Toggle */}
              <SidebarMenuButton
                onClick={() => setIsReferralOpen(!isReferralOpen)}
                isActive={isReferralActive}
                className={`sidebar-link flex items-center justify-between gap-4 px-4 py-3 rounded-l-md transition-colors text-base w-full ${isReferralActive
                    ? 'sidebar-link--active text-primary-foreground font-semibold'
                    : 'text-muted-foreground hover:bg-muted/10 hover:text-muted-foreground'
                  }`}
              >
                <div className="flex items-center gap-4">
                  <Gift className={`h-5 w-5 ${isReferralActive ? 'text-primary-foreground' : ''}`} />
                  <span className="text-base">Referral</span>
                </div>
                {isReferralOpen ? (
                  <ChevronDown className={`h-4 w-4 transition-transform ${isReferralActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                ) : (
                  <ChevronRight className={`h-4 w-4 transition-transform ${isReferralActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                )}
              </SidebarMenuButton>

              {/* Collapsible Submenu */}
              {isReferralOpen && (
                <SidebarMenuSub className="mt-1">
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={location.pathname === '/admin/referrals'}>
                      <Link
                        to="/admin/referrals"
                        className={`sidebar-link flex items-center gap-3 pl-12 pr-4 py-2 rounded-l-md transition-colors text-sm ${location.pathname === '/admin/referrals'
                            ? 'sidebar-link--active text-primary-foreground font-semibold'
                            : 'text-muted-foreground hover:bg-muted/10 hover:text-muted-foreground'
                          }`}
                        aria-current={location.pathname === '/admin/referrals' ? 'page' : undefined}
                      >
                        <Gift className={`h-4 w-4 ${location.pathname === '/admin/referrals' ? 'text-primary-foreground' : ''}`} />
                        <span>All Referrals</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>

                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={location.pathname === '/admin/referrals/purchases'}>
                      <Link
                        to="/admin/referrals/purchases"
                        className={`sidebar-link flex items-center gap-3 pl-12 pr-4 py-2 rounded-l-md transition-colors text-sm ${location.pathname === '/admin/referrals/purchases'
                            ? 'sidebar-link--active text-primary-foreground font-semibold'
                            : 'text-muted-foreground hover:bg-muted/10 hover:text-muted-foreground'
                          }`}
                        aria-current={location.pathname === '/admin/referrals/purchases' ? 'page' : undefined}
                      >
                        <CreditCard className={`h-4 w-4 ${location.pathname === '/admin/referrals/purchases' ? 'text-primary-foreground' : ''}`} />
                        <span>Purchases</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>

                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={location.pathname === '/admin/referrals/settings'}>
                      <Link
                        to="/admin/referrals/settings"
                        className={`sidebar-link flex items-center gap-3 pl-12 pr-4 py-2 rounded-l-md transition-colors text-sm ${location.pathname === '/admin/referrals/settings'
                            ? 'sidebar-link--active text-primary-foreground font-semibold'
                            : 'text-muted-foreground hover:bg-muted/10 hover:text-muted-foreground'
                          }`}
                        aria-current={location.pathname === '/admin/referrals/settings' ? 'page' : undefined}
                      >
                        <SettingsIcon className={`h-4 w-4 ${location.pathname === '/admin/referrals/settings' ? 'text-primary-foreground' : ''}`} />
                        <span>Settings Referral</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              )}
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarContent>
    </div>
  );
}


