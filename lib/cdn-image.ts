/**
 * وحدة لإدارة الصور المُخَدمة عبر CDN في جانب العميل
 */

// تكوين CDN - يمكن تحديثه عند تغيير المزود
const CDN_CONFIG = {
  // قاعدة URL للـ CDN
  baseUrl: import.meta.env.VITE_CDN_URL || '',
  
  // هل تم تفعيل الـ CDN؟
  enabled: !!import.meta.env.VITE_CDN_ENABLED,
  
  // مسار الصور الافتراضي
  defaultImagesPath: '/assets/images',
  
  // دعم صيغة WebP
  supportWebP: true,
  
  // الصيغ المدعومة للتحويل لـ WebP
  convertibleFormats: ['jpg', 'jpeg', 'png'],
  
  // الصيغ التي لا تحتاج إلى تحويل
  nonConvertibleFormats: ['svg', 'gif', 'webp', 'avif']
};

/**
 * فحص ما إذا كان المتصفح يدعم صيغة WebP
 */
export const supportsWebP = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // تخزين النتيجة في متغير عام لتجنب إعادة الفحص
  if (window._supportsWebP !== undefined) return window._supportsWebP;
  
  // فحص دعم WebP في المتصفح
  const canvas = document.createElement('canvas');
  if (canvas.getContext && canvas.getContext('2d')) {
    // متصفحات حديثة - فحص دعم toDataURL
    window._supportsWebP = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  } else {
    // متصفحات قديمة
    window._supportsWebP = false;
  }
  
  return window._supportsWebP;
};

/**
 * تحويل رابط الصورة المحلي إلى رابط CDN
 */
export const getCdnImageUrl = (
  src: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: string;
    blur?: boolean;
  } = {}
): string => {
  // إذا كان CDN غير مفعل، أرجع المسار الأصلي
  if (!CDN_CONFIG.enabled || !CDN_CONFIG.baseUrl) return src;
  
  // إذا كان المسار URL كامل، أرجعه كما هو - لا نقوم بتحويل الصور الخارجية
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  
  // تجريد المسار من أي علامات استفهام أو أجزاء من URL
  const cleanPath = src.split('?')[0].split('#')[0];
  
  // استخراج امتداد الملف
  const fileExtension = cleanPath.substring(cleanPath.lastIndexOf('.') + 1).toLowerCase();
  
  // تحديد الصيغة النهائية للصورة
  let format = options.format;
  
  // إذا لم يتم تحديد صيغة، استخدم WebP إذا كان المتصفح يدعمها والصورة من الصيغ القابلة للتحويل
  if (!format && CDN_CONFIG.supportWebP && supportsWebP() && 
      CDN_CONFIG.convertibleFormats.includes(fileExtension)) {
    format = 'webp';
  }
  
  // بناء عنوان URL للـ CDN
  let cdnUrl = CDN_CONFIG.baseUrl;
  
  // إضافة المسار الأساسي للصورة (إزالة '/' الرئيسية إذا وجدت)
  cdnUrl += src.startsWith('/') ? src : `/${src}`;
  
  // إضافة معلمات تحجيم وتحويل الصورة
  const params: string[] = [];
  
  if (options.width) params.push(`w=${options.width}`);
  if (options.height) params.push(`h=${options.height}`);
  if (options.quality) params.push(`q=${options.quality}`);
  if (format) params.push(`fmt=${format}`);
  if (options.blur) params.push('blur=80');
  
  // إضافة معلمات URL إذا كانت موجودة
  if (params.length > 0) {
    cdnUrl += `?${params.join('&')}`;
  }
  
  return cdnUrl;
};

/**
 * الحصول على URL للصورة المصغرة (بجودة منخفضة للتحميل المسبق)
 */
export const getPlaceholderImageUrl = (src: string): string => {
  return getCdnImageUrl(src, {
    width: 20,  // عرض صغير جدًا
    quality: 30, // جودة منخفضة
    blur: true   // تطبيق تأثير ضبابي
  });
};

/**
 * الحصول على حجم الصورة الأمثل بناءً على حجم الشاشة
 */
export const getOptimalImageSize = (
  width?: number,
  height?: number
): { width?: number; height?: number } => {
  // إذا لم يتم تحديد أبعاد، استخدم أبعاد افتراضية بناءً على حجم النافذة
  if (!width && !height) {
    // استخدم 50% من عرض النافذة كأقصى حد
    const maxWidth = typeof window !== 'undefined' ? Math.round(window.innerWidth * 0.5) : 800;
    
    // تقريب القيمة لأقرب 100 لتقليل الإصدارات المختلفة من الصور المخزنة مؤقتًا
    return {
      width: Math.ceil(maxWidth / 100) * 100
    };
  }
  
  return { width, height };
};

// توسعة نوع Window لإضافة خاصية _supportsWebP
declare global {
  interface Window {
    _supportsWebP?: boolean;
  }
}