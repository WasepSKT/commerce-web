/**
 * Blog utility functions
 */

/**
 * Format date to Indonesian locale (long format)
 */
export function formatBlogDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format date to Indonesian locale (short format)
 */
export function formatBlogDateShort(dateString: string): string {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Calculate reading time from content
 * @param content - HTML content
 * @param wordsPerMinute - Average reading speed (default: 200 words per minute)
 * @returns Reading time in minutes (minimum 1 minute)
 */
export function calculateReadingTime(content: string, wordsPerMinute: number = 200): number {
  const textContent = content.replace(/<[^>]*>/g, '');
  const wordCount = textContent.trim().split(/\s+/).length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return Math.max(1, minutes);
}

/**
 * Resolve category ID from slug or ID
 */
export async function resolveCategoryId(
  categoryParam: string,
  supabaseClient: any
): Promise<{ id: string; name: string } | null> {
  try {
    // Try to resolve categoryParam as slug first
    const res = await supabaseClient
      .from('categories')
      .select('id, name')
      .eq('slug', categoryParam)
      .limit(1)
      .single();

    if (res.data) {
      return res.data as { id: string; name: string };
    }
  } catch (err) {
    // If slug lookup fails, try as ID
    try {
      const res = await supabaseClient
        .from('categories')
        .select('id, name')
        .eq('id', categoryParam)
        .limit(1)
        .single();

      if (res.data) {
        return res.data as { id: string; name: string };
      }
    } catch (idErr) {
      // Both failed, return null
      return null;
    }
  }
  return null;
}

