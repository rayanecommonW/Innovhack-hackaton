/**
 * Tests for Categories
 */

import { CATEGORIES, getCategoryIcon, getCategoryName, getCategoryColor } from '../constants/categories';

describe('Categories', () => {
  describe('CATEGORIES', () => {
    it('should have required categories', () => {
      expect(CATEGORIES).toHaveProperty('fitness');
      expect(CATEGORIES).toHaveProperty('finance');
      expect(CATEGORIES).toHaveProperty('learning');
      expect(CATEGORIES).toHaveProperty('health');
      expect(CATEGORIES).toHaveProperty('productivity');
    });

    it('should have proper structure for each category', () => {
      Object.values(CATEGORIES).forEach((category) => {
        expect(category).toHaveProperty('id');
        expect(category).toHaveProperty('name');
        expect(category).toHaveProperty('icon');
        expect(category).toHaveProperty('color');
      });
    });
  });

  describe('getCategoryName', () => {
    it('should return category name for valid category', () => {
      const name = getCategoryName('fitness');
      expect(name).toBeTruthy();
      expect(typeof name).toBe('string');
    });

    it('should return fallback for unknown category', () => {
      const name = getCategoryName('unknown_category');
      expect(name).toBeTruthy();
    });
  });

  describe('getCategoryIcon', () => {
    it('should return icon name for valid category', () => {
      const icon = getCategoryIcon('fitness');
      expect(icon).toBeTruthy();
      expect(typeof icon).toBe('string');
    });

    it('should return default icon for unknown category', () => {
      const icon = getCategoryIcon('unknown_category');
      expect(icon).toBeTruthy();
    });
  });

  describe('getCategoryColor', () => {
    it('should return color for valid category', () => {
      const color = getCategoryColor('fitness');
      expect(color).toBeTruthy();
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it('should return default color for unknown category', () => {
      const color = getCategoryColor('unknown_category');
      expect(color).toBeTruthy();
    });
  });
});
