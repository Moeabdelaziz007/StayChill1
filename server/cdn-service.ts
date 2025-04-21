import { Request, Response, NextFunction } from 'express';
import { fileURLToPath } from "url";
import path from 'path';

// تحديد المسار الحالي للملف
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * إعدادات CDN
 * يمكن تعديل هذه الإعدادات لتتوافق مع مزود CDN المستخدم
 */
const CDN_CONFIG = {
  // الخادم المستضيف لـ CDN (Cloudflare أو غيره)
  host: process.env.CDN_HOST || '',
  
  // المسارات التي سيتم تقديمها عبر CDN
  paths: ['/static/', '/assets/', '/uploads/'],
  
  // أنواع الملفات التي سيتم تقديمها عبر CDN
  extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.css', '.js', '.woff', '.woff2', '.ttf'],
  
  // هل تم تفعيل CDN؟
  enabled: !!process.env.CDN_ENABLED,
  
  // مدة التخزين المؤقت بالثواني (30 يومًا)
  maxAge: 2592000
};

/**
 * وظيفة مساعدة لتحديد ما إذا كان المسار يجب تقديمه عبر CDN
 */
export const shouldServeThroughCDN = (path: string): boolean => {
  if (!CDN_CONFIG.enabled || !CDN_CONFIG.host) return false;
  
  // التحقق من المسار
  const matchesPath = CDN_CONFIG.paths.some(prefix => path.startsWith(prefix));
  if (!matchesPath) return false;
  
  // التحقق من امتداد الملف
  const extension = path.substring(path.lastIndexOf('.')).toLowerCase();
  const matchesExtension = CDN_CONFIG.extensions.includes(extension);
  
  return matchesExtension;
};

/**
 * وظيفة لتحويل URL محلي إلى URL يستخدم CDN
 */
export const transformToCDNUrl = (localUrl: string): string => {
  if (!shouldServeThroughCDN(localUrl)) return localUrl;
  
  // إزالة "/" من بداية المسار إذا كان موجودًا
  const pathWithoutLeadingSlash = localUrl.startsWith('/') ? localUrl.substring(1) : localUrl;
  
  // بناء URL الجديد باستخدام استضافة CDN
  return `${CDN_CONFIG.host}/${pathWithoutLeadingSlash}`;
};

/**
 * وظيفة لإضافة رؤوس HTTP مناسبة للملفات المقدمة عبر CDN
 */
export const addCDNHeaders = (res: Response): void => {
  // تعيين رؤوس التخزين المؤقت
  res.setHeader('Cache-Control', `public, max-age=${CDN_CONFIG.maxAge}, immutable`);
  res.setHeader('Vary', 'Accept-Encoding, Accept');
};

/**
 * Middleware لتحويل الروابط المحلية إلى روابط CDN في استجابة HTML
 * ملاحظة: هذا مثال بسيط للتوضيح، في التطبيقات الواقعية نستخدم أساليب أكثر تعقيدًا وكفاءة
 */
export const cdnMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // لا داعي لتحويل API أو المسارات الخاصة
  if (req.path.startsWith('/api/') || !CDN_CONFIG.enabled) {
    return next();
  }
  
  // الحفاظ على دالة `res.sendFile` الأصلية
  const originalSendFile = res.sendFile;
  
  // تعديل دالة `res.sendFile` للتعامل مع CDN
  res.sendFile = function(path: string, options?: any, callback?: any) {
    // إذا كان الملف يجب أن يُقدم عبر CDN
    if (shouldServeThroughCDN(path)) {
      // إضافة رؤوس CDN
      addCDNHeaders(res);
      
      // تحويل المسار إذا لزم الأمر (في حالة التطبيق الفعلي)
      // في هذا المثال، نستمر بإرسال الملف المحلي كالمعتاد
    }
    
    // استدعاء الدالة الأصلية
    return originalSendFile.call(this, path, options, callback);
  };
  
  next();
};

/**
 * Middleware للتحقق من تخزين CDN المؤقت للصور الثابتة
 * بدلًا من تحميل الصور المحلية، يتم إعادة توجيه الطلب إلى CDN
 */
export const cdnCacheMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // التحقق مما إذا كان المسار يجب تقديمه عبر CDN
  if (CDN_CONFIG.enabled && shouldServeThroughCDN(req.path)) {
    // تحويل URL المحلي إلى URL يستخدم CDN
    const cdnUrl = transformToCDNUrl(req.path);
    
    // إعادة توجيه الطلب إلى CDN
    return res.redirect(cdnUrl);
  }
  
  // إذا لم يكن هناك حاجة لاستخدام CDN، استمر كالمعتاد
  next();
};

/**
 * وظيفة لتوليد HTML عملية بالنسبة للصفحة للاستفادة من CDN
 * تستخدم هذه الوظيفة في التطبيقات التي تستخدم SSR
 */
export const generateCDNHints = (): string => {
  if (!CDN_CONFIG.enabled) return '';
  
  // إضافة preconnect hints لتحسين الأداء
  return `
    <link rel="preconnect" href="${CDN_CONFIG.host}" crossorigin>
    <link rel="dns-prefetch" href="${CDN_CONFIG.host}">
  `;
};

/**
 * يمكن استخدام هذه الوظيفة في كود العميل لتحويل المسارات
 */
export const getAssetUrl = (localPath: string): string => {
  // التحقق من تشغيل CDN وما إذا كان المسار يدعم CDN
  if (CDN_CONFIG.enabled && shouldServeThroughCDN(localPath)) {
    return transformToCDNUrl(localPath);
  }
  
  // إرجاع المسار المحلي إذا لم يكن CDN متاحًا
  return localPath;
};