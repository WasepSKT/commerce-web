/**
 * Utility functions for text processing
 */

/**
 * Convert HTML content to plain text by removing HTML tags and decoding entities
 * @param html - HTML string to convert
 * @returns Plain text string
 */
export const stripHtml = (html: string): string => {
  if (typeof window !== 'undefined') {
    // Browser environment - use DOM API
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  } else {
    // Server environment or fallback - use regex (less accurate but works)
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
      .replace(/&amp;/g, '&') // Replace &amp; with &
      .replace(/&lt;/g, '<') // Replace &lt; with <
      .replace(/&gt;/g, '>') // Replace &gt; with >
      .replace(/&quot;/g, '"') // Replace &quot; with "
      .replace(/&#39;/g, "'") // Replace &#39; with '
      .trim();
  }
};

/**
 * Truncate text to specified length and add ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export const truncateText = (text: string, maxLength: number = 150): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

/**
 * Convert HTML content to plain text and truncate it
 * @param html - HTML string to convert and truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated plain text
 */
export const htmlToText = (html: string, maxLength: number = 150): string => {
  const plainText = stripHtml(html);
  return truncateText(plainText, maxLength);
};

/**
 * Create excerpt from HTML content for blog cards
 * @param content - HTML content
 * @param maxLength - Maximum length for excerpt
 * @returns Clean excerpt for display
 */
export const createExcerpt = (content: string, maxLength: number = 150): string => {
  return htmlToText(content, maxLength);
};