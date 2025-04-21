import React, { ReactNode } from 'react';
import ScreenReaderOnly from './ScreenReaderOnly';

interface AccessibleIconProps {
  /** أيقونة React التي سيتم عرضها */
  icon: ReactNode;
  /** النص البديل الذي سيقرأ بواسطة قارئات الشاشة */
  label: string;
  /** فئات CSS إضافية للأيقونة */
  className?: string;
  /** فئات CSS إضافية للمكون بالكامل */
  wrapperClassName?: string;
  /** طريقة العرض للأيقونة (اختياري، مثل width/height) */
  style?: React.CSSProperties;
  /** معالج النقر (اختياري) */
  onClick?: () => void;
}

/**
 * مكون AccessibleIcon
 * 
 * يقوم بتغليف أيقونة مع نص بديل لقارئات الشاشة
 * لتحسين إمكانية الوصول للأيقونات
 * 
 * @param icon - مكون الأيقونة 
 * @param label - النص البديل لقارئات الشاشة
 * @param className - فئات CSS للأيقونة
 * @param wrapperClassName - فئات CSS للعنصر المغلف
 * @param style - أنماط CSS مخصصة
 * @param onClick - معالج النقر
 */
const AccessibleIcon: React.FC<AccessibleIconProps> = ({
  icon,
  label,
  className = '',
  wrapperClassName = '',
  style,
  onClick
}) => {
  // الخصائص التي سيتم تمريرها للعنصر المحيط
  const wrapperProps: any = {
    className: `accessible-icon ${wrapperClassName}`.trim(),
  };
  
  // إذا تم توفير معالج نقر، أضف أيضًا role="button" وسمات إمكانية الوصول
  if (onClick) {
    wrapperProps.onClick = onClick;
    wrapperProps.role = 'button';
    wrapperProps.tabIndex = 0;
    wrapperProps['aria-label'] = label;
    wrapperProps.onKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      }
    };
    
    // لا داعي لعنصر ScreenReaderOnly إذا كان aria-label موجودًا
    return (
      <span {...wrapperProps} style={style}>
        {React.cloneElement(icon as React.ReactElement, { className, 'aria-hidden': 'true' })}
      </span>
    );
  }

  // إذا كانت الأيقونة للعرض فقط (بدون نقر)، استخدم نصًا مخفيًا
  return (
    <span {...wrapperProps} style={style} aria-hidden="true">
      {React.cloneElement(icon as React.ReactElement, { className })}
      <ScreenReaderOnly>{label}</ScreenReaderOnly>
    </span>
  );
};

export default AccessibleIcon;