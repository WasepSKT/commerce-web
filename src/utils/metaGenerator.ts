// Utility functions for generating dynamic meta tags and SEO content

export interface MetaContent {
  title: string;
  description: string;
  keywords: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonical?: string;
}

// Generate meta content for product pages
export const generateProductMeta = (product: {
  name: string;
  description: string;
  category: string;
  price: number;
  image_url?: string;
  brand?: string;
}): MetaContent => {
  const title = `${product.name} - Makanan Kucing Premium | Regal Paw`;
  const description = `${product.description.substring(0, 150)}... Beli ${product.name} dengan harga terbaik di Regal Paw. Kualitas premium untuk kucing kesayangan Anda.`;
  const keywords = `${product.name}, makanan kucing ${product.category}, ${product.brand || 'Regal Paw'}, nutrisi kucing premium, harga ${product.name}`;
  
  return {
    title,
    description,
    keywords,
    ogTitle: title,
    ogDescription: description,
    ogImage: product.image_url,
    canonical: `/product/${product.name.toLowerCase().replace(/\s+/g, '-')}`
  };
};

// Generate meta content for blog posts
export const generateBlogMeta = (post: {
  title: string;
  content: string;
  slug: string;
  cover_url?: string;
  author?: string;
}): MetaContent => {
  const title = `${post.title} | Blog Regal Paw`;
  const description = post.content.replace(/<[^>]*>/g, '').substring(0, 160) + '...';
  const keywords = `${post.title}, blog kucing, tips kucing, perawatan kucing, Regal Paw, ${post.author || 'Regal Paw Team'}`;
  
  return {
    title,
    description,
    keywords,
    ogTitle: title,
    ogDescription: description,
    ogImage: post.cover_url,
    canonical: `/blog/${post.slug}`
  };
};

// Generate meta content for category pages
export const generateCategoryMeta = (category: string, productCount: number): MetaContent => {
  const title = `Makanan Kucing ${category} - Koleksi Lengkap | Regal Paw`;
  const description = `Temukan ${productCount}+ produk makanan kucing ${category} berkualitas premium di Regal Paw. Nutrisi lengkap untuk kesehatan kucing kesayangan Anda.`;
  const keywords = `makanan kucing ${category}, ${category} premium, nutrisi kucing, Regal Paw, produk kucing terbaik`;
  
  return {
    title,
    description,
    keywords,
    ogTitle: title,
    ogDescription: description,
    canonical: `/products?category=${category.toLowerCase().replace(/\s+/g, '-')}`
  };
};

// Generate meta content for search results
export const generateSearchMeta = (query: string, resultCount: number): MetaContent => {
  const title = `Hasil Pencarian "${query}" - ${resultCount} Produk Ditemukan | Regal Paw`;
  const description = `Temukan ${resultCount} produk makanan kucing untuk pencarian "${query}" di Regal Paw. Kualitas premium dengan harga terbaik.`;
  const keywords = `${query}, makanan kucing, pencarian produk, Regal Paw, nutrisi kucing premium`;
  
  return {
    title,
    description,
    keywords,
    ogTitle: title,
    ogDescription: description,
    canonical: `/products?search=${encodeURIComponent(query)}`
  };
};

// Generate meta content for pagination
export const generatePaginationMeta = (page: number, totalPages: number, baseTitle: string): MetaContent => {
  const title = page > 1 ? `${baseTitle} - Halaman ${page} dari ${totalPages} | Regal Paw` : baseTitle;
  const description = `Halaman ${page} dari ${totalPages} - ${baseTitle.toLowerCase()}. Temukan produk makanan kucing premium berkualitas tinggi di Regal Paw.`;
  const keywords = `${baseTitle.toLowerCase()}, halaman ${page}, produk kucing, Regal Paw, nutrisi premium`;
  
  return {
    title,
    description,
    keywords,
    ogTitle: title,
    ogDescription: description,
    canonical: page > 1 ? `?page=${page}` : undefined
  };
};

// Generate social media optimized content
export const generateSocialMeta = (content: MetaContent, platform: 'facebook' | 'twitter' | 'linkedin') => {
  const baseContent = {
    ...content,
    ogTitle: content.ogTitle || content.title,
    ogDescription: content.ogDescription || content.description,
    ogImage: content.ogImage || '/og-image.jpg'
  };

  switch (platform) {
    case 'twitter':
      return {
        ...baseContent,
        ogTitle: baseContent.ogTitle.substring(0, 70), // Twitter title limit
        ogDescription: baseContent.ogDescription.substring(0, 200) // Twitter description limit
      };
    case 'facebook':
      return {
        ...baseContent,
        ogTitle: baseContent.ogTitle.substring(0, 100), // Facebook title limit
        ogDescription: baseContent.ogDescription.substring(0, 300) // Facebook description limit
      };
    case 'linkedin':
      return {
        ...baseContent,
        ogTitle: baseContent.ogTitle.substring(0, 120), // LinkedIn title limit
        ogDescription: baseContent.ogDescription.substring(0, 250) // LinkedIn description limit
      };
    default:
      return baseContent;
  }
};

// Generate JSON-LD structured data for different content types
export const generateStructuredData = (type: 'product' | 'blog' | 'organization' | 'website', data: Record<string, unknown>) => {
  const baseUrl = 'https://regalpaw.id';
  
  switch (type) {
    case 'product':
      return {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": data.name,
        "description": data.description,
        "image": data.image_url,
        "brand": {
          "@type": "Brand",
          "name": data.brand || "Regal Paw"
        },
        "category": data.category,
        "offers": {
          "@type": "Offer",
          "price": data.price,
          "priceCurrency": "IDR",
          "availability": data.stock_quantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          "seller": {
            "@type": "Organization",
            "name": "Regal Paw"
          }
        }
      };
      
    case 'blog':
      return {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": data.title,
        "description": data.description,
        "image": data.cover_url,
        "author": {
          "@type": "Person",
          "name": data.author || "Regal Paw Team"
        },
        "publisher": {
          "@type": "Organization",
          "name": "Regal Paw",
          "logo": {
            "@type": "ImageObject",
            "url": `${baseUrl}/logo.png`
          }
        },
        "datePublished": data.created_at,
        "dateModified": data.updated_at || data.created_at
      };
      
    case 'organization':
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
        ]
      };
      
    case 'website':
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
        }
      };
      
    default:
      return null;
  }
};

