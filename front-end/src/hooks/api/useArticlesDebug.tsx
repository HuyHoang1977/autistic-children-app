import { useState, useEffect } from 'react';

export interface CacheStatus {
  size: number;
  keys: string[];
  lastAccess?: Record<string, string>;
  hitRate?: number;
  missRate?: number;
}

export interface UseArticlesDebugReturn {
  cacheStatus: CacheStatus;
  apiCalls: {
    total: number;
    successful: number;
    failed: number;
    lastCall?: string;
  };
  performance: {
    averageResponseTime?: number;
    slowestCall?: number;
    fastestCall?: number;
  };
  clearCache: () => void;
  logCacheAccess: (key: string, hit: boolean) => void;
  recordApiCall: (responseTime: number, success?: boolean) => void;
  resetPerformance: () => void;
  cache: {
    get: (key: string) => any;
    set: (key: string, value: any) => void;
    has: (key: string) => boolean;
    delete: (key: string) => void;
  };
}

interface DebugInfo {
  cacheStatus: CacheStatus;
  apiCalls: {
    total: number;
    successful: number;
    failed: number;
    lastCall?: string;
  };
  performance: {
    averageResponseTime?: number;
    slowestCall?: number;
    fastestCall?: number;
  };
}

// Simple cache implementation for debugging
class DebugCache {
  private cache = new Map<string, any>();
  private accessTimes = new Map<string, number>();
  private hits = 0;
  private misses = 0;

  set(key: string, value: any): void {
    this.cache.set(key, value);
    this.accessTimes.set(key, Date.now());
  }

  get(key: string): any {
    if (this.cache.has(key)) {
      this.hits++;
      this.accessTimes.set(key, Date.now());
      return this.cache.get(key);
    }
    this.misses++;
    return undefined;
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  delete(key: string): void {
    this.cache.delete(key);
    this.accessTimes.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.accessTimes.clear();
    this.hits = 0;
    this.misses = 0;
  }

  getStatus(): CacheStatus {
    const lastAccess: Record<string, string> = {};
    this.accessTimes.forEach((time, key) => {
      lastAccess[key] = new Date(time).toLocaleTimeString();
    });

    const total = this.hits + this.misses;

    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      lastAccess,
      hitRate: total > 0 ? Number((this.hits / total * 100).toFixed(2)) : 0,
      missRate: total > 0 ? Number((this.misses / total * 100).toFixed(2)) : 0,
    };
  }
}

// Global debug cache instance
const debugCache = new DebugCache();

// Performance tracking
class PerformanceTracker {
  private calls: number[] = [];
  private apiCallCount = 0;
  private successCount = 0;
  private failureCount = 0;
  private lastCallTime?: string;

  recordCall(responseTime: number, success: boolean = true): void {
    this.calls.push(responseTime);
    this.apiCallCount++;
    this.lastCallTime = new Date().toLocaleTimeString();

    if (success) {
      this.successCount++;
    } else {
      this.failureCount++;
    }

    // Keep only last 100 calls
    if (this.calls.length > 100) {
      this.calls.shift();
    }
  }

  getStats() {
    const averageResponseTime = this.calls.length > 0
      ? Number((this.calls.reduce((a, b) => a + b, 0) / this.calls.length).toFixed(2))
      : 0;

    return {
      apiCalls: {
        total: this.apiCallCount,
        successful: this.successCount,
        failed: this.failureCount,
        lastCall: this.lastCallTime,
      },
      performance: {
        averageResponseTime,
        slowestCall: this.calls.length > 0 ? Math.max(...this.calls) : 0,
        fastestCall: this.calls.length > 0 ? Math.min(...this.calls) : 0,
      }
    };
  }

  reset(): void {
    this.calls = [];
    this.apiCallCount = 0;
    this.successCount = 0;
    this.failureCount = 0;
    this.lastCallTime = undefined;
  }
}

const performanceTracker = new PerformanceTracker();

/**
 * Debug hook for articles - provides cache status and performance metrics
 */
export const useArticlesDebug = (): UseArticlesDebugReturn => {
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    cacheStatus: debugCache.getStatus(),
    ...performanceTracker.getStats(),
  });

  // Update debug info periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setDebugInfo({
        cacheStatus: debugCache.getStatus(),
        ...performanceTracker.getStats(),
      });
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, []);

  // Debug utilities
  const clearCache = () => {
    debugCache.clear();
    setDebugInfo(prev => ({
      ...prev,
      cacheStatus: debugCache.getStatus(),
    }));
  };

  const resetPerformance = () => {
    performanceTracker.reset();
    setDebugInfo(prev => ({
      ...prev,
      ...performanceTracker.getStats(),
    }));
  };

  const logCacheAccess = (key: string, hit: boolean) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Articles Cache] ${hit ? 'HIT' : 'MISS'}: ${key}`);
    }
  };

  const recordApiCall = (responseTime: number, success: boolean = true) => {
    performanceTracker.recordCall(responseTime, success);
    setDebugInfo(prev => ({
      ...prev,
      ...performanceTracker.getStats(),
    }));
  };

  return {
    // Main debug info
    cacheStatus: debugInfo.cacheStatus,
    apiCalls: debugInfo.apiCalls,
    performance: debugInfo.performance,

    // Cache utilities
    clearCache,
    logCacheAccess,

    // Performance utilities
    recordApiCall,
    resetPerformance,

    // Direct cache access (for integration with useArticles)
    cache: {
      get: (key: string) => debugCache.get(key),
      set: (key: string, value: any) => debugCache.set(key, value),
      has: (key: string) => debugCache.has(key),
      delete: (key: string) => debugCache.delete(key),
    }
  };
};