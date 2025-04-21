import { useState, useEffect, useMemo, useCallback } from 'react';
import { IMAGE_OPTIMIZATION, ConnectionUtils } from '@/lib/performance-config';

interface OptimizedImageOptions {
  /**
   * المسار الأصلي للصورة
   */
  src: string;
  
  /**
   * عرض الصورة المطلوب (بالبكسل)
   */
  width?: number;
  
  /**
   * ارتفاع الصورة المطلوب (بالبكسل)
   */
  height?: number;
  
  /**
   * تنسيق الصورة المفضل ('webp'، 'avif'، 'jpeg'، 'png')
   */
  format?: string;
  
  /**
   * جودة الصورة (0-100)
   */
  quality?: number;
  
  /**
   * كيفية ملاءمة الصورة ('cover'، 'contain'، 'fill')
   */
  fit?: 'cover' | 'contain' | 'fill';
  
  /**
   * ما إذا كان سيتم تطبيق تحويلات تكيفية بناءً على نوع الاتصال
   */
  adaptive?: boolean;
  
  /**
   * ما إذا كان سيتم استخدام التخزين المؤقت للصور
   */
  enableCache?: boolean;
  
  /**
   * أحجام متعددة للصورة (للاستجابة)
   */
  sizes?: number[];
}

interface UseOptimizedImageResult {
  /**
   * المسار المحسن للصورة
   */
  optimizedSrc: string;
  
  /**
   * مسارات متعددة للصورة بأحجام مختلفة (للاستجابة)
   */
  srcSet: string;
  
  /**
   * التنسيق المستخدم للصورة
   */
  format: string;
  
  /**
   * ما إذا كانت الصورة قيد التحميل
   */
  isLoading: boolean;
  
  /**
   * ما إذا كان حدث خطأ أثناء تحسين الصورة
   */
  error: Error | null;
  
  /**
   * دالة لإعادة محاولة تحسين الصورة في حالة الخطأ
   */
  retry: () => void;
}

/**
 * مصادر الصور التي لا تحتاج إلى تحسين
 */
const BYPASS_DOMAINS = [
  'cloudinary.com',
  'imgix.net',
  'images.unsplash.com',
  'githubusercontent.com',
];

/**
 * خطاف React لتحسين الصور ديناميكيًا
 * يوفر صورًا محسنة بناءً على قدرات المتصفح ونوع الاتصال
 */
export function useOptimizedImage({
  src,
  width,
  height,
  format,
  quality,
  fit = 'cover',
  adaptive = true,
  enableCache = true,
  sizes = IMAGE_OPTIMIZATION.RESPONSIVE_SIZES,
}: OptimizedImageOptions): UseOptimizedImageResult {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [optimizationAttempts, setOptimizationAttempts] = useState(0);
  
  // التحقق مما إذا كان مسار الصورة من مصدر يجب تجاوزه (مثل cloudinary)
  const shouldBypass = useMemo(() => {
    if (!src) return true;
    return BYPASS_DOMAINS.some(domain => src.includes(domain));
  }, [src]);
  
  // الحصول على التنسيق المناسب للصورة
  const bestFormat = useMemo(() => {
    if (format) return format;
    
    // استخدام أفضل تنسيق مدعوم
    const supportedFormats = IMAGE_OPTIMIZATION.PREFERRED_FORMATS;
    
    // التحقق من تنسيقات الصورة المدعومة في المتصفح (إذا أمكن)
    if (typeof window !== 'undefined') {
      const testCanvasFormat = (format: string): boolean => {
        try {
          const canvas = document.createElement('canvas');
          return canvas.toDataURL(`image/${format}`).indexOf(`data:image/${format}`) === 0;
        } catch (e) {
          return false;
        }
      };
      
      for (const formatToTest of supportedFormats) {
        if (testCanvasFormat(formatToTest)) {
          return formatToTest;
        }
      }
    }
    
    // استخدام JPEG كتنسيق احتياطي
    return 'jpeg';
  }, [format]);
  
  // الحصول على جودة الصورة المناسبة
  const optimizedQuality = useMemo(() => {
    if (quality) return quality;
    
    if (adaptive) {
      // تعديل الجودة بناء على نوع الاتصال
      const connectionType = ConnectionUtils.getConnectionType();
      const isSaveData = ConnectionUtils.isDataSaverEnabled();
      
      if (isSaveData) {
        return 60; // جودة منخفضة لوضع توفير البيانات
      }
      
      switch (connectionType) {
        case 'slow-2g':
          return 50; // جودة منخفضة جدًا لاتصال بطيء
        case '2g':
          return 60; // جودة منخفضة لشبكة 2G
        case '3g':
          return 70; // جودة متوسطة لشبكة 3G
        case '4g':
        default:
          return 80; // جودة عالية للاتصالات السريعة
      }
    }
    
    // الجودة الافتراضية
    return 80;
  }, [quality, adaptive]);
  
  // إنشاء عنوان URL محسن للصورة
  const createOptimizedUrl = useCallback((imageSrc: string, imageWidth?: number): string => {
    if (!imageSrc || shouldBypass) return imageSrc;
    
    // إنشاء معلمات التحسين
    const params = new URLSearchParams();
    if (bestFormat) params.set('format', bestFormat);
    if (optimizedQuality) params.set('quality', optimizedQuality.toString());
    if (imageWidth) params.set('width', imageWidth.toString());
    if (height) params.set('height', height.toString());
    if (fit) params.set('fit', fit);
    
    // إنشاء عنوان URL محسن
    // ملاحظة: في التطبيق الفعلي، يجب استبدال هذا بخدمة تحويل صور حقيقية
    // مثل Cloudinary أو Imgix أو Next.js Image Optimization API
    const paramsString = params.toString();
    const separator = imageSrc.includes('?') ? '&' : '?';
    
    return `${imageSrc}${paramsString ? `${separator}${paramsString}` : ''}`;
  }, [src, width, height, bestFormat, optimizedQuality, fit, shouldBypass]);
  
  // إنشاء srcSet للصور المستجيبة
  const generateSrcSet = useCallback(() => {
    if (!src || shouldBypass) return '';
    
    return sizes
      .map(size => `${createOptimizedUrl(src, size)} ${size}w`)
      .join(', ');
  }, [src, sizes, shouldBypass, createOptimizedUrl]);
  
  // عنوان URL المحسن النهائي والـ srcSet
  const optimizedSrc = useMemo(() => createOptimizedUrl(src, width), [createOptimizedUrl, src, width]);
  const srcSet = useMemo(() => generateSrcSet(), [generateSrcSet]);
  
  // محاكاة عملية تحسين الصورة
  useEffect(() => {
    if (!src || shouldBypass) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    // محاكاة لعملية تحسين الصورة
    const simulateOptimization = async () => {
      try {
        // في التطبيق الفعلي، ستكون هناك طلبات API حقيقية لخدمة تحسين الصور
        await new Promise(resolve => setTimeout(resolve, 100));
        setIsLoading(false);
      } catch (err) {
        setError(err as Error);
        setIsLoading(false);
      }
    };
    
    simulateOptimization();
  }, [src, shouldBypass, optimizationAttempts]);
  
  // دالة لإعادة محاولة التحسين
  const retry = useCallback(() => {
    setOptimizationAttempts(prev => prev + 1);
  }, []);
  
  return {
    optimizedSrc,
    srcSet,
    format: bestFormat,
    isLoading,
    error,
    retry,
  };
}