import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { getCdnImageUrl, getPlaceholderImageUrl, getOptimalImageSize } from "@/lib/cdn-image";

interface CDNImageProps {
  /** مسار/رابط الصورة الأصلي */
  src: string;
  /** النص البديل للصورة */
  alt: string;
  /** عرض الصورة (اختياري) */
  width?: number;
  /** ارتفاع الصورة (اختياري) */
  height?: number;
  /** فئة CSS للصورة (اختياري) */
  className?: string;
  /** فئة CSS للحاوية (اختياري) */
  containerClassName?: string;
  /** نوع توافق الصورة داخل الإطار (اختياري) */
  objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
  /** تحديد ما إذا كان التحميل التدريجي (مع تأثير الظهور) مفعل */
  fadeIn?: boolean;
  /** وقت تأثير الظهور بالميللي ثانية */
  fadeTime?: number;
  /** تحديد ما إذا كانت الصورة ذات أولوية عالية في التحميل */
  priority?: boolean;
  /** تمكين التحميل الكسول للصور البعيدة عن الشاشة */
  lazy?: boolean;
  /** إظهار نسخة مصغرة ضبابية قبل تحميل الصورة الكاملة */
  blur?: boolean;
  /** بناء الصورة بأحجام متعددة للشاشات المختلفة */
  responsive?: boolean;
  /** عتبة التقاطع للتحميل الكسول */
  threshold?: number;
  /** هامش جذر التقاطع للتحميل الكسول */
  rootMargin?: string;
  /** استدعاء عند اكتمال تحميل الصورة */
  onLoad?: () => void;
  /** استدعاء عند فشل تحميل الصورة */
  onError?: () => void;
  /** لون خلفية مؤقت حتى يتم تحميل الصورة */
  placeholderColor?: string;
  /** جودة الصورة المطلوبة (1-100) */
  quality?: number;
  /** تنسيق الصورة المطلوب (webp, jpg, png, ...) */
  format?: string;
}

/**
 * مكون الصورة المُحسن مع دعم CDN
 * يدعم التحميل الكسول، تأثير التلاشي، والصور المستجيبة
 */
export function CDNImage({
  src,
  alt,
  width,
  height,
  className,
  containerClassName,
  objectFit = "cover",
  fadeIn = true,
  fadeTime = 500,
  priority = false,
  lazy = true,
  blur = true,
  responsive = true,
  threshold = 0.1,
  rootMargin = "200px 0px",
  onLoad,
  onError,
  placeholderColor = "#f3f4f6", // اللون الرمادي الفاتح كخلفية مؤقتة
  quality,
  format
}: CDNImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // حساب الأبعاد المثلى
  const optimalSize = getOptimalImageSize(width, height);
  
  // تحميل الصورة عبر CDN
  useEffect(() => {
    if (!src) return;
    
    // إذا كانت الصورة ذات أولوية، حملها فورًا
    if (priority) {
      setImgSrc(getCdnImageUrl(src, {
        width: optimalSize.width,
        height: optimalSize.height,
        quality,
        format
      }));
      return;
    }
    
    // إذا كان التحميل الكسول مفعلًا، استخدم IntersectionObserver
    if (lazy && typeof IntersectionObserver !== 'undefined' && containerRef.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              // الصورة ظاهرة في العرض، ابدأ تحميلها
              setImgSrc(getCdnImageUrl(src, {
                width: optimalSize.width,
                height: optimalSize.height,
                quality,
                format
              }));
              observer.disconnect();
            }
          });
        },
        {
          root: null,
          rootMargin,
          threshold
        }
      );
      
      observer.observe(containerRef.current);
      
      return () => {
        observer.disconnect();
      };
    } else {
      // التحميل الكسول غير مفعل، حمل الصورة فورًا
      setImgSrc(getCdnImageUrl(src, {
        width: optimalSize.width,
        height: optimalSize.height,
        quality,
        format
      }));
    }
  }, [
    src, 
    priority, 
    lazy, 
    rootMargin, 
    threshold, 
    optimalSize.width, 
    optimalSize.height,
    quality,
    format
  ]);
  
  // معالجة الأحداث
  const handleLoad = () => {
    setIsLoaded(true);
    if (onLoad) onLoad();
  };
  
  const handleError = () => {
    // عند فشل تحميل الصورة، حاول استخدام المسار الأصلي غير المُعدل
    if (imgSrc !== src) {
      setImgSrc(src);
    }
    if (onError) onError();
  };
  
  // صورة مصغرة ضبابية إذا كانت مفعلة
  const blurDataURL = blur ? getPlaceholderImageUrl(src) : undefined;
  
  // تحديد الصورة المستجيبة إذا كانت مفعلة
  const responsiveSizes = responsive ? 
    "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" : 
    undefined;
  
  // إعداد أسلوب الحاوية
  const containerStyles = {
    position: 'relative' as const,
    overflow: 'hidden' as const,
    width: width ? `${width}px` : '100%',
    height: height ? `${height}px` : 'auto',
    backgroundColor: placeholderColor,
  };
  
  // إعداد أسلوب الصورة
  const imageStyles = {
    objectFit,
    opacity: (isLoaded || !fadeIn) ? 1 : 0,
    transition: fadeIn ? `opacity ${fadeTime}ms ease-in-out` : 'none',
    width: '100%',
    height: '100%',
  };
  
  // إعداد أسلوب الصورة المصغرة
  const placeholderStyles = {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    objectFit,
    width: '100%',
    height: '100%',
    filter: 'blur(20px)',
    opacity: isLoaded ? 0 : 1,
    transition: `opacity ${fadeTime}ms ease-in-out`,
  };
  
  return (
    <div 
      ref={containerRef}
      className={cn("cdn-image-container", containerClassName)}
      style={containerStyles}
    >
      {/* الصورة المصغرة الضبابية إذا كان التأثير الضبابي مفعلًا */}
      {blur && blurDataURL && (
        <img
          src={blurDataURL}
          aria-hidden="true"
          alt=""
          style={placeholderStyles}
        />
      )}
      
      {/* الصورة الرئيسية */}
      {imgSrc && (
        <img
          ref={imgRef}
          src={imgSrc}
          alt={alt}
          className={cn("cdn-image", className)}
          width={width}
          height={height}
          style={imageStyles}
          onLoad={handleLoad}
          onError={handleError}
          sizes={responsiveSizes}
          loading={priority ? "eager" : "lazy"}
        />
      )}
    </div>
  );
}

/**
 * مكون الصورة البطاقة المُحسن مع دعم CDN
 * يستخدم لعرض البطاقات مع نسبة ثابتة للصورة
 */
export function CDNCardImage({
  src,
  alt,
  aspectRatio = "16/9",
  className,
  ...props
}: CDNImageProps & { aspectRatio?: string }) {
  // حساب النسبة المئوية للارتفاع بناءً على نسبة العرض إلى الارتفاع
  const calculatePaddingBottom = () => {
    // استخراج القيم من نسبة العرض إلى الارتفاع "16/9" -> [16, 9]
    const [width, height] = aspectRatio.split('/').map(Number);
    // حساب النسبة المئوية: (ارتفاع / عرض) * 100
    return `${(height / width) * 100}%`;
  };
  
  return (
    <div 
      className={cn("relative w-full overflow-hidden", className)}
      style={{ paddingBottom: calculatePaddingBottom() }}
    >
      <CDNImage
        src={src}
        alt={alt}
        className="absolute inset-0 w-full h-full"
        containerClassName="absolute inset-0"
        objectFit="cover"
        {...props}
      />
    </div>
  );
}

/**
 * مكون صورة الملف الشخصي المستدير مع دعم CDN
 */
export function CDNAvatarImage({
  src,
  alt,
  size = 40,
  className,
  ...props
}: CDNImageProps & { size?: number }) {
  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-full bg-gray-200",
        className
      )}
      style={{ width: size, height: size }}
    >
      <CDNImage
        src={src}
        alt={alt}
        width={size}
        height={size}
        className="rounded-full"
        objectFit="cover"
        blur={true}
        quality={80}
        {...props}
      />
    </div>
  );
}