import React from 'react';
import { useTranslation } from '@/lib/i18n';

interface SkipLinkProps {
  targetId: string;
  className?: string;
}

/**
 * مكون روابط التخطي للمستخدمين الذين يعتمدون على لوحة المفاتيح
 * 
 * يظهر رابط عند التركيز عليه بلوحة المفاتيح (Tab) للانتقال مباشرة إلى المحتوى الرئيسي
 * عادة ما يكون هذا أول عنصر قابل للتركيز في الصفحة
 * 
 * @param targetId معرف العنصر الهدف الذي سيتم الانتقال إليه
 * @param className فئات CSS اختيارية إضافية
 */
export const SkipLink: React.FC<SkipLinkProps> = ({ targetId, className = '' }) => {
  const { t } = useTranslation();
  
  return (
    <a
      href={`#${targetId}`}
      className={`sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:p-4 focus:bg-background focus:border focus:border-primary focus:rounded-md ${className}`}
    >
      {t('accessibility.skipToContent')}
    </a>
  );
};

export default SkipLink;