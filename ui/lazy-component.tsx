import React, { useEffect, useRef, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { LAZY_LOAD_THRESHOLD, COMPONENT_LOAD_DELAY } from '@/lib/performance-config';

interface LazyComponentProps {
  /**
   * المكون الذي سيتم تحميله بشكل كسول
   */
  children: React.ReactNode;
  
  /**
   * مسافة التحميل المسبق بالبكسل، حيث يبدأ التحميل عندما يكون المكون
   * ضمن هذه المسافة من نافذة العرض
   */
  threshold?: number;
  
  /**
   * تأخير التحميل بالمللي ثانية بعد أن يصبح المكون مرئيًا
   */
  delay?: number;
  
  /**
   * ما إذا كان سيتم تحميل المكون فورًا بغض النظر عن موضعه
   */
  immediate?: boolean;
  
  /**
   * العنصر الذي سيتم عرضه أثناء تحميل المكون
   */
  placeholder?: React.ReactNode;
  
  /**
   * ارتفاع العنصر البديل - مفيد عندما لا يكون هناك placeholder مخصص
   */
  height?: number | string;
  
  /**
   * عرض العنصر البديل - مفيد عندما لا يكون هناك placeholder مخصص
   */
  width?: number | string;
  
  /**
   * دالة يتم استدعاؤها عندما يظهر المكون في نافذة العرض
   */
  onVisible?: () => void;
  
  /**
   * فصيلة CSS للحاوية
   */
  className?: string;
  
  /**
   * ما إذا كان سيتم إظهار تأثير انتقالي عند تحميل المكون
   */
  showTransition?: boolean;
}

/**
 * مكون التحميل الكسول العام
 * يقوم بتحميل المحتوى فقط عندما يصبح مرئيًا في نافذة العرض
 * يدعم التحكم في استراتيجية التحميل، والتأخير، والعناصر البديلة
 */
const LazyComponent = ({
  children,
  threshold = LAZY_LOAD_THRESHOLD,
  delay = COMPONENT_LOAD_DELAY,
  immediate = false,
  placeholder,
  height = 200,
  width = '100%',
  onVisible,
  className = '',
  showTransition = true,
}: LazyComponentProps) => {
  const [isVisible, setIsVisible] = useState(immediate);
  const [isLoaded, setIsLoaded] = useState(immediate);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // إذا كان التحميل الفوري مطلوبًا، لا حاجة للمراقبة
    if (immediate) {
      setIsVisible(true);
      setIsLoaded(true);
      if (onVisible) onVisible();
      return;
    }
    
    // تهيئة مراقب التقاطع لمعرفة متى يصبح المكون مرئيًا
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
          if (onVisible) onVisible();
          
          // تأخير تحميل المكون (مفيد لتقليل تأثير دفعة كبيرة من المكونات)
          if (delay > 0) {
            setTimeout(() => {
              setIsLoaded(true);
            }, delay);
          } else {
            setIsLoaded(true);
          }
          
          // بمجرد أن يصبح مرئيًا، توقف عن المراقبة
          observer.disconnect();
        }
      },
      {
        root: null,
        rootMargin: `${threshold}px`,
        threshold: 0.1,
      }
    );
    
    // بدء مراقبة العنصر
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    
    // تنظيف المراقب عند تفكيك المكون
    return () => {
      observer.disconnect();
    };
  }, [immediate, threshold, delay, onVisible, isVisible]);
  
  // تحديد العنصر البديل المناسب
  const renderPlaceholder = () => {
    if (placeholder) return placeholder;
    
    return (
      <Skeleton
        className="w-full h-full"
        style={{ height, width }}
      />
    );
  };
  
  return (
    <div ref={containerRef} className={className}>
      {isLoaded ? (
        showTransition ? (
          <div className="transition-opacity duration-300 ease-in-out opacity-100">
            {children}
          </div>
        ) : (
          children
        )
      ) : (
        renderPlaceholder()
      )}
    </div>
  );
};

export default LazyComponent;