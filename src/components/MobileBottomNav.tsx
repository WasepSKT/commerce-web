import { Link, useNavigate } from 'react-router-dom';
import { Home, Search, ShoppingCart, User } from 'lucide-react';
import useCart from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

export default function MobileBottomNav() {
  const { totalItems } = useCart();
  const { profile } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 border-t md:hidden">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex-1 flex flex-col items-center justify-center text-muted-foreground hover:text-primary">
            <Home className="w-5 h-5" />
            <span className="text-[11px] mt-0.5">Home</span>
          </Link>

          <Link to="/products" className="flex-1 flex flex-col items-center justify-center text-muted-foreground hover:text-primary">
            <Search className="w-5 h-5" />
            <span className="text-[11px] mt-0.5">Search</span>
          </Link>

          <Link to="/cart" className="flex-1 flex flex-col items-center justify-center text-muted-foreground hover:text-primary relative">
            <ShoppingCart className="w-5 h-5" />
            <span className="text-[11px] mt-0.5">Cart</span>
            {totalItems > 0 && (
              <span className={cn(
                'absolute -top-1 right-6 inline-flex items-center justify-center rounded-full bg-primary text-xs text-primary-foreground w-5 h-5')}
              >{totalItems}</span>
            )}
          </Link>

          <button
            type="button"
            onClick={() => navigate(profile ? '/profile' : '/auth')}
            className="flex-1 flex flex-col items-center justify-center text-muted-foreground hover:text-primary"
          >
            <User className="w-5 h-5" />
            <span className="text-[11px] mt-0.5">Profile</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
