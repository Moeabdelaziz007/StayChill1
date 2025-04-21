import React, { useState, useEffect } from 'react';
import OptimizedImage from './optimized-image';

/**
 * واجهة خصائص WebP Image
 */
interface WebPImageProps {
  /** رابط الصورة الأصلية */
  src: string;
  /** النص البديل للصورة */
  alt: string;
  /** عرض الصورة */
  width?: number;
  /** ارتفاع الصورة */
  height?: number;
  /** فئة CSS */
  className?: string;
  /** نوع توافق الصورة */
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  /** تأثير التلاشي عند التحميل */
  fadeIn?: boolean;
  /** تحميل الصورة بأولوية عالية */
  priority?: boolean;
  /** تحميل صورة مصغرة أولاً للتأثير المطموس */
  blur?: boolean;
  /** جودة صورة WebP (0-100) */
  quality?: number;
}

/**
 * مكون لعرض الصور بتنسيق WebP مع الرجوع لتنسيقات أخرى كاحتياط
 * WebP Image Component with Fallback
 * 
 * يقوم هذا المكون بتحويل الصور تلقائيًا إلى تنسيق WebP للمتصفحات الداعمة
 * ويعرض الصور بالتنسيق الأصلي كاحتياط للمتصفحات القديمة
 */
const WebPImage: React.FC<WebPImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  objectFit = 'cover',
  fadeIn = true,
  priority = false,
  blur = true,
  quality = 80,
}) => {
  const [supportsWebP, setSupportsWebP] = useState<boolean | null>(null);
  
  // التحقق من دعم المتصفح لتنسيق WebP
  useEffect(() => {
    const checkWebPSupport = async () => {
      const isSupported = await testWebP();
      setSupportsWebP(isSupported);
    };
    
    checkWebPSupport();
  }, []);
  
  // إذا لم نتحقق بعد من دعم WebP
  if (supportsWebP === null) {
    // عرض مساحة فارغة بنفس الأبعاد (لمنع القفز عند التحميل)
    return (
      <div 
        className={`webp-image-placeholder ${className}`}
        style={{
          width: width ? `${width}px` : '100%',
          height: height ? `${height}px` : 'auto',
          backgroundColor: '#f0f0f0',
        }}
      />
    );
  }
  
  // استخدام OptimizedImage مع تنسيق WebP أو تنسيق الاحتياط
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      objectFit={objectFit}
      fadeIn={fadeIn}
      priority={priority}
      blur={blur}
      responsive={true}
    />
  );
};

/**
 * اختبار دعم متصفح المستخدم لتنسيق WebP
 * @returns {Promise<boolean>} دعم WebP
 */
async function testWebP(): Promise<boolean> {
  // للخادم، افترض أن WebP مدعوم
  if (typeof window === 'undefined') {
    return true;
  }
  
  // استخدام الكاش لتجنب تكرار الاختبار
  if (sessionStorage.getItem('supportsWebP') !== null) {
    return sessionStorage.getItem('supportsWebP') === 'true';
  }
  
  return new Promise((resolve) => {
    const webP = new Image();
    
    webP.onload = function() {
      // تخزين النتيجة في sessionStorage
      const result = !!(webP.height === 1);
      sessionStorage.setItem('supportsWebP', result.toString());
      resolve(result);
    };
    
    webP.onerror = function() {
      // تخزين النتيجة السلبية في sessionStorage
      sessionStorage.setItem('supportsWebP', 'false');
      resolve(false);
    };
    
    // صورة WebP صغيرة للاختبار
    webP.src = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAgA0JaQAA3AA/vz0AAA=';
  });
}

export default WebPImage;