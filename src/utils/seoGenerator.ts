// Enhanced SEO generation utilities for automatic SEO when admin adds content

export interface SEOData {
  title: string;
  description: string;
  keywords: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonical?: string;
  structuredData?: Record<string, unknown>;
}

export interface BlogSEOData {
  title: string;
  content: string;
  slug: string;
  cover_url?: string;
  author?: string;
  categories?: string[];
  created_at: string;
  updated_at?: string;
}

export interface ProductSEOData {
  name: string;
  description: string;
  price: number;
  category: string;
  image_url?: string;
  brand?: string;
  stock_quantity: number;
  rating?: number;
  reviewCount?: number;
}

// Generate automatic SEO for blog posts
export const generateBlogSEO = (blogData: BlogSEOData): SEOData => {
  const baseUrl = 'https://regalpaw.id';
  
  // Clean content for description
  const cleanContent = blogData.content.replace(/<[^>]*>/g, '').trim();
  const excerpt = cleanContent.length > 160 
    ? cleanContent.substring(0, 160) + '...' 
    : cleanContent;

  // Generate title with brand
  const title = `${blogData.title} | Blog Regal Paw - Tips & Perawatan Kucing`;

  // Generate description with call-to-action
  const description = blogData.meta_description || 
    `${excerpt} Baca artikel lengkap tentang ${blogData.title} di Regal Paw. Tips terbaik untuk perawatan kucing kesayangan Anda.`;

  // Generate keywords from title, categories, and content
  const titleWords = blogData.title.toLowerCase().split(' ').filter(word => word.length > 3);
  const categoryWords = blogData.categories?.map(cat => cat.toLowerCase()) || [];
  const contentWords = cleanContent.toLowerCase()
    .split(' ')
    .filter(word => word.length > 4)
    .slice(0, 10);
  
  const keywords = [
    ...titleWords,
    ...categoryWords,
    ...contentWords,
    'blog kucing',
    'tips kucing',
    'perawatan kucing',
    'Regal Paw',
    'makanan kucing premium'
  ].join(', ');

  // Generate structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": blogData.title,
    "description": description,
    "image": blogData.cover_url || `${baseUrl}/og-image.jpg`,
    "author": {
      "@type": "Person",
      "name": blogData.author || "Regal Paw Team"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Regal Paw",
      "logo": {
        "@type": "ImageObject",
        "url": `${baseUrl}/logo.png`
      }
    },
    "datePublished": blogData.created_at,
    "dateModified": blogData.updated_at || blogData.created_at,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${baseUrl}/blog/${blogData.slug}`
    },
    "keywords": keywords,
    "articleSection": blogData.categories?.[0] || "Perawatan Kucing"
  };

  return {
    title,
    description,
    keywords,
    ogTitle: title,
    ogDescription: description,
    ogImage: blogData.cover_url || `${baseUrl}/og-image.jpg`,
    canonical: `/blog/${blogData.slug}`,
    structuredData
  };
};

// Generate automatic SEO for products
export const generateProductSEO = (productData: ProductSEOData): SEOData => {
  const baseUrl = 'https://regalpaw.id';
  
  // Generate title with price and category
  const title = `${productData.name} - ${productData.category} Premium | Regal Paw`;

  // Generate description with benefits and price
  const priceFormatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(productData.price);

  const description = `${productData.description.substring(0, 120)}... Beli ${productData.name} dengan harga ${priceFormatted}. Kualitas premium untuk kesehatan kucing kesayangan Anda. Stok tersedia ${productData.stock_quantity} unit.`;

  // Generate keywords from product data
  const keywords = [
    productData.name.toLowerCase(),
    `makanan kucing ${productData.category.toLowerCase()}`,
    productData.category.toLowerCase(),
    'Regal Paw',
    'makanan kucing premium',
    'nutrisi kucing',
    'kesehatan kucing',
    'makanan kucing berkualitas',
    productData.brand?.toLowerCase() || 'regal paw'
  ].join(', ');

  // Generate structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": productData.name,
    "description": productData.description,
    "image": productData.image_url || `${baseUrl}/og-image.jpg`,
    "brand": {
      "@type": "Brand",
      "name": productData.brand || "Regal Paw"
    },
    "category": productData.category,
    "offers": {
      "@type": "Offer",
      "price": productData.price,
      "priceCurrency": "IDR",
      "availability": productData.stock_quantity > 0 
        ? "https://schema.org/InStock" 
        : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "Regal Paw"
      },
      "url": `${baseUrl}/product/${productData.name.toLowerCase().replace(/\s+/g, '-')}`
    },
    "aggregateRating": productData.rating && productData.reviewCount ? {
      "@type": "AggregateRating",
      "ratingValue": productData.rating,
      "reviewCount": productData.reviewCount
    } : undefined
  };

  return {
    title,
    description,
    keywords,
    ogTitle: title,
    ogDescription: description,
    ogImage: productData.image_url || `${baseUrl}/og-image.jpg`,
    canonical: `/product/${productData.name.toLowerCase().replace(/\s+/g, '-')}`,
    structuredData
  };
};

// Generate breadcrumb structured data
export const generateBreadcrumbSEO = (breadcrumbs: Array<{name: string, url: string}>): Record<string, unknown> => {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": crumb.url
    }))
  };
};

// Generate FAQ structured data
export const generateFAQSEO = (faqs: Array<{question: string, answer: string}>): Record<string, unknown> => {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
};

// Generate organization structured data
export const generateOrganizationSEO = (): Record<string, unknown> => {
  const baseUrl = 'https://regalpaw.id';
  
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Regal Paw",
    "description": "Penyedia makanan premium berkualitas tinggi untuk kucing kesayangan Anda",
    "url": baseUrl,
    "logo": `${baseUrl}/logo.png`,
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+62-xxx-xxx-xxxx",
      "contactType": "customer service",
      "availableLanguage": "Indonesian"
    },
    "sameAs": [
      "https://www.instagram.com/regalpaw",
      "https://www.facebook.com/regalpaw",
      "https://www.twitter.com/regalpaw"
    ],
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "ID",
      "addressLocality": "Jakarta",
      "addressRegion": "DKI Jakarta"
    }
  };
};

// Generate website structured data
export const generateWebsiteSEO = (): Record<string, unknown> => {
  const baseUrl = 'https://regalpaw.id';
  
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Regal Paw",
    "description": "Berikan yang terbaik untuk kucing Anda dengan makanan premium berkualitas tinggi",
    "url": baseUrl,
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${baseUrl}/products?search={search_term_string}`,
      "query-input": "required name=search_term_string"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Regal Paw"
    }
  };
};

// Utility to clean and optimize text for SEO
export const optimizeTextForSEO = (text: string, maxLength: number = 160): string => {
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim()
    .substring(0, maxLength)
    .replace(/\s+\S*$/, '') + (text.length > maxLength ? '...' : '');
};

// Generate meta tags for social media
export const generateSocialMeta = (seoData: SEOData, platform: 'facebook' | 'twitter' | 'linkedin') => {
  const baseContent = {
    ...seoData,
    ogTitle: seoData.ogTitle || seoData.title,
    ogDescription: seoData.ogDescription || seoData.description,
    ogImage: seoData.ogImage || 'https://regalpaw.id/og-image.jpg'
  };

  switch (platform) {
    case 'twitter':
      return {
        ...baseContent,
        ogTitle: baseContent.ogTitle.substring(0, 70),
        ogDescription: baseContent.ogDescription.substring(0, 200)
      };
    case 'facebook':
      return {
        ...baseContent,
        ogTitle: baseContent.ogTitle.substring(0, 100),
        ogDescription: baseContent.ogDescription.substring(0, 300)
      };
    case 'linkedin':
      return {
        ...baseContent,
        ogTitle: baseContent.ogTitle.substring(0, 120),
        ogDescription: baseContent.ogDescription.substring(0, 250)
      };
    default:
      return baseContent;
  }
};
