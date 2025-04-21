import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackSrc?: string; // اختياري للصورة البديلة
  blurHash?: string; // اختياري لتضمين blurHash للصورة
  aspectRatio?: string; // نسبة العرض إلى الارتفاع مثل "16/9"
  containerClassName?: string; // class خاص بالحاوية
}

/**
 * مكون LazyImage المحسن للأداء
 * - يدعم التحميل البطيء للصور عند ظهورها في الشاشة
 * - يعرض skeleton loader أثناء التحميل
 * - يدعم fallback للصور التي فشل تحميلها
 * - يحافظ على نسبة العرض إلى الارتفاع لمنع تغير تخطيط الصفحة
 */
export function LazyImage({
  src,
  alt,
  fallbackSrc = "https://placehold.co/600x400/e2e8f0/a1a1aa?text=Image",
  aspectRatio = "auto",
  className,
  containerClassName,
  ...props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // استخدام Intersection Observer للتحميل البطيء
  useEffect(() => {
    const options = {
      root: null,
      rootMargin: "200px", // تحميل مسبق بمقدار 200 بكسل قبل الظهور
      threshold: 0.01, // يبدأ التحميل عندما يظهر 1% من العنصر
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect(); // لم نعد بحاجة للمراقبة بعد بدء التحميل
        }
      });
    }, options);
    
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    
    return () => {
      observer.disconnect();
    };
  }, []);
  
  // التعامل مع حدث التحميل
  const handleLoad = () => {
    setIsLoaded(true);
  };
  
  // التعامل مع حدث الخطأ
  const handleError = () => {
    setError(true);
    console.warn(`فشل تحميل الصورة: ${src}`);
  };

  return (
    <div 
      ref={containerRef}
      className={cn(
        "overflow-hidden relative",
        containerClassName
      )}
      style={{
        aspectRatio,
      }}
    >
      {/* Skeleton loader أثناء التحميل */}
      {!isLoaded && (
        <Skeleton 
          className="w-full h-full absolute inset-0 rounded-md"
        />
      )}
      
      {/* الصورة الفعلية أو الصورة البديلة في حالة الخطأ */}
      {shouldLoad && (
        <img
          ref={imgRef}
          src={error ? fallbackSrc : src}
          alt={alt}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0",
            className
          )}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy" // تحميل مؤجل على مستوى المتصفح أيضًا
          decoding="async" // فك تشفير الصورة غير متزامن لتحسين الأداء
          {...props}
        />
      )}
    </div>
  );
}

export default LazyImage;