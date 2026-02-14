/**
 * Category Utilities
 * Centralized category management for medicines
 * Eliminates duplication across multiple components
 */

/**
 * Category ID to Name mapping
 */
export const CATEGORY_MAP = {
  1: 'Pain Relief',
  2: 'Antibiotics',
  3: 'Antihistamines',
  4: 'Vitamins',
  5: 'Supplements',
  6: 'Cardiovascular',
  7: 'Respiratory',
  8: 'Gastrointestinal',
  9: 'Dermatological',
};

/**
 * Get category name from category ID
 * @param {number|string} categoryId - Category ID
 * @returns {string} Category name
 */
export const getCategoryName = (categoryId) => {
  return CATEGORY_MAP[categoryId] || 'Unknown';
};

/**
 * Get category ID from category name
 * @param {string} categoryName - Category name
 * @returns {string} Category ID (empty string if not found)
 */
export const getCategoryIdFromName = (categoryName) => {
  const entry = Object.entries(CATEGORY_MAP).find(([id, name]) => name === categoryName);
  return entry ? String(entry[0]) : '';
};

/**
 * Get all categories as array for Select components
 * @returns {Array<{value: string, label: string}>} Categories array
 */
export const getCategoriesList = () => {
  return Object.entries(CATEGORY_MAP).map(([id, name]) => ({
    value: String(id),
    label: name,
  }));
};

export default {
  CATEGORY_MAP,
  getCategoryName,
  getCategoryIdFromName,
  getCategoriesList,
};
