import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type FixedBanner = Database['public']['Tables']['fixed_banners']['Row'];

interface FixedBannerDisplayProps {
  position: 'left' | 'right';
  className?: string;
}

export function FixedBannerDisplay({ position, className = '' }: FixedBannerDisplayProps) {
  const [banner, setBanner] = useState<FixedBanner | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBanner = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('fixed_banners')
        .select('*')
        .eq('position', position)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching fixed banner:', error);
        return;
      }

      setBanner(data);
    } catch (error) {
      console.error('Exception in fetchBanner:', error);
    } finally {
      setLoading(false);
    }
  }, [position]);

  useEffect(() => {
    fetchBanner();
  }, [fetchBanner]);

  if (loading) {
    return (
      <div className={`w-full h-64 bg-gray-100 rounded-lg animate-pulse ${className}`}>
        <div className="h-full flex items-center justify-center text-gray-400">
          Loading banner...
        </div>
      </div>
    );
  }

  if (!banner) {
    return null; // Don't show anything if no active banner
  }

  const BannerContent = () => (
    <div className="relative w-full h-64 overflow-hidden rounded-lg bg-gray-50 group hover:shadow-lg transition-shadow">
      <img
        src={banner.image_url}
        alt={banner.name}
        className="w-full h-full object-cover transition-transform group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );

  return (
    <div className={`w-full ${className}`}>
      {banner.link_url ? (
        <a
          href={banner.link_url}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <BannerContent />
        </a>
      ) : (
        <BannerContent />
      )}

      {/* Optional: Banner label */}
      <div className="mt-2 text-sm text-gray-600 text-center">
        {banner.name}
      </div>
    </div>
  );
}

// Convenience components for specific positions
export function LeftFixedBanner({ className }: { className?: string }) {
  return <FixedBannerDisplay position="left" className={className} />;
}

export function RightFixedBanner({ className }: { className?: string }) {
  return <FixedBannerDisplay position="right" className={className} />;
}