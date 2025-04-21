import { QueryClient, QueryFunction, DefaultOptions } from "@tanstack/react-query";
import React from "react";
import { getFirebaseIdToken } from "./firebase";
import { NetworkErrorType } from "@/components/ui/network-error-feedback";

/**
 * المفاتيح المستخدمة للتخزين المؤقت في localStorage
 */
const STORAGE_KEYS = {
  AUTH_USER: 'staychill_auth_user',
  FEATURED_PROPERTIES: 'staychill_featured_properties',
  FEATURED_RESTAURANTS: 'staychill_featured_restaurants',
  LAST_FETCH: 'staychill_last_fetch_',
  SESSION_TOKEN: 'staychill_session_token',
};

/**
 * Mapping of resource types to their cache times in milliseconds
 * Different resources have different caching needs based on update frequency
 */
const CACHE_TIMES = {
  properties: 30 * 60 * 1000, // 30 minutes (increased from 10)
  propertyDetails: 45 * 60 * 1000, // 45 minutes (increased from 15)
  restaurants: 60 * 60 * 1000, // 60 minutes (increased from 30)
  restaurantDetails: 60 * 60 * 1000, // 60 minutes (increased from 30)
  featuredItems: 120 * 60 * 1000, // 2 hours (increased from 1)
  reviews: 45 * 60 * 1000, // 45 minutes (increased from 20)
  userProfile: 6 * 60 * 60 * 1000, // 6 hours (dramatically increased - auth info doesn't change often)
  userAuth: 24 * 60 * 60 * 1000, // 24 hours (auth status needs very long cache)
  userBookings: 5 * 60 * 1000, // 5 minutes (increased from 2)
  userReservations: 5 * 60 * 1000, // 5 minutes (increased from 2)
  analytics: 30 * 60 * 1000, // 30 minutes (increased from 15)
  default: 15 * 60 * 1000, // 15 minutes (increased from 5)
};

/**
 * Helper to determine appropriate stale time based on the queryKey
 */
const getStaleTime = (queryKey: unknown[]): number => {
  const key = queryKey[0] as string;

  if (typeof key !== 'string') return CACHE_TIMES.default;

  if (key.includes('/properties/featured')) return CACHE_TIMES.featuredItems;
  if (key.includes('/restaurants/featured')) return CACHE_TIMES.featuredItems;
  if (key.includes('/properties') && queryKey.length > 1) return CACHE_TIMES.propertyDetails;
  if (key.includes('/restaurants') && queryKey.length > 1) return CACHE_TIMES.restaurantDetails;
  if (key.includes('/properties')) return CACHE_TIMES.properties;
  if (key.includes('/restaurants')) return CACHE_TIMES.restaurants;
  if (key.includes('/reviews')) return CACHE_TIMES.reviews;
  if (key.includes('/me') || key.includes('/user-profile')) return CACHE_TIMES.userProfile;
  if (key.includes('/bookings') || key.includes('/my-bookings')) return CACHE_TIMES.userBookings;
  if (key.includes('/reservations') || key.includes('/my-reservations')) return CACHE_TIMES.userReservations;
  if (key.includes('/analytics')) return CACHE_TIMES.analytics;

  return CACHE_TIMES.default;
};

/**
 * Error handler for failed requests
 * Uses Response.clone() to avoid "body stream already read" errors
 */
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      // Clone the response to avoid "body stream already read" errors
      const resClone = res.clone();

      try {
        // Try to parse as JSON first for structured error messages
        const data = await resClone.json();
        throw new Error(data.message || data.error || `${res.status}: ${res.statusText}`);
      } catch (parseError) {
        // If JSON parsing fails, fall back to text
        const text = await res.clone().text() || res.statusText;
        throw new Error(`${res.status}: ${text}`);
      }
    } catch (e) {
      // Fallback if cloning fails for any reason
      throw new Error(`${res.status}: ${res.statusText}`);
    }
  }
}

/**
 * Placeholder for CSRF token functionality (to be implemented later)
 */
export async function getCsrfToken(): Promise<string | null> {
  // CSRF validation disabled temporarily
  return null;
}

/**
 * Enhanced API request function with retry logic and performance tracking
 * Includes Firebase ID token for authentication and CSRF token
 */
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  retries = 3
): Promise<Response> {
  const startTime = performance.now();

  try {
    // Get Firebase ID token for authorization
    const firebaseToken = await getFirebaseIdToken();
    
    // Get CSRF token for non-GET requests
    let csrfToken = null;
    if (method.toUpperCase() !== 'GET') {
      csrfToken = await getCsrfToken();
    }

    const headers: Record<string, string> = {
      ...(data ? { "Content-Type": "application/json" } : {}),
      "X-Requested-With": "XMLHttpRequest",
    };

    // Add Authorization header if token exists
    if (firebaseToken) {
      headers["Authorization"] = `Bearer ${firebaseToken}`;
    }
    
    // Add CSRF token if available
    if (csrfToken) {
      headers["X-CSRF-Token"] = csrfToken;
    }

    const res = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
      // Improve cache control for GET requests
      cache: method.toUpperCase() === "GET" ? "default" : "no-store"
    });

    // Performance monitoring for slow requests (>500ms) - only in development
    const duration = performance.now() - startTime;
    if (duration > 500 && import.meta.env.DEV) {
      console.warn(`Slow request (${duration.toFixed(0)}ms): ${method} ${url}`);
    }

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    if (retries > 0) {
      // Exponential backoff
      const delay = Math.min(1000 * 2 ** (3 - retries), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
      return apiRequest(method, url, data, retries - 1);
    }
    // Only log critical errors in development
    if (import.meta.env.DEV) {
      console.error(`Failed request to ${url} after multiple retries`, error);
    }
    throw error;
  }
}

/**
 * أدوات التخزين المؤقت المحلي للبيانات
 */
export const localCache = {
  /**
   * تخزين البيانات في localStorage مع وقت انتهاء الصلاحية
   * @param key مفتاح التخزين
   * @param data البيانات المراد تخزينها
   * @param expirationMs مدة الصلاحية بالميلي ثانية
   */
  set: (key: string, data: any, expirationMs: number = CACHE_TIMES.default) => {
    if (typeof window === 'undefined') return;
    
    try {
      const item = {
        data,
        expiry: Date.now() + expirationMs,
      };
      localStorage.setItem(key, JSON.stringify(item));
      localStorage.setItem(`${STORAGE_KEYS.LAST_FETCH}${key}`, Date.now().toString());
    } catch (error) {
      console.warn('Error caching data in localStorage:', error);
    }
  },
  
  /**
   * استرجاع البيانات من localStorage مع التحقق من الصلاحية
   * @param key مفتاح التخزين
   * @returns البيانات المخزنة أو null في حالة عدم وجودها أو انتهاء صلاحيتها
   */
  get: <T>(key: string): T | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const itemStr = localStorage.getItem(key);
      if (!itemStr) return null;
      
      const item = JSON.parse(itemStr);
      if (!item.expiry || Date.now() > item.expiry) {
        localStorage.removeItem(key);
        return null;
      }
      
      return item.data;
    } catch (error) {
      console.warn('Error retrieving cached data:', error);
      return null;
    }
  },
  
  /**
   * التحقق مما إذا كانت البيانات المخزنة لا تزال صالحة وحديثة
   * @param key مفتاح التخزين
   * @param maxAgeMs العمر الأقصى للبيانات بالميلي ثانية
   * @returns true إذا كانت البيانات حديثة وصالحة
   */
  isFresh: (key: string, maxAgeMs: number = CACHE_TIMES.default): boolean => {
    if (typeof window === 'undefined') return false;
    
    try {
      const fetchTime = localStorage.getItem(`${STORAGE_KEYS.LAST_FETCH}${key}`);
      if (!fetchTime) return false;
      
      const timeSinceFetch = Date.now() - parseInt(fetchTime, 10);
      return timeSinceFetch < maxAgeMs;
    } catch (error) {
      return false;
    }
  },
  
  /**
   * حذف البيانات المخزنة
   * @param key مفتاح التخزين
   */
  remove: (key: string) => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(key);
      localStorage.removeItem(`${STORAGE_KEYS.LAST_FETCH}${key}`);
    } catch (error) {
      console.warn('Error removing cached data:', error);
    }
  },
  
  /**
   * مسح جميع البيانات المخزنة ذات الصلة بالتطبيق
   */
  clearAll: () => {
    if (typeof window === 'undefined') return;
    
    try {
      const keysToRemove = Object.values(STORAGE_KEYS);
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && keysToRemove.some(storeKey => key.includes(storeKey))) {
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.warn('Error clearing cached data:', error);
    }
  }
};

/**
 * مزامنة حالة المصادقة بين علامات التبويب المختلفة
 */
export const authSyncManager = {
  /**
   * التسجيل للاستماع إلى تغييرات المصادقة في علامات التبويب الأخرى
   * @param callback دالة يتم استدعاؤها عند تغيير حالة المصادقة
   * @returns دالة لإلغاء التسجيل
   */
  registerListener: (callback: () => void) => {
    if (typeof window === 'undefined') return () => {};
    
    const listener = (event: StorageEvent) => {
      if (
        event.key === STORAGE_KEYS.AUTH_USER || 
        event.key === STORAGE_KEYS.SESSION_TOKEN
      ) {
        callback();
      }
    };
    
    window.addEventListener('storage', listener);
    return () => window.removeEventListener('storage', listener);
  },
  
  /**
   * تنبيه علامات التبويب الأخرى بتغيير حالة المصادقة
   * @param isLoggedIn حالة المصادقة الجديدة
   */
  notifyAuthChange: (isLoggedIn: boolean) => {
    if (typeof window === 'undefined') return;
    
    const timestamp = Date.now().toString();
    if (isLoggedIn) {
      localStorage.setItem(STORAGE_KEYS.SESSION_TOKEN, timestamp);
    } else {
      localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
      localStorage.removeItem(STORAGE_KEYS.SESSION_TOKEN);
    }
  }
};

/**
 * Create a cache key for a resource
 * This makes cache invalidation more predictable
 */
export const createCacheKey = (baseKey: string, id?: number | string) => {
  if (id !== undefined) {
    return [baseKey, id.toString()];
  }
  return [baseKey];
};

type UnauthorizedBehavior = "returnNull" | "throw";

// طريقة مبسطة للتحقق من المخزن المؤقت
const checkCache = (url: string, queryKey: unknown[]): any => {
  // يتحقق من التخزين المؤقت لبيانات المستخدم
  if (url.includes('/api/me')) {
    const cachedUser = localCache.get(STORAGE_KEYS.AUTH_USER);
    if (cachedUser) {
      if (import.meta.env.DEV) console.log('Using cached auth data from localStorage');
      return cachedUser;
    }
    if (import.meta.env.DEV) console.log('No cached auth data, making API call to /api/me');
    return null;
  }
  
  // يتحقق من التخزين المؤقت للعقارات المميزة
  if (url.includes('/api/properties/featured')) {
    const cachedData = localCache.get(STORAGE_KEYS.FEATURED_PROPERTIES);
    if (cachedData && localCache.isFresh(STORAGE_KEYS.FEATURED_PROPERTIES, CACHE_TIMES.featuredItems)) {
      if (import.meta.env.DEV) console.log('Using cached featured properties from localStorage');
      return cachedData;
    }
    return null;
  }
  
  // يتحقق من التخزين المؤقت للمطاعم المميزة
  if (url.includes('/api/restaurants/featured')) {
    const cachedData = localCache.get(STORAGE_KEYS.FEATURED_RESTAURANTS);
    if (cachedData && localCache.isFresh(STORAGE_KEYS.FEATURED_RESTAURANTS, CACHE_TIMES.featuredItems)) {
      if (import.meta.env.DEV) console.log('Using cached featured restaurants from localStorage');
      return cachedData;
    }
    return null;
  }
  
  // للبيانات العامة الأخرى
  const cacheKey = typeof queryKey === 'string' ? queryKey : JSON.stringify(queryKey);
  const cachedData = localCache.get(`cache_${cacheKey}`);
  const staleDuration = getStaleTime(Array.isArray(queryKey) ? queryKey : [queryKey]);
  
  if (cachedData && localCache.isFresh(`cache_${cacheKey}`, staleDuration)) {
    if (import.meta.env.DEV) console.log(`Using cached data for ${url} from localStorage`);
    return cachedData;
  }
  
  return null;
};

// يقوم بتخزين البيانات في الكاش بناءً على نوعها
const cacheData = (url: string, data: any, queryKey: unknown[]): void => {
  if (!data) return;
  
  if (url.includes('/api/me')) {
    localCache.set(STORAGE_KEYS.AUTH_USER, data, CACHE_TIMES.userProfile);
  } else if (url.includes('/api/properties/featured')) {
    localCache.set(STORAGE_KEYS.FEATURED_PROPERTIES, data, CACHE_TIMES.featuredItems);
  } else if (url.includes('/api/restaurants/featured')) {
    localCache.set(STORAGE_KEYS.FEATURED_RESTAURANTS, data, CACHE_TIMES.featuredItems);
  } else {
    // تخزين أي نوع آخر من البيانات
    const cacheKey = typeof queryKey === 'string' ? queryKey : JSON.stringify(queryKey);
    const staleDuration = getStaleTime(Array.isArray(queryKey) ? queryKey : [queryKey]);
    localCache.set(`cache_${cacheKey}`, data, staleDuration);
  }
};

/**
 * Enhanced query function with advanced retry and performance tracking
 */
/**
 * تحديد نوع خطأ الشبكة بناءً على الاستجابة أو الخطأ
 */
const determineNetworkErrorType = (error: any, status?: number): NetworkErrorType => {
  if (status === 401 || status === 403) {
    return 'unauthorized';
  }
  
  if (status && status >= 500) {
    return 'server';
  }
  
  if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
    return 'connection';
  }
  
  if (error && error.name === 'AbortError') {
    return 'timeout';
  }
  
  return 'request';
};

/**
 * نظام معالجة الأخطاء المعيارية - يقوم بتصنيف ومعالجة أنواع مختلفة من الأخطاء
 */
export const errorHandler = (error: any): { type: NetworkErrorType; message: string } => {
  // تحديد نوع الخطأ ورسالته
  let errorType: NetworkErrorType = 'request';
  let errorMessage = 'حدث خطأ غير متوقع';
  
  // التحقق من كود الخطأ المعياري إذا كان متاحًا
  if (error && typeof error.code === 'string') {
    const errorCodeMap: Record<string, { type: NetworkErrorType; message: string }> = {
      'NETWORK_FAILURE': { type: 'connection', message: 'تعذر الاتصال بالخادم، يرجى التحقق من اتصالك بالإنترنت' },
      'SERVER_ERROR': { type: 'server', message: 'حدث خطأ في الخادم، يرجى المحاولة لاحقًا' },
      'REQUEST_TIMEOUT': { type: 'timeout', message: 'استغرق الطلب وقتًا طويلاً، يرجى المحاولة مرة أخرى' },
      'AUTH_DENIED': { type: 'unauthorized', message: 'تم رفض الوصول، يرجى تسجيل الدخول مرة أخرى' },
      'AUTH_EXPIRED': { type: 'unauthorized', message: 'انتهت صلاحية جلستك، يرجى تسجيل الدخول مرة أخرى' },
      'INVALID_REQUEST': { type: 'request', message: 'طلب غير صالح، يرجى التحقق من المعلومات المدخلة' },
      'RESOURCE_NOT_FOUND': { type: 'request', message: 'لم يتم العثور على المورد المطلوب' },
      'PERMISSION_DENIED': { type: 'unauthorized', message: 'ليس لديك صلاحية للوصول إلى هذا المورد' },
    };
    
    // إذا كان كود الخطأ معروفًا، استخدم الرسالة المعرفة مسبقًا
    if (error.code in errorCodeMap) {
      const mappedError = errorCodeMap[error.code];
      errorType = mappedError.type;
      errorMessage = mappedError.message;
    }
  } else if (error && error.response) {
    // التعامل مع أخطاء الاستجابة من الخادم
    const status = error.response.status;
    
    if (status === 401 || status === 403) {
      errorType = 'unauthorized';
      errorMessage = 'غير مصرح بالوصول';
    } else if (status >= 500) {
      errorType = 'server';
      errorMessage = 'حدث خطأ في الخادم';
    } else if (status === 404) {
      errorType = 'request';
      errorMessage = 'لم يتم العثور على المورد المطلوب';
    } else if (status === 408 || status === 504) {
      errorType = 'timeout';
      errorMessage = 'انتهت مهلة الطلب';
    }
    
    // استخدم رسالة الخطأ من الاستجابة إذا كانت متاحة
    if (error.response.data && error.response.data.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
  } else if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
    errorType = 'connection';
    errorMessage = 'تعذر الاتصال بالخادم، يرجى التحقق من اتصالك بالإنترنت';
  } else if (error && error.name === 'AbortError') {
    errorType = 'timeout';
    errorMessage = 'تم إلغاء الطلب بسبب انتهاء المهلة';
  } else if (error && error.message) {
    // استخدم رسالة الخطأ كما هي إذا كانت متاحة
    errorMessage = error.message;
  }
  
  return { type: errorType, message: errorMessage };
};

/**
 * استدعاء مكون إدارة أخطاء الشبكة إذا كان متاحًا
 */
const showNetworkError = (type: NetworkErrorType, message?: string, retryFn?: () => void) => {
  // التحقق مما إذا كان نظام الإبلاغ عن أخطاء الشبكة متاحًا
  if (typeof window !== 'undefined') {
    const errorContext = (window as any).__networkErrorContext;
    if (errorContext && typeof errorContext.showError === 'function') {
      errorContext.showError(type, message);
      if (retryFn && typeof errorContext.setRetryCallback === 'function') {
        errorContext.setRetryCallback(retryFn);
      }
    }
  }
};

export const getQueryFn = (options: { on401: UnauthorizedBehavior } = { on401: "throw" }): QueryFunction => {
  const { on401: unauthorizedBehavior } = options;
  
  return async ({ queryKey }) => {
    const startTime = performance.now();
    const url = Array.isArray(queryKey) ? queryKey[0] as string : queryKey as string;
    
    // إضافة طابع زمني للتغلب على التخزين المؤقت للمتصفح
    const finalUrl = `${url}${url.includes("?") ? "&" : "?"}cache=${Date.now()}`;
    const requestId = Math.random().toString(36).substring(2, 9);
    let attempts = 0;
    const maxAttempts = 3;
    
    // التحقق من التخزين المؤقت أولاً
    const cachedData = checkCache(url, queryKey);
    if (cachedData) {
      return cachedData;
    }
    
    // دالة إعادة المحاولة - سيتم استخدامها بواسطة نظام إدارة أخطاء الشبكة
    const retry = async (): Promise<any> => {
      attempts = 0; // إعادة ضبط عدد المحاولات
      // استخدام invalidateQueries بدلاً من إعادة استدعاء الدالة مباشرة
      return queryClient.invalidateQueries({ queryKey });
    };
    
    while (attempts < maxAttempts) {
      attempts++;
      
      try {
        // إعداد مهلة زمنية للتحكم في وقت الاستجابة
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 ثوانٍ
        
        // الحصول على رمز المصادقة
        const idToken = await getFirebaseIdToken();
        
        const headers: Record<string, string> = {
          "X-Request-ID": requestId,
          "X-Requested-With": "XMLHttpRequest",
          "Cache-Control": url.includes('/static/') ? 'max-age=31536000' : 'max-age=300'
        };
        
        if (idToken) {
          headers["Authorization"] = `Bearer ${idToken}`;
        }
        
        // استخدام استراتيجية تخزين مؤقت محسنة
        const cacheStrategy = url.includes('/assets/') || url.includes('/static/') 
          ? 'force-cache' 
          : url.includes('/analytics') || url.includes('/bookings')
            ? 'no-store'
            : 'default';
        
        const res = await fetch(finalUrl, {
          credentials: "include",
          headers,
          cache: cacheStrategy,
          signal: controller.signal
        });
        
        // حالة خاصة: عدم المصادقة
        if (res.status === 401) {
          if (unauthorizedBehavior === "returnNull") {
            return null;
          }
          
          // إظهار رسالة خطأ عدم المصادقة
          if (attempts === maxAttempts) {
            showNetworkError('unauthorized', 'يرجى تسجيل الدخول للوصول إلى هذا المحتوى.', retry);
          }
          throw new Error('غير مصرح');
        }
        
        // قياس الأداء
        const duration = performance.now() - startTime;
        if (duration > 500 && import.meta.env.DEV) {
          console.warn(`Slow query (${duration.toFixed(0)}ms): ${url}`);
        }
        
        if (!res.ok) {
          await throwIfResNotOk(res);
        }
        
        // استخراج البيانات
        const data = await res.json();
        
        // تخزين البيانات في مخزن محلي
        cacheData(url, data, queryKey);
        
        return data;
      } catch (error: any) {
        // إذا هذه هي المحاولة الأخيرة، عرض خطأ الشبكة
        if (attempts === maxAttempts) {
          const errorType = determineNetworkErrorType(error, error.status);
          let errorMessage = error?.message || 'حدث خطأ أثناء الاتصال بالخادم.';
          
          // تسجيل الخطأ في وحدة التحكم في وضع التطوير
          if (import.meta.env.DEV) {
            console.error(`Error fetching ${url}:`, error);
          }
          
          // إظهار رسالة الخطأ والسماح بإعادة المحاولة
          showNetworkError(errorType, errorMessage, retry);
          
          // تقصير رسائل الخطأ الطويلة عند إعادتها من الدالة
          if (errorMessage && errorMessage.length > 100) {
            errorMessage = errorMessage.substring(0, 100) + '...';
          }
          
          return null;
        }
        
        // انتظار قبل إعادة المحاولة (تأخير تصاعدي)
        const backoffDelay = Math.min(1000 * Math.pow(2, attempts - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
        
        // استمرار في الحلقة لإعادة المحاولة
        continue;
      }
    }
    
    // هذا لن يحدث أبدًا بسبب تصميم الحلقة، ولكن TypeScript يحتاج إلى قيمة إرجاع واضحة
    return null;
  };
};

/**
 * Configure default query client options with optimized caching
 */
const defaultOptions: DefaultOptions = {
  queries: {
    queryFn: getQueryFn({ on401: "throw" }),
    refetchInterval: false,
    // Reduce refetching on window focus to prevent redundant API calls
    refetchOnWindowFocus: false,
    // Dynamic stale time will be set in the queryClient.setQueryDefaults below
    staleTime: CACHE_TIMES.default,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000)
  },
  mutations: {
    retry: 2,
    retryDelay: 1000,
  },
};

export const queryClient = new QueryClient({
  defaultOptions,
});

// Set up resource-specific defaults for optimal caching
[
  '/api/properties',
  '/api/properties/featured',
  '/api/restaurants',
  '/api/restaurants/featured',
  '/api/reviews',
  '/api/bookings',
  '/api/restaurant-reservations',
  '/api/analytics'
].forEach(queryKey => {
  queryClient.setQueryDefaults([queryKey], {
    staleTime: getStaleTime([queryKey]),
  });
});

// Special handling for user session data to prevent excessive API calls
queryClient.setQueryDefaults(['/api/me'], {
  staleTime: 30 * 60 * 1000, // 30 minutes - much longer stale time for user data
  gcTime: 24 * 60 * 60 * 1000, // 24 hours - keep in garbage collection for a day
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  refetchOnMount: false,
  retry: false, // Don't retry failed authentication requests 
});

// تنفيذ التحديث في الكاش عند تسجيل الدخول/الخروج
export const handleUserLogin = (userData: any) => {
  if (!userData) return;
  
  // حفظ بيانات المستخدم في التخزين المؤقت المحلي
  localCache.set(STORAGE_KEYS.AUTH_USER, userData, CACHE_TIMES.userProfile);
  
  // إعلام علامات التبويب الأخرى بتغيير حالة المصادقة
  authSyncManager.notifyAuthChange(true);
  
  // تحديث بيانات المستخدم في queryClient
  queryClient.setQueryData(['/api/me'], userData);
};

export const handleUserLogout = () => {
  // إزالة بيانات المستخدم من التخزين المؤقت المحلي
  localCache.remove(STORAGE_KEYS.AUTH_USER);
  
  // إعلام علامات التبويب الأخرى بتغيير حالة المصادقة
  authSyncManager.notifyAuthChange(false);
  
  // تحديث بيانات المستخدم في queryClient
  queryClient.setQueryData(['/api/me'], null);
  
  // حذف جميع الطلبات المتعلقة بالمستخدم المحدد من الكاش
  queryClient.invalidateQueries({ 
    predicate: (query) => {
      const queryKey = query.queryKey[0];
      return typeof queryKey === 'string' && (
        queryKey.includes('/api/me') || 
        queryKey.includes('/api/user-profile') ||
        queryKey.includes('/api/my-bookings') ||
        queryKey.includes('/api/my-reservations')
      );
    } 
  });
};