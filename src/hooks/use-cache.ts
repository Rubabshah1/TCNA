import { useCallback } from "react";

// Cache duration: 1 day in milliseconds
const CACHE_DURATION = 24 * 60 * 60 * 1000;

// Interface for cached data with expiration
interface CachedData<T> {
  data: T;
  expiresAt: number;
}

// Generate a cache key based on parameters
const generateCacheKey = (params: Record<string, any>): string => {
  return JSON.stringify(params);
};

// Reusable cache hook
export const useCache = <T>() => {
  const getCachedData = useCallback((key: string): T | null => {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;

      const { data, expiresAt }: CachedData<T> = JSON.parse(cached);
      if (Date.now() > expiresAt) {
        localStorage.removeItem(key); // Remove expired cache
        return null;
      }
      return data;
    } catch (error) {
      console.error("Error reading cache:", error);
      return null;
    }
  }, []);

  const setCachedData = useCallback((key: string, data: T) => {
    try {
      const cachedData: CachedData<T> = {
        data,
        expiresAt: Date.now() + CACHE_DURATION,
      };
      localStorage.setItem(key, JSON.stringify(cachedData));
    } catch (error) {
      console.error("Error writing to cache:", error);
    }
  }, []);

  return { getCachedData, setCachedData, generateCacheKey };
};