import { Database } from '@/integrations/supabase/types';

export type UserRole = Database['public']['Enums']['user_role'];

// Define all possible permissions
export const ALL_PERMISSIONS = [
  'dashboard',
  'products', 
  'users', 
  'campaign', 
  'referral', 
  'blogs', 
  'payments', 
  'orders', 
  'shipping', 
  'settings'
] as const;

export type Permission = typeof ALL_PERMISSIONS[number];

// Permission definitions for each role
export const PERMISSIONS: Record<UserRole, Permission[]> = {
  // Full admin access
  admin: [
    'dashboard',
    'products', 
    'users', 
    'campaign', 
    'referral', 
    'blogs', 
    'payments', 
    'orders', 
    'shipping', 
    'settings'
  ],
  
  // Marketing team access
  marketing: [
    'dashboard',
    'blogs',
    'campaign', 
    'referral'
  ],
  
  // Sales admin access
  admin_sales: [
    'dashboard',
    'products',
    'payments',
    'orders', 
    'shipping'
  ],
  
  // Customer has no admin access
  customer: []
};

// Check if user has specific permission
export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  return PERMISSIONS[userRole]?.includes(permission) ?? false;
}

// Check if user has any of the specified permissions
export function hasAnyPermission(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission));
}

// Check if user has all of the specified permissions
export function hasAllPermissions(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission));
}

// Get user's role display info
export function getRoleInfo(role: UserRole) {
  const roleConfig = {
    admin: {
      label: 'Administrator',
      description: 'Full access to all admin features',
      color: 'destructive' as const,
      permissions: PERMISSIONS.admin
    },
    marketing: {
      label: 'Marketing',
      description: 'Access to blogs, campaigns, and referrals',
      color: 'default' as const,
      permissions: PERMISSIONS.marketing
    },
    admin_sales: {
      label: 'Admin Sales',
      description: 'Access to products, payments, orders, and shipping',
      color: 'secondary' as const,
      permissions: PERMISSIONS.admin_sales
    },
    customer: {
      label: 'Customer',
      description: 'Regular customer account',
      color: 'outline' as const,
      permissions: PERMISSIONS.customer
    }
  };

  return roleConfig[role];
}

// Check if user can access admin panel at all
export function canAccessAdmin(userRole: UserRole): boolean {
  return userRole !== 'customer';
}

// Navigation menu items with their required permissions
export const MENU_PERMISSIONS = {
  dashboard: 'dashboard' as Permission,
  products: 'products' as Permission,
  users: 'users' as Permission,
  blogs: 'blogs' as Permission,
  campaign: 'campaign' as Permission,
  referral: 'referral' as Permission,
  payments: 'payments' as Permission,
  orders: 'orders' as Permission,
  shipping: 'shipping' as Permission,
  settings: 'settings' as Permission
} as const;

// Get filtered navigation items based on user role
export function getFilteredNavItems(userRole: UserRole) {
  const allNavItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/admin',
      icon: 'Home',
      permission: 'dashboard' as Permission
    },
    {
      id: 'products',
      label: 'Products',
      path: '/admin/products',
      icon: 'Package',
      permission: 'products' as Permission
    },
    {
      id: 'users',
      label: 'User Management',
      path: '/admin/users',
      icon: 'Users',
      permission: 'users' as Permission
    },
    {
      id: 'blogs',
      label: 'Blog Management',
      path: '/admin/blogs',
      icon: 'Newspaper',
      permission: 'blogs' as Permission
    },
    {
      id: 'campaign',
      label: 'Campaign',
      path: '/admin/campaign',
      icon: 'Megaphone',
      permission: 'campaign' as Permission
    },
    {
      id: 'referral',
      label: 'Referral System',
      path: '/admin/referral',
      icon: 'Gift',
      permission: 'referral' as Permission,
      subItems: [
        {
          id: 'referral-settings',
          label: 'Settings',
          path: '/admin/referral/settings',
          permission: 'referral' as Permission
        },
        {
          id: 'referral-analytics',
          label: 'Analytics',
          path: '/admin/referral/analytics',
          permission: 'referral' as Permission
        },
        {
          id: 'referral-rewards',
          label: 'Rewards',
          path: '/admin/referral/rewards',
          permission: 'referral' as Permission
        }
      ]
    },
    {
      id: 'payments',
      label: 'Payments',
      path: '/admin/payments',
      icon: 'CreditCard',
      permission: 'payments' as Permission
    },
    {
      id: 'orders',
      label: 'Orders',
      path: '/admin/orders',
      icon: 'ShoppingBag',
      permission: 'orders' as Permission
    },
    {
      id: 'shipping',
      label: 'Shipping',
      path: '/admin/shipping',
      icon: 'Truck',
      permission: 'shipping' as Permission
    }
  ];

  // Filter items based on user permissions
  return allNavItems.filter(item => hasPermission(userRole, item.permission));
}

// Role-based redirect after login
export function getRoleBasedRedirect(userRole: UserRole): string {
  switch (userRole) {
    case 'admin':
      return '/admin';
    case 'marketing':
      return '/admin/blogs'; // Default to blogs for marketing
    case 'admin_sales':
      return '/admin/products'; // Default to products for sales admin
    case 'customer':
    default:
      return '/'; // Regular customers go to homepage
  }
}