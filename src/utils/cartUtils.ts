/**
 * Cart utility functions
 */

/**
 * Validate UUID format
 */
export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Normalize Supabase response shapes
 */
export function normalizeSupabaseResult<T>(res: unknown): { data?: T | null; error?: unknown } {
  if (res && typeof res === 'object') {
    const r = res as Record<string, unknown>;
    return { data: r['data'] as T | undefined, error: r['error'] };
  }
  return { data: res as T, error: undefined };
}

/**
 * Filter valid UUIDs from array
 */
export function filterValidUUIDs(ids: string[]): string[] {
  return ids.filter((id) => {
    if (!id || typeof id !== 'string' || id.trim() === '') {
      return false;
    }
    return isValidUUID(id);
  });
}

