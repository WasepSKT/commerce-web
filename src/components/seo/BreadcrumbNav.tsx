import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  name: string;
  url: string;
  current?: boolean;
}

interface BreadcrumbNavProps {
  items: BreadcrumbItem[];
  className?: string;
}

const BreadcrumbNav: React.FC<BreadcrumbNavProps> = ({ items, className = '' }) => {
  return (
    <nav aria-label="Breadcrumb" className={`flex items-center space-x-2 text-sm text-muted-foreground ${className}`}>
      <Link 
        to="/" 
        className="hover:text-primary transition-colors duration-200 flex items-center gap-1"
        aria-label="Beranda"
      >
        <Home className="h-4 w-4" />
        <span className="sr-only">Beranda</span>
      </Link>
      
      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
          {item.current ? (
            <span className="text-foreground font-medium" aria-current="page">
              {item.name}
            </span>
          ) : (
            <Link 
              to={item.url} 
              className="hover:text-primary transition-colors duration-200"
            >
              {item.name}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
};

export default BreadcrumbNav;

