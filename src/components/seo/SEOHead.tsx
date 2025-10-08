import { Helmet } from 'react-helmet-async';

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  ogType?: 'website' | 'article' | 'product';
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  twitterSite?: string;
  twitterCreator?: string;
  structuredData?: object;
  noindex?: boolean;
  nofollow?: boolean;
  alternateHreflang?: Array<{ hreflang: string; href: string }>;
  robots?: string;
}

const SEOHead: React.FC<SEOProps> = ({
  title = 'Regal Paw - Nutrisi Terbaik untuk Kucing Kesayangan',
  description = 'Berikan yang terbaik untuk kucing Anda dengan makanan premium berkualitas tinggi dari Regal Paw. Produk 100% natural, kualitas premium, dan nutrisi lengkap untuk kucing kesayangan Anda.',
  keywords = 'makanan kucing, nutrisi kucing, makanan premium kucing, Regal Paw, kucing sehat, makanan natural kucing, vitamin kucing, suplemen kucing',
  canonical,
  ogTitle,
  ogDescription,
  ogImage = '/og-image.jpg',
  ogUrl,
  ogType = 'website',
  twitterCard = 'summary_large_image',
  twitterSite = '@regalpaw',
  twitterCreator = '@regalpaw',
  structuredData,
  noindex = false,
  nofollow = false,
  alternateHreflang,
  robots
}) => {
  const baseUrl = 'https://regalpaw.id';
  const fullCanonical = canonical ? `${baseUrl}${canonical}` : undefined;
  const fullOgUrl = ogUrl ? `${baseUrl}${ogUrl}` : undefined;
  const fullOgImage = ogImage.startsWith('http') ? ogImage : `${baseUrl}${ogImage}`;

  // Generate robots meta
  const robotsContent = robots || [
    noindex ? 'noindex' : 'index',
    nofollow ? 'nofollow' : 'follow',
    'max-snippet:-1',
    'max-image-preview:large',
    'max-video-preview:-1'
  ].join(', ');

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="robots" content={robotsContent} />
      <meta name="author" content="Regal Paw" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="language" content="Indonesian" />
      <meta name="revisit-after" content="7 days" />
      <meta name="distribution" content="global" />
      <meta name="rating" content="general" />

      {/* Canonical URL */}
      {fullCanonical && <link rel="canonical" href={fullCanonical} />}

      {/* Alternate Language Links */}
      {alternateHreflang?.map((alt) => (
        <link key={alt.hreflang} rel="alternate" hrefLang={alt.hreflang} href={alt.href} />
      ))}

      {/* Open Graph Meta Tags */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={ogTitle || title} />
      <meta property="og:description" content={ogDescription || description} />
      <meta property="og:image" content={fullOgImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={ogTitle || title} />
      <meta property="og:url" content={fullOgUrl || fullCanonical} />
      <meta property="og:site_name" content="Regal Paw" />
      <meta property="og:locale" content="id_ID" />

      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:site" content={twitterSite} />
      <meta name="twitter:creator" content={twitterCreator} />
      <meta name="twitter:title" content={ogTitle || title} />
      <meta name="twitter:description" content={ogDescription || description} />
      <meta name="twitter:image" content={fullOgImage} />
      <meta name="twitter:image:alt" content={ogTitle || title} />

      {/* Additional SEO Meta Tags */}
      <meta name="theme-color" content="#7A1316" />
      <meta name="msapplication-TileColor" content="#7A1316" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="Regal Paw" />

      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}

      {/* Preconnect to external domains for performance */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://supabase.co" />
      <link rel="dns-prefetch" href="https://supabase.co" />
    </Helmet>
  );
};

export default SEOHead;

