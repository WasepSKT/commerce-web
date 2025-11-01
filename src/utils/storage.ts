/**
 * Safely parse JSON from localStorage/sessionStorage
 * Handles cases where value is "undefined" or "null" string literals
 */
export function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value || value === 'undefined' || value === 'null') {
    return fallback;
  }
  
  try {
    const parsed = JSON.parse(value);
    return parsed as T;
  } catch (e) {
    console.warn('Failed to parse JSON from storage:', e);
    return fallback;
  }
}

/**
 * Safely get and parse JSON from localStorage
 */
export function getJsonFromLocalStorage<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return safeJsonParse(value, fallback);
  } catch (e) {
    console.warn(`Failed to read ${key} from localStorage:`, e);
    return fallback;
  }
}

/**
 * Safely get and parse JSON from sessionStorage
 */
export function getJsonFromSessionStorage<T>(key: string, fallback: T): T {
  try {
    const value = sessionStorage.getItem(key);
    return safeJsonParse(value, fallback);
  } catch (e) {
    console.warn(`Failed to read ${key} from sessionStorage:`, e);
    return fallback;
  }
}



