// SEO data and structured data generators for different page types

export interface ProductSEO {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  stock_quantity: number;
  brand?: string;
  sku?: string;
  rating?: number;
  reviewCount?: number;
}

export interface BlogPostSEO {
  id: string;
  title: string;
  slug: string;
  content: string;
  cover_url?: string;
  created_at: string;
  updated_at: string;
  author?: string;
  excerpt?: string;
}

// Base organization data
export const organizationData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Regal Paw",
  "description": "Penyedia makanan premium berkualitas tinggi untuk kucing kesayangan Anda",
  "url": "https://regalpaw.id",
  "logo": "https://regalpaw.id/logo.png",
  "image": "https://regalpaw.id/og-image.jpg",
  "telephone": "+62-xxx-xxx-xxxx",
  "email": "info@regalpaw.com",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Jl. Contoh No. 123",
    "addressLocality": "Jakarta",
    "addressRegion": "DKI Jakarta",
    "postalCode": "12345",
    "addressCountry": "ID"
  },
  "sameAs": [
    "https://www.instagram.com/regalpaw",
    "https://www.facebook.com/regalpaw",
    "https://www.twitter.com/regalpaw"
  ],
  "foundingDate": "2024",
  "slogan": "Nutrisi Terbaik untuk Kucing Kesayangan"
};

// Website structured data
export const websiteData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Regal Paw",
  "description": "Berikan yang terbaik untuk kucing Anda dengan makanan premium berkualitas tinggi",
  "url": "https://regalpaw.id",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://regalpaw.id/products?search={search_term_string}",
    "query-input": "required name=search_term_string"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Regal Paw",
    "logo": {
      "@type": "ImageObject",
      "url": "https://regalpaw.id/logo.png"
    }
  }
};

// Generate product structured data
export const generateProductStructuredData = (product: ProductSEO) => {
  const baseUrl = 'https://regalpaw.id';
  
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description,
    "image": product.image_url.startsWith('http') ? product.image_url : `${baseUrl}${product.image_url}`,
    "sku": product.sku || product.id,
    "brand": {
      "@type": "Brand",
      "name": product.brand || "Regal Paw"
    },
    "category": product.category,
    "offers": {
      "@type": "Offer",
      "price": product.price,
      "priceCurrency": "IDR",
      "availability": product.stock_quantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "Regal Paw"
      },
      "url": `${baseUrl}/product/${product.id}`
    },
    "aggregateRating": product.rating && product.reviewCount ? {
      "@type": "AggregateRating",
      "ratingValue": product.rating,
      "reviewCount": product.reviewCount,
      "bestRating": 5,
      "worstRating": 1
    } : undefined
  };
};

// Generate blog post structured data
export const generateBlogPostStructuredData = (post: BlogPostSEO) => {
  const baseUrl = 'https://regalpaw.id';
  
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.excerpt || post.description,
    "image": post.cover_url ? (post.cover_url.startsWith('http') ? post.cover_url : `${baseUrl}${post.cover_url}`) : undefined,
    "author": {
      "@type": "Person",
      "name": post.author || "Regal Paw Team"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Regal Paw",
      "logo": {
        "@type": "ImageObject",
        "url": "https://regalpaw.id/logo.png"
      }
    },
    "datePublished": post.created_at,
    "dateModified": post.updated_at,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${baseUrl}/blog/${post.slug}`
    },
    "url": `${baseUrl}/blog/${post.slug}`
  };
};

// Generate breadcrumb structured data
export const generateBreadcrumbStructuredData = (items: Array<{ name: string; url: string }>) => {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };
};

// Generate FAQ structured data
export const generateFAQStructuredData = (faqs: Array<{ question: string; answer: string }>) => {
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

// Page-specific SEO data
export const pageSEOData = {
  home: {
    title: 'Regal Paw - Nutrisi Terbaik untuk Kucing Kesayangan',
    description: 'Berikan yang terbaik untuk kucing Anda dengan makanan premium berkualitas tinggi dari Regal Paw. Produk 100% natural, kualitas premium, dan nutrisi lengkap untuk kucing kesayangan Anda.',
    keywords: 'makanan kucing, nutrisi kucing, makanan premium kucing, Regal Paw, kucing sehat, makanan natural kucing, vitamin kucing, suplemen kucing'
  },
  products: {
    title: 'Produk Makanan Kucing Premium - Regal Paw',
    description: 'Temukan berbagai pilihan makanan kucing premium berkualitas tinggi. Nutrisi lengkap untuk kesehatan dan pertumbuhan kucing kesayangan Anda.',
    keywords: 'produk makanan kucing, makanan kucing premium, nutrisi kucing, vitamin kucing, suplemen kucing, makanan natural kucing'
  },
  about: {
    title: 'Tentang Regal Paw - Komitmen Nutrisi Terbaik untuk Kucing',
    description: 'Pelajari lebih lanjut tentang Regal Paw, komitmen kami dalam menyediakan nutrisi terbaik untuk kucing kesayangan Anda dengan standar kualitas internasional.',
    keywords: 'tentang Regal Paw, perusahaan makanan kucing, komitmen kualitas, nutrisi kucing premium'
  },
  contact: {
    title: 'Hubungi Regal Paw - Customer Service 24/7',
    description: 'Hubungi tim customer service Regal Paw untuk pertanyaan, saran, atau bantuan terkait produk makanan kucing premium kami.',
    keywords: 'kontak Regal Paw, customer service, bantuan produk, pertanyaan makanan kucing'
  },
  blog: {
    title: 'Blog Regal Paw - Tips dan Informasi Kesehatan Kucing',
    description: 'Temukan tips, informasi, dan panduan lengkap tentang perawatan dan kesehatan kucing dari para ahli Regal Paw.',
    keywords: 'blog kucing, tips kesehatan kucing, perawatan kucing, informasi kucing, panduan kucing'
  },
  career: {
    title: 'Karir di Regal Paw - Bergabunglah dengan Tim Kami',
    description: 'Bergabunglah dengan tim Regal Paw dan berkontribusi dalam menyediakan nutrisi terbaik untuk kucing kesayangan di Indonesia.',
    keywords: 'karir Regal Paw, lowongan kerja, bergabung tim, pekerjaan makanan kucing'
  }
};

// Generate dynamic page title
export const generatePageTitle = (pageTitle: string, siteName: string = 'Regal Paw') => {
  return `${pageTitle} | ${siteName}`;
};

// Generate meta description
export const generateMetaDescription = (description: string, maxLength: number = 160) => {
  if (description.length <= maxLength) return description;
  return description.substring(0, maxLength - 3) + '...';
};

