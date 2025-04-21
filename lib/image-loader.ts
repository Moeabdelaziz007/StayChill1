/**
 * وحدة تحميل الصور
 * تستخدم للتعامل مع تحميل الصور المحسنة بدعم من CDN
 */

// المسارات الممكنة لتحميل الصور
export const IMAGE_PATHS = {
  // المسار الأساسي للأصول الثابتة
  ASSETS: '/assets/images/',
  
  // مسار الصور المحملة من المستخدم
  UPLOADS: '/uploads/images/',
  
  // مسار الصور النظام الأساسي
  SYSTEM: '/static/images/',
};

// الخيارات الافتراضية لتحميل الصور
export const DEFAULT_IMAGE_OPTIONS = {
  // الجودة الافتراضية للصور (1-100)
  quality: 80,
  
  // استخدام تنسيق WebP إذا كان مدعومًا
  useWebP: true,
  
  // الحد الأقصى للعرض للصور الكبيرة
  maxWidth: 1200,
  
  // الحد الأقصى للارتفاع للصور الكبيرة
  maxHeight: 1200,
  
  // هل تستخدم CDN لتقديم الصور؟
  useCDN: !!import.meta.env.VITE_CDN_ENABLED,
  
  // رابط CDN (إذا كان متاحًا)
  cdnUrl: import.meta.env.VITE_CDN_URL || '',
  
  // معلمات URL الإضافية لـ CDN
  cdnParams: '',
};

/**
 * تحميل صورة مع معالجات التحسين
 */
export const loadImage = (
  src: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: string;
    useCDN?: boolean;
  } = {}
): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    // إنشاء عنصر صورة جديد
    const img = new Image();
    
    // تعيين مسار الصورة بعد معالجته (إضافة CDN إذا لزم الأمر)
    img.src = getCDNEnabledSrc(src, options);
    
    // معالجة نجاح التحميل
    img.onload = () => resolve(img);
    
    // معالجة فشل التحميل
    img.onerror = () => {
      // في حالة فشل تحميل الصورة عبر CDN، حاول تحميلها مباشرة
      if (options.useCDN) {
        console.warn(`فشل تحميل الصورة من CDN: ${src}، محاولة التحميل المباشر...`);
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`فشل تحميل الصورة: ${src}`));
      } else {
        reject(new Error(`فشل تحميل الصورة: ${src}`));
      }
    };
  });
};

/**
 * تحويل مسار الصورة إلى مسار يستخدم CDN إذا كان متاحًا
 */
export const getCDNEnabledSrc = (
  src: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: string;
    useCDN?: boolean;
  } = {}
): string => {
  // إذا كانت CDN غير مفعلة أو كان المسار URL خارجي، أرجع المسار كما هو
  const useCDN = options.useCDN ?? DEFAULT_IMAGE_OPTIONS.useCDN;
  if (!useCDN || !DEFAULT_IMAGE_OPTIONS.cdnUrl || src.startsWith('http')) {
    return src;
  }
  
  // تنظيف المسار
  const path = src.startsWith('/') ? src.substring(1) : src;
  
  // بناء مسار CDN
  let cdnUrl = `${DEFAULT_IMAGE_OPTIONS.cdnUrl}/${path}`;
  
  // إضافة معلمات تحسين الصور إذا كانت متاحة
  const params: string[] = [];
  
  if (options.width) params.push(`w=${options.width}`);
  if (options.height) params.push(`h=${options.height}`);
  if (options.quality) params.push(`q=${options.quality}`);
  if (options.format) params.push(`fmt=${options.format}`);
  
  // إضافة المعلمات إلى URL إذا كانت موجودة
  if (params.length > 0) {
    cdnUrl += `?${params.join('&')}`;
  } else if (DEFAULT_IMAGE_OPTIONS.cdnParams) {
    cdnUrl += `?${DEFAULT_IMAGE_OPTIONS.cdnParams}`;
  }
  
  return cdnUrl;
};

/**
 * تشفير الصورة كـ base64
 */
export const imageToBase64 = (img: HTMLImageElement): string => {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('فشل في إنشاء سياق الرسم');
  }
  
  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL('image/jpeg');
};

/**
 * التحقق مما إذا كان المتصفح يدعم صيغة WebP
 */
export const supportsWebP = (): boolean => {
  if (typeof document === 'undefined') return false;
  
  const elem = document.createElement('canvas');
  if (elem.getContext && elem.getContext('2d')) {
    // نفذ اختبار toDataURL()
    return elem.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }
  
  // المتصفح لا يدعم canvas
  return false;
};

/**
 * الحصول على صيغة الصورة المناسبة بناءً على دعم المتصفح
 */
export const getOptimalImageFormat = (originalFormat = 'jpeg'): string => {
  if (DEFAULT_IMAGE_OPTIONS.useWebP && supportsWebP()) {
    return 'webp';
  }
  return originalFormat;
};

/**
 * التحقق مما إذا كان النطاق (URL) ضمن النطاقات المسموح بها
 * (مفيد عند استخدام CDN لتحديد المصادر الآمنة)
 */
export const isAllowedDomain = (url: string): boolean => {
  // يمكن توسيع هذه القائمة حسب الحاجة
  const allowedDomains = [
    window.location.hostname,
    'localhost',
    'staychill.com',
    'staychill.example',
    'cloudflare-cdn.com',
    'cloudfront.net',
    'firebase-cdn.com',
  ];
  
  try {
    const urlObj = new URL(url);
    return allowedDomains.some((domain) => urlObj.hostname.includes(domain));
  } catch (e) {
    // إذا كان URL غير صالح، افترض أنه مسار داخلي
    return true;
  }
};