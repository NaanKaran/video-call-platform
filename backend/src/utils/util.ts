/**
 * Utility functions
 */

/**
 * Check if value is empty (null, undefined, empty string, empty array, or empty object)
 * @param value - Value to check
 * @returns True if value is empty, false otherwise
 */
export const isEmpty = (value: any): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};