import { describe, it, expect } from 'vitest';
import { normalizeUnit, parseQuantity, convertToMetric } from './units';

describe('units', () => {
  describe('normalizeUnit', () => {
    it('should normalize common units', () => {
      expect(normalizeUnit('tsp')).toBe('tsp');
      expect(normalizeUnit('teaspoon')).toBe('tsp');
      expect(normalizeUnit('tablespoon')).toBe('tbsp');
      expect(normalizeUnit('cups')).toBe('cup');
    });

    it('should handle case insensitivity', () => {
      expect(normalizeUnit('TSP')).toBe('tsp');
      expect(normalizeUnit('Cup')).toBe('cup');
    });

    it('should return null for unknown units', () => {
      expect(normalizeUnit('xyz')).toBeNull();
    });
  });

  describe('parseQuantity', () => {
    it('should parse whole numbers', () => {
      expect(parseQuantity('2')).toBe(2);
      expect(parseQuantity('10')).toBe(10);
    });

    it('should parse fractions', () => {
      expect(parseQuantity('1/2')).toBe(0.5);
      expect(parseQuantity('3/4')).toBe(0.75);
    });

    it('should parse mixed numbers', () => {
      expect(parseQuantity('1 1/2')).toBe(1.5);
      expect(parseQuantity('2 3/4')).toBe(2.75);
    });

    it('should parse decimals', () => {
      expect(parseQuantity('2.5')).toBe(2.5);
      expect(parseQuantity('0.75')).toBe(0.75);
    });

    it('should return null for invalid input', () => {
      expect(parseQuantity('abc')).toBeNull();
    });
  });

  describe('convertToMetric', () => {
    it('should convert teaspoons to milliliters', () => {
      const result = convertToMetric(2, 'tsp');
      expect(result?.milliliters).toBeCloseTo(9.86, 1);
    });

    it('should convert cups to milliliters', () => {
      const result = convertToMetric(1, 'cup');
      expect(result?.milliliters).toBe(240);
    });

    it('should convert pounds to grams', () => {
      const result = convertToMetric(2, 'lb');
      expect(result?.grams).toBeCloseTo(907.18, 1);
    });

    it('should return null for unknown units', () => {
      const result = convertToMetric(1, 'xyz');
      expect(result).toBeNull();
    });
  });
});
