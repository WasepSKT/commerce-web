/**
 * Tab component for blog list filtering (admin only)
 */

import { BLOG_MESSAGES } from '@/constants/blog';
import type { BlogListTab } from '@/hooks/useBlogList';

interface BlogListTabsProps {
  tab: BlogListTab;
  onTabChange: (tab: BlogListTab) => void;
}

export default function BlogListTabs({ tab, onTabChange }: BlogListTabsProps) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        className={`px-3 py-1 rounded-md text-sm ${tab === 'published'
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted hover:bg-muted/80'
          }`}
        onClick={() => onTabChange('published')}
      >
        {BLOG_MESSAGES.PUBLISHED}
      </button>
      <button
        type="button"
        className={`px-3 py-1 rounded-md text-sm ${tab === 'draft'
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted hover:bg-muted/80'
          }`}
        onClick={() => onTabChange('draft')}
      >
        {BLOG_MESSAGES.DRAFT}
      </button>
    </div>
  );
}

