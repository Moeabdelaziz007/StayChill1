import React from 'react';
import { useTranslation } from '@/lib/i18n';

type IconProps = React.SVGProps<SVGSVGElement> & {
  children: React.ReactNode;
  flipInRtl?: boolean;
  className?: string;
};

/**
 * مكون DirectionalIcon
 * 
 * يستخدم هذا المكون لعرض الأيقونات التي تحتاج إلى تغيير اتجاهها بناءً على لغة الواجهة
 * مثل أيقونات الأسهم التي تحتاج إلى عكس اتجاهها في واجهات RTL (من اليمين إلى اليسار)
 * 
 * @param children - مكون الأيقونة SVG
 * @param flipInRtl - تحديد ما إذا كان يجب عكس الأيقونة في واجهات RTL
 * @param className - فئات CSS إضافية
 */
export const DirectionalIcon: React.FC<IconProps> = ({
  children,
  flipInRtl = true,
  className = '',
  ...props
}) => {
  const { locale } = useTranslation();
  const isRtl = locale === 'ar';
  
  // تطبيق عكس الأيقونة فقط في حالة RTL وعندما يكون flipInRtl صحيحًا
  const shouldFlip = isRtl && flipInRtl;
  
  const rtlClass = shouldFlip ? 'rtl-flip' : '';
  const combinedClassName = `${className} ${rtlClass}`.trim();
  
  // استنساخ الأيقونة وإضافة الفئات الجديدة
  return React.cloneElement(children as React.ReactElement, {
    ...props,
    className: combinedClassName,
  });
};