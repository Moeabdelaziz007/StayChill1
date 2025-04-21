import React, { useEffect, useRef, ReactNode } from 'react';

interface ScreenReaderOnlyProps {
  children: ReactNode;
  as?: keyof JSX.IntrinsicElements;
  id?: string;
  className?: string;
  ariaLive?: 'off' | 'polite' | 'assertive';
  ariaRelevant?: 'additions' | 'additions text' | 'all' | 'removals' | 'text';
  ariaAtomic?: boolean;
}

/**
 * مكون لإخفاء المحتوى بصريًا ولكن إبقائه متاحًا لقارئات الشاشة
 * 
 * يدعم تقديم المحتوى بعناصر HTML مختلفة وإضافة خصائص WAI-ARIA
 * 
 * @param children محتوى المكون
 * @param as العنصر HTML المستخدم (span، div، p، إلخ)
 * @param id معرف المكون
 * @param className فئات CSS إضافية
 * @param ariaLive قيمة aria-live
 * @param ariaRelevant قيمة aria-relevant
 * @param ariaAtomic قيمة aria-atomic
 */
export const ScreenReaderOnly: React.FC<ScreenReaderOnlyProps> = ({
  children,
  as: Element = 'span',
  id,
  className,
  ariaLive,
  ariaRelevant,
  ariaAtomic,
}) => {
  return (
    <Element
      id={id}
      className={`sr-only ${className || ''}`}
      aria-live={ariaLive}
      aria-relevant={ariaRelevant}
      aria-atomic={ariaAtomic}
    >
      {children}
    </Element>
  );
};

interface ScreenReaderAnnounceProps {
  children: ReactNode;
  assertive?: boolean;
}

/**
 * مكون لإعلان المحتوى لقارئات الشاشة دون عرضه بصريًا
 * 
 * يستخدم لإبلاغ المستخدمين بالتغييرات الديناميكية
 * 
 * @param children المحتوى المراد إعلانه
 * @param assertive ما إذا كان الإعلان عاجلًا (assertive) أم مهذبًا (polite)
 */
export const ScreenReaderAnnounce: React.FC<ScreenReaderAnnounceProps> = ({
  children,
  assertive = false,
}) => {
  const [announcement, setAnnouncement] = React.useState<ReactNode>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // تعيين المحتوى في الإعلان
  useEffect(() => {
    // مسح أي مؤقت سابق
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // تعيين المحتوى الجديد
    setAnnouncement(children);

    // مسح الإعلان بعد فترة
    timeoutRef.current = setTimeout(() => {
      setAnnouncement(null);
    }, 5000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [children]);

  return (
    <div
      aria-live={assertive ? 'assertive' : 'polite'}
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  );
};

interface VisuallyHiddenProps {
  children: ReactNode;
}

/**
 * بديل لـ ScreenReaderOnly يستخدم أسلوب مختلف للإخفاء
 * 
 * بعض التطبيقات قد تفضل استخدام هذا المكون بدلًا من sr-only
 * 
 * @param children المحتوى المراد إخفاؤه بصريًا ولكن إبقاؤه متاحًا لقارئات الشاشة
 */
export const VisuallyHidden: React.FC<VisuallyHiddenProps> = ({ children }) => {
  return (
    <span
      style={{
        border: 0,
        clip: 'rect(0 0 0 0)',
        height: '1px',
        margin: '-1px',
        overflow: 'hidden',
        padding: 0,
        position: 'absolute',
        width: '1px',
        whiteSpace: 'nowrap',
        wordWrap: 'normal',
      }}
    >
      {children}
    </span>
  );
};