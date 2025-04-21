import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useOptimizedImage } from '@/hooks/use-optimized-image';
import { Skeleton } from '@/components/ui/skeleton';
import { LAZY_LOAD_THRESHOLD } from '@/lib/performance-config';

interface BlurImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  /**
   * مسار الصورة الأصلية
   */
  src: string;
  
  /**
   * مسار الصورة المصغرة البديلة (اختياري)
   */
  placeholderSrc?: string;
  
  /**
   * نص بديل للصورة للوصول
   */
  alt: string;
  
  /**
   * إذا كان يجب تحميل الصورة بأولوية عالية
   */
  priority?: boolean;
  
  /**
   * ما إذا كان سيتم تمكين تأثير الضبابية
   */
  enableBlur?: boolean;
  
  /**
   * كيفية ملاءمة الصورة في الحاوية
   */
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  
  /**
   * دالة يتم استدعاؤها عند اكتمال تحميل الصورة
   */
  onLoad?: () => void;
  
  /**
   * فصيلة CSS لحاوية الصورة
   */
  containerClassName?: string;
  
  /**
   * فصيلة CSS للصورة
   */
  className?: string;
  
  /**
   * خصائص إضافية للصورة
   */
  imgProps?: React.ImgHTMLAttributes<HTMLImageElement>;
}

/**
 * مكون BlurImage يوفر تحميل تدريجي للصور مع تأثير ضبابي
 * مع خيارات تحسين وضبط متنوعة للأداء
 */
export const BlurImage = React.forwardRef<HTMLDivElement, BlurImageProps>(
  ({
    src,
    placeholderSrc,
    alt,
    priority = false,
    enableBlur = true,
    objectFit = 'cover',
    onLoad,
    containerClassName,
    className,
    imgProps = {},
    ...props
  }, ref) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [showPlaceholder, setShowPlaceholder] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);
    
    // تحسين الصورة باستخدام خطاف مخصص
    const { 
      optimizedSrc,
      srcSet,
      isLoading,
      error,
      retry
    } = useOptimizedImage({
      src,
      width: props.width ? Number(props.width) : undefined,
      height: props.height ? Number(props.height) : undefined,
      quality: 80, // جودة الضغط
      adaptive: true, // تعديل الجودة بناء على نوع الاتصال
    });
    
    // تتبع ظهور الصورة في نافذة العرض
    useEffect(() => {
      if (!containerRef.current || priority) {
        setIsVisible(true);
        return;
      }
      
      const observer = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        },
        {
          rootMargin: `${LAZY_LOAD_THRESHOLD}px`,
          threshold: 0,
        }
      );
      
      observer.observe(containerRef.current);
      
      return () => {
        observer.disconnect();
      };
    }, [priority]);
    
    // معالجة الأخطاء
    useEffect(() => {
      if (error) {
        console.error('فشل في تحميل الصورة', error);
      }
    }, [error]);
    
    // معالجة اكتمال تحميل الصورة
    const handleImageLoad = () => {
      setIsLoaded(true);
      setShowPlaceholder(false);
      
      if (onLoad) {
        onLoad();
      }
    };
    
    // معالجة فشل تحميل الصورة
    const handleImageError = () => {
      console.error('فشل في تحميل الصورة:', src);
      retry(); // محاولة إعادة التحميل
    };
    
    // التعامل مع خطأ تحميل الصورة البديلة
    const handlePlaceholderError = () => {
      setShowPlaceholder(false);
    };
    
    // إنشاء inline style للصورة
    const imageStyle: React.CSSProperties = {
      objectFit,
      ...props.style,
    };
    
    // إنشاء inline style للتأثير الضبابي
    const blurStyle: React.CSSProperties = {
      filter: isLoaded ? 'none' : 'blur(20px)',
      transition: 'filter 0.3s ease-out',
    };
    
    return (
      <div
        ref={ref || containerRef}
        className={cn(
          'overflow-hidden relative',
          containerClassName
        )}
        style={{
          width: props.width,
          height: props.height,
        }}
      >
        {/* عرض هيكل التحميل إذا لم تظهر الصورة بعد */}
        {!isVisible && !isLoaded && (
          <Skeleton className="w-full h-full absolute inset-0" />
        )}
        
        {/* عرض الصورة البديلة المصغرة أثناء التحميل */}
        {showPlaceholder && isVisible && placeholderSrc && (
          <img
            src={placeholderSrc}
            alt=""
            className={cn(
              'absolute inset-0 w-full h-full transition-opacity duration-500',
              isLoaded ? 'opacity-0' : 'opacity-100',
              className
            )}
            style={{
              ...imageStyle,
              ...(enableBlur ? blurStyle : {}),
            }}
            onError={handlePlaceholderError}
          />
        )}
        
        {/* عرض الصورة الرئيسية */}
        {isVisible && (
          <img
            src={optimizedSrc}
            srcSet={srcSet}
            alt={alt}
            {...imgProps}
            loading={priority ? 'eager' : 'lazy'}
            decoding={priority ? 'sync' : 'async'}
            onLoad={handleImageLoad}
            onError={handleImageError}
            className={cn(
              'w-full h-full transition-opacity duration-500',
              !isLoaded ? 'opacity-0' : 'opacity-100',
              className
            )}
            style={imageStyle}
            {...props}
          />
        )}
      </div>
    );
  }
);

BlurImage.displayName = 'BlurImage';