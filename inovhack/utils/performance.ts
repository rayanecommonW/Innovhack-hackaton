/**
 * Performance Utilities
 * Memoization, caching, and optimization helpers
 */

import { useCallback, useMemo, useRef, useEffect } from 'react';
import { InteractionManager } from 'react-native';

/**
 * Debounce function for expensive operations
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Throttle function for rate limiting
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Hook for debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Need to import useState
import { useState } from 'react';

/**
 * Hook for running expensive operations after interactions
 */
export function useAfterInteraction(callback: () => void, deps: any[] = []) {
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      callback();
    });

    return () => task.cancel();
  }, deps);
}

/**
 * Hook for memoizing expensive calculations
 */
export function useMemoizedValue<T>(
  factory: () => T,
  deps: any[],
  comparator?: (prev: any[], next: any[]) => boolean
): T {
  const ref = useRef<{ deps: any[]; value: T } | null>(null);

  const depsChanged = comparator
    ? ref.current && !comparator(ref.current.deps, deps)
    : !ref.current || !shallowEqual(ref.current.deps, deps);

  if (depsChanged) {
    ref.current = { deps, value: factory() };
  }

  return ref.current!.value;
}

/**
 * Shallow equality check
 */
function shallowEqual(a: any[], b: any[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * Batch state updates
 */
export function batchUpdates(callback: () => void): void {
  // React 18+ automatically batches updates
  callback();
}

/**
 * Chunk array for progressive rendering
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Image cache utility
 */
const imageCache = new Map<string, boolean>();

export function isImageCached(uri: string): boolean {
  return imageCache.get(uri) || false;
}

export function markImageAsCached(uri: string): void {
  imageCache.set(uri, true);
}

export function clearImageCache(): void {
  imageCache.clear();
}

/**
 * Format number for display (with memoization)
 */
const numberFormatCache = new Map<string, string>();

export function formatNumber(num: number, options?: Intl.NumberFormatOptions): string {
  const key = `${num}-${JSON.stringify(options)}`;
  if (numberFormatCache.has(key)) {
    return numberFormatCache.get(key)!;
  }

  const formatted = new Intl.NumberFormat('fr-FR', options).format(num);
  numberFormatCache.set(key, formatted);

  // Keep cache size under control
  if (numberFormatCache.size > 1000) {
    const firstKey = numberFormatCache.keys().next().value;
    if (firstKey) numberFormatCache.delete(firstKey);
  }

  return formatted;
}

/**
 * Format currency
 */
export function formatCurrency(amount: number): string {
  return formatNumber(amount, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

/**
 * Format date relative to now
 */
const dateFormatCache = new Map<string, string>();

export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  // Only cache for values older than 1 minute
  if (diff > 60000) {
    const key = `${Math.floor(timestamp / 60000)}`;
    if (dateFormatCache.has(key)) {
      return dateFormatCache.get(key)!;
    }
  }

  let result: string;

  if (diff < 60000) {
    result = "À l'instant";
  } else if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    result = `Il y a ${minutes} min`;
  } else if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    result = `Il y a ${hours}h`;
  } else if (diff < 604800000) {
    const days = Math.floor(diff / 86400000);
    result = `Il y a ${days}j`;
  } else {
    const date = new Date(timestamp);
    result = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }

  if (diff > 60000) {
    const key = `${Math.floor(timestamp / 60000)}`;
    dateFormatCache.set(key, result);

    // Keep cache size under control
    if (dateFormatCache.size > 500) {
      const firstKey = dateFormatCache.keys().next().value;
      if (firstKey) dateFormatCache.delete(firstKey);
    }
  }

  return result;
}
