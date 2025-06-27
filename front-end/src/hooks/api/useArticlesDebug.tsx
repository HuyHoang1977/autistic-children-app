// src/hooks/api/useArticlesDebug.ts - FIXED VERSION
import { useState, useEffect, useCallback } from 'react';
import { articleService } from '../../api/services/article.sevice';
import { authService } from '../../api/services/auth.service';

// ✅ Match your existing interface
export interface CacheStatus {
  size: number;
  keys: string[];
  lastAccess?: Record<string, string>;
  hitRate?: number;
  missRate?: number;
}

export interface ApiCallStats {
  total: number;
  successful: number;
  failed: number;
  lastCall?: string;
}

export interface PerformanceStats {
  averageResponseTime?: number;
  slowestCall?: number;
  fastestCall?: number;
}

export interface DebugInfo {
  authStatus: string;
  apiConnection: string;
  backendUrl: string;
  hasToken: boolean;
  tokenPreview?: string;
  lastError?: string;
  articlesCount: number;
}

export interface UseArticlesDebugReturn {
  cacheStatus: CacheStatus;
  apiCalls: ApiCallStats;
  performance: PerformanceStats;
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
  debugInfo: DebugInfo;
  runHealthCheck: () => Promise<void>;
}

// Enhanced debug cache
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

  getStats(): { apiCalls: ApiCallStats; performance: PerformanceStats } {
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

// Create singleton instances
const debugCache = new DebugCache();
const performanceTracker = new PerformanceTracker();

export const useArticlesDebug = (): UseArticlesDebugReturn => {
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    authStatus: 'checking',
    apiConnection: 'unknown',
    backendUrl: 'http://localhost:8000',
    hasToken: false,
    tokenPreview: undefined,
    lastError: undefined,
    articlesCount: 0
  });

  const [cacheStatus, setCacheStatus] = useState<CacheStatus>(debugCache.getStatus());
  const [stats, setStats] = useState(performanceTracker.getStats());

  // ✅ Enhanced health check with proper error handling
  const runHealthCheck = useCallback(async (): Promise<void> => {
    try {
      console.log('🔍 Running enhanced health check...');

      // 1. Check authentication
      const token = authService.getToken();
      const isAuth = authService.isAuthenticated();

      setDebugInfo(prev => ({
        ...prev,
        authStatus: isAuth ? 'authenticated' : 'not-authenticated',
        hasToken: !!token,
        tokenPreview: token ? `${token.substring(0, 20)}...` : undefined
      }));

      // 2. Test backend connection with timeout
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const backendHealthResponse = await fetch('http://localhost:8000/api/articles/health', {
          signal: controller.signal,
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        clearTimeout(timeoutId);
        const backendHealthy = backendHealthResponse.ok;

        setDebugInfo(prev => ({
          ...prev,
          apiConnection: backendHealthy ? 'connected' : 'failed',
          lastError: backendHealthy ? undefined : `Backend returned ${backendHealthResponse.status}`
        }));

        if (backendHealthy) {
          try {
            const healthData = await backendHealthResponse.json();
            console.log('✅ Backend health:', healthData);
          } catch (jsonError) {
            console.warn('Backend responded but could not parse JSON:', jsonError);
          }
        }
      } catch (backendError: any) {
        console.error('❌ Backend connection failed:', backendError);

        let errorMessage = 'Cannot connect to backend';
        if (backendError.name === 'AbortError') {
          errorMessage = 'Backend connection timeout';
        } else if (backendError.message) {
          errorMessage = backendError.message;
        }

        setDebugInfo(prev => ({
          ...prev,
          apiConnection: 'failed',
          lastError: errorMessage
        }));
      }

      // 3. Test articles API if authenticated
      if (isAuth && token) {
        try {
          const startTime = Date.now();
          const articlesResponse = await articleService.getArticles({ limit: 1, page: 1 });
          const responseTime = Date.now() - startTime;

          if (articlesResponse.success) {
            setDebugInfo(prev => ({
              ...prev,
              articlesCount: articlesResponse.pagination?.total || 0,
              lastError: undefined
            }));

            // Record successful API call
            performanceTracker.recordCall(responseTime, true);
            setStats(performanceTracker.getStats());

            console.log('✅ Articles API test successful');
          } else {
            throw new Error(articlesResponse.error || 'Articles API returned unsuccessful response');
          }
        } catch (apiError: any) {
          console.error('❌ Articles API test failed:', apiError);

          // Record failed API call
          performanceTracker.recordCall(0, false);
          setStats(performanceTracker.getStats());

          setDebugInfo(prev => ({
            ...prev,
            lastError: apiError.message || 'Articles API failed'
          }));
        }
      }

    } catch (error: any) {
      console.error('❌ Health check failed:', error);
      setDebugInfo(prev => ({
        ...prev,
        lastError: error.message || 'Health check failed'
      }));
    }
  }, []);

  // Update debug info periodically
  useEffect(() => {
    // Initial health check
    runHealthCheck();

    // Set up interval for periodic updates
    const interval = setInterval(() => {
      setCacheStatus(debugCache.getStatus());
      setStats(performanceTracker.getStats());
    }, 2000);

    return () => clearInterval(interval);
  }, [runHealthCheck]);

  // Debug utilities
  const clearCache = useCallback(() => {
    debugCache.clear();
    setCacheStatus(debugCache.getStatus());
    console.log('🧹 Debug cache cleared');
  }, []);

  const resetPerformance = useCallback(() => {
    performanceTracker.reset();
    setStats(performanceTracker.getStats());
    console.log('📊 Performance stats reset');
  }, []);

  const logCacheAccess = useCallback((key: string, hit: boolean) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Articles Cache] ${hit ? 'HIT' : 'MISS'}: ${key}`);
    }
  }, []);

  const recordApiCall = useCallback((responseTime: number, success: boolean = true) => {
    performanceTracker.recordCall(responseTime, success);
    setStats(performanceTracker.getStats());
  }, []);

  // Cache interface
  const cacheInterface = {
    get: (key: string) => {
      const result = debugCache.get(key);
      logCacheAccess(key, result !== undefined);
      return result;
    },
    set: (key: string, value: any) => {
      debugCache.set(key, value);
      setCacheStatus(debugCache.getStatus());
    },
    has: (key: string) => debugCache.has(key),
    delete: (key: string) => {
      debugCache.delete(key);
      setCacheStatus(debugCache.getStatus());
    }
  };

  return {
    // Cache info
    cacheStatus,
    apiCalls: stats.apiCalls,
    performance: stats.performance,

    // Enhanced debug info
    debugInfo,

    // Cache utilities
    clearCache,
    logCacheAccess,

    // Performance utilities
    recordApiCall,
    resetPerformance,

    // Health check
    runHealthCheck,

    // Direct cache access
    cache: cacheInterface
  };
};