import NodeCache from 'node-cache';
import { Request, Response, NextFunction } from 'express';

/**
 * إنشاء كائن التخزين المؤقت مع إعدادات مخصصة
 * - stdTTL: مدة بقاء القيم المخزنة (300 ثانية = 5 دقائق)
 * - checkperiod: الفترة التي يتم فيها التحقق من انتهاء صلاحية القيم (60 ثانية = دقيقة واحدة)
 * - useClones: false لتحسين الأداء (لا حاجة لنسخ عميق للقيم)
 * - deleteOnExpire: true لتحرير الذاكرة تلقائياً عند انتهاء صلاحية القيم
 */
export const apiCache = new NodeCache({
  stdTTL: 300,
  checkperiod: 60,
  useClones: false,
  deleteOnExpire: true,
});

/**
 * إعدادات التخزين المؤقت حسب نوع المورد
 * تخصيص فترات صلاحية مختلفة حسب نوع البيانات
 */
export const cacheTTL = {
  properties: 10 * 60, // 10 دقائق للعقارات
  propertyDetails: 15 * 60, // 15 دقيقة لتفاصيل العقار
  restaurants: 30 * 60, // 30 دقيقة للمطاعم
  featuredItems: 60 * 60, // ساعة للعناصر المميزة
  reviews: 20 * 60, // 20 دقيقة للمراجعات
  analytics: 15 * 60, // 15 دقيقة للتحليلات
  defaultTTL: 5 * 60 // 5 دقائق كإعداد افتراضي
};

/**
 * تحديد فترة صلاحية المورد بناءً على نوعه
 */
export const getCacheTTL = (path: string): number => {
  if (path.includes('/properties/featured')) return cacheTTL.featuredItems;
  if (path.includes('/restaurants/featured')) return cacheTTL.featuredItems;
  if (path.includes('/properties') && path.match(/\/properties\/\d+$/)) return cacheTTL.propertyDetails;
  if (path.includes('/restaurants') && path.match(/\/restaurants\/\d+$/)) return cacheTTL.propertyDetails;
  if (path.includes('/properties')) return cacheTTL.properties;
  if (path.includes('/restaurants')) return cacheTTL.restaurants;
  if (path.includes('/reviews')) return cacheTTL.reviews;
  if (path.includes('/analytics')) return cacheTTL.analytics;
  
  return cacheTTL.defaultTTL;
};

/**
 * إنشاء مفتاح للتخزين المؤقت بناءً على طريقة الطلب والمسار والمعاملات
 */
export const createCacheKey = (method: string, path: string, query: any): string => {
  // تحويل معاملات الاستعلام إلى سلسلة مرتبة
  const queryString = Object.keys(query || {})
    .sort()
    .map(key => `${key}=${query[key]}`)
    .join('&');
  
  // إنشاء مفتاح مخصص يجمع بين الطريقة والمسار والمعاملات
  return `${method}_${path}${queryString ? '_' + queryString : ''}`;
};

/**
 * وسيط (middleware) للتخزين المؤقت في API
 * يتحقق من وجود البيانات في الكاش قبل تنفيذ الطلب
 * ويخزن النتائج تلقائياً بعد تنفيذ الطلب الفعلي
 */
export const apiCacheMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // تجاهل طلبات غير القراءة (POST, PUT, DELETE)
  if (req.method !== 'GET') {
    return next();
  }
  
  // تجاهل طلبات المصادقة وبعض المسارات الخاصة
  if (req.path === '/api/me' || req.path.includes('/api/auth') || req.path.includes('webhook')) {
    return next();
  }
  
  const cacheKey = createCacheKey(req.method, req.path, req.query);
  const cachedData = apiCache.get(cacheKey);
  
  // إذا وجد البيانات في الكاش، إرجاعها مباشرة
  if (cachedData) {
    console.log(`[cache] Using cached data for ${req.path}`);
    return res.json(cachedData);
  }
  
  // حفظ الدالة الأصلية res.json
  const originalJson = res.json;
  
  // استبدال res.json لاعتراض البيانات وتخزينها في الكاش
  res.json = function(data) {
    // تخزين البيانات في الكاش إذا كانت الاستجابة ناجحة
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const ttl = getCacheTTL(req.path);
      
      // تخزين في الكاش مع الفترة المناسبة
      apiCache.set(cacheKey, data, ttl);
      
      if (req.path.includes('/properties/featured')) {
        console.log(`[cache] Caching featured properties data for ${ttl/60} minutes`);
      }
      
      if (req.path.includes('/properties') && !req.path.includes('/featured')) {
        // استخراج معاملات limit و offset من الاستعلام
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
        const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
        
        console.log(`[cache] Caching properties data for properties_${limit}_${offset}`);
      }
    }
    
    // استدعاء الدالة الأصلية بالبيانات
    return originalJson.call(this, data);
  };
  
  next();
};

/**
 * حذف مفتاح محدد من الكاش
 */
export const invalidateCache = (pattern: string): void => {
  // الحصول على جميع المفاتيح في الكاش
  const keys = apiCache.keys();
  
  // حذف المفاتيح التي تتطابق مع النمط
  keys.forEach(key => {
    if (key.includes(pattern)) {
      apiCache.del(key);
    }
  });
  
  console.log(`[cache] Invalidated cache for pattern: ${pattern}`);
};

/**
 * تنظيف الكاش بالكامل
 */
export const clearAllCache = (): void => {
  apiCache.flushAll();
  console.log('[cache] Cleared all cache');
};

/**
 * الحصول على إحصاءات الكاش
 */
export const getCacheStats = (): Record<string, any> => {
  const stats = apiCache.getStats();
  const keys = apiCache.keys();
  
  return {
    hits: stats.hits,
    misses: stats.misses,
    keys: stats.keys,
    ksize: stats.ksize,
    vsize: stats.vsize,
    keyList: keys
  };
};

export default apiCache;