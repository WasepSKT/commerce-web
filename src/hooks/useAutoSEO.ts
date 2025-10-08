import { useCallback } from 'react';
import { generateBlogSEO, generateProductSEO, BlogSEOData, ProductSEOData } from '@/utils/seoGenerator';

export const useAutoSEO = () => {
  // Generate SEO for blog posts
  const generateBlogSEOData = useCallback((blogData: BlogSEOData) => {
    return generateBlogSEO(blogData);
  }, []);

  // Generate SEO for products
  const generateProductSEOData = useCallback((productData: ProductSEOData) => {
    return generateProductSEO(productData);
  }, []);

  // Auto-generate slug from title
  const generateSlug = useCallback((title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim()
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  }, []);

  // Auto-generate meta description from content
  const generateMetaDescription = useCallback((content: string, maxLength: number = 160): string => {
    const cleanContent = content.replace(/<[^>]*>/g, '').trim();
    if (cleanContent.length <= maxLength) {
      return cleanContent;
    }
    
    // Try to cut at sentence boundary
    const sentences = cleanContent.split(/[.!?]+/);
    let result = '';
    
    for (const sentence of sentences) {
      if ((result + sentence).length <= maxLength - 3) {
        result += sentence + '. ';
      } else {
        break;
      }
    }
    
    // If no sentences fit, cut at word boundary
    if (!result) {
      const words = cleanContent.split(' ');
      result = words[0];
      
      for (let i = 1; i < words.length; i++) {
        if ((result + ' ' + words[i]).length <= maxLength - 3) {
          result += ' ' + words[i];
        } else {
          break;
        }
      }
    }
    
    return result.trim() + (result.length < cleanContent.length ? '...' : '');
  }, []);

  // Auto-generate keywords from title and content
  const generateKeywords = useCallback((title: string, content: string, categories?: string[]): string => {
    const baseKeywords = [
      'Regal Paw',
      'makanan kucing premium',
      'nutrisi kucing',
      'kesehatan kucing'
    ];

    // Extract keywords from title
    const titleWords = title
      .toLowerCase()
      .split(' ')
      .filter(word => word.length > 3 && !['dan', 'atau', 'dari', 'untuk', 'dengan', 'yang'].includes(word));

    // Extract keywords from content (first 200 words)
    const cleanContent = content.replace(/<[^>]*>/g, '');
    const contentWords = cleanContent
      .toLowerCase()
      .split(' ')
      .slice(0, 200)
      .filter(word => word.length > 4)
      .filter(word => !['yang', 'dari', 'untuk', 'dengan', 'adalah', 'akan', 'sudah', 'telah'].includes(word));

    // Add category keywords
    const categoryKeywords = categories?.map(cat => 
      `makanan kucing ${cat.toLowerCase()}`
    ) || [];

    // Combine and deduplicate
    const allKeywords = [
      ...baseKeywords,
      ...titleWords,
      ...contentWords.slice(0, 5), // Take top 5 content words
      ...categoryKeywords
    ];

    // Remove duplicates and limit to 15 keywords
    const uniqueKeywords = [...new Set(allKeywords)].slice(0, 15);
    
    return uniqueKeywords.join(', ');
  }, []);

  // Validate SEO data
  const validateSEO = useCallback((seoData: {
    title: string;
    description: string;
    keywords: string;
  }) => {
    const issues: string[] = [];

    if (seoData.title.length < 30) {
      issues.push('Title is too short (minimum 30 characters)');
    }
    if (seoData.title.length > 60) {
      issues.push('Title is too long (maximum 60 characters)');
    }
    if (seoData.description.length < 120) {
      issues.push('Description is too short (minimum 120 characters)');
    }
    if (seoData.description.length > 160) {
      issues.push('Description is too long (maximum 160 characters)');
    }
    if (seoData.keywords.split(',').length < 5) {
      issues.push('Add more keywords (minimum 5)');
    }
    if (seoData.keywords.split(',').length > 15) {
      issues.push('Too many keywords (maximum 15)');
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }, []);

  return {
    generateBlogSEOData,
    generateProductSEOData,
    generateSlug,
    generateMetaDescription,
    generateKeywords,
    validateSEO
  };
};
