import React, { useState, useRef } from 'react';
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { getBestSupportedFormat, getOptimizedImageUrl, ImageFormat, ImageQuality } from '@/lib/image-loader';

interface ResponsiveImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  sizes?: string;
  widths?: number[];
  aspectRatio?: string;
  containerClassName?: string;
  preload?: boolean;
  priority?: boolean; // هل هي صورة ذات أولوية عالية (مثل LCP)
  quality?: ImageQuality;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
}

/**
 * مكون ResponsiveImage المحسن الذي يستخدم عنصر <picture> للتوافق الأمثل مع المتصفحات
 * - يقدم تنسيقات متعددة (WebP, AVIF) مع استراتيجية احتياطية للمتصفحات الأقدم
 * - يدعم srcset وأحجام متعددة للاستجابة
 * - يدعم تغيير نسبة العرض إلى الارتفاع
 * - يدعم preloading للصور المهمة
 * - يعرض skeleton أثناء التحميل
 */
export function ResponsiveImage({
  src,
  alt,
  sizes = '100vw',
  widths = [320, 640, 960, 1280, 1920],
  aspectRatio,
  className,
  containerClassName,
  preload = false,
  priority = false,
  quality = ImageQuality.HIGH,
  objectFit = 'cover',
  ...props
}: ResponsiveImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  
  // الحصول على أفضل تنسيق للصورة استنادًا إلى دعم المتصفح
  const bestFormat = getBestSupportedFormat();
  
  // تحضير srcSet لكل تنسيق
  const createSrcSet = (format: ImageFormat) => {
    return widths
      .map(width => {
        const optimizedUrl = getOptimizedImageUrl(src, {
          format,
          quality,
          width,
        });
        return `${optimizedUrl} ${width}w`;
      })
      .join(', ');
  };
  
  // تحضير srcSet لكل تنسيق مدعوم
  const webpSrcSet = createSrcSet(ImageFormat.WEBP);
  const avifSrcSet = createSrcSet(ImageFormat.AVIF);
  const jpegSrcSet = createSrcSet(ImageFormat.JPEG);
  
  // إنشاء مصدر الصورة الافتراضي بأفضل جودة متاحة
  const fallbackSrc = getOptimizedImageUrl(src, {
    format: ImageFormat.JPEG,
    quality,
    width: Math.max(...widths),
  });
  
  // التعامل مع انتهاء التحميل
  const handleLoad = () => {
    setIsLoaded(true);
  };
  
  // التعامل مع حالة الخطأ
  const handleError = () => {
    setError(true);
    console.warn(`فشل تحميل الصورة: ${src}`);
  };
  
  // preload الصورة ذات الأولوية
  React.useEffect(() => {
    if (priority && preload && !isLoaded) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = getOptimizedImageUrl(src, {
        format: bestFormat,
        quality,
        width: Math.min(...widths),
      });
      document.head.appendChild(link);
      
      return () => {
        document.head.removeChild(link);
      };
    }
  }, [src, bestFormat, quality, widths, priority, preload, isLoaded]);
  
  return (
    <div 
      className={cn("relative overflow-hidden", containerClassName)}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {/* Skeleton loader أثناء التحميل */}
      {!isLoaded && (
        <Skeleton className="absolute inset-0 w-full h-full rounded-md" />
      )}
      
      {/* عنصر picture المتوافق مع جميع المتصفحات */}
      <picture>
        {/* تنسيق AVIF للمتصفحات المتوافقة */}
        <source 
          srcSet={avifSrcSet} 
          sizes={sizes} 
          type="image/avif"
        />
        
        {/* تنسيق WebP للمتصفحات المتوافقة */}
        <source 
          srcSet={webpSrcSet} 
          sizes={sizes} 
          type="image/webp"
        />
        
        {/* تنسيق JPEG للمتصفحات غير المتوافقة مع التنسيقات الحديثة */}
        <source 
          srcSet={jpegSrcSet} 
          sizes={sizes} 
          type="image/jpeg"
        />
        
        {/* الصورة الفعلية مع التنسيق الاحتياطي */}
        <img
          ref={imageRef}
          src={error ? 'https://placehold.co/600x400/e2e8f0/a1a1aa?text=Image+Error' : fallbackSrc}
          alt={alt}
          className={cn(
            "transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0",
            className
          )}
          style={{
            objectFit,
            width: '100%',
            height: aspectRatio ? '100%' : 'auto',
          }}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async" // فك تشفير غير متزامن لتحسين الأداء
          {...props}
        />
      </picture>
    </div>
  );
}

export default ResponsiveImage;