import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface DirectionalArrowProps {
  direction: 'right' | 'left';
  size?: number;
  className?: string;
}

/**
 * مكون DirectionalArrow
 * 
 * يستخدم هذا المكون لعرض أسهم الاتجاه (يمين/يسار) مع مراعاة اتجاه اللغة
 * في واجهات RTL (من اليمين إلى اليسار)، يتم عكس الاتجاهات تلقائيًا
 * 
 * @param direction - اتجاه السهم الأصلي ('right' أو 'left')
 * @param size - حجم الأيقونة
 * @param className - فئات CSS إضافية
 */
export const DirectionalArrow: React.FC<DirectionalArrowProps> = ({
  direction,
  size = 20,
  className = '',
}) => {
  const { locale } = useTranslation();
  const isRtl = locale === 'ar';
  
  // في حالة RTL، نقوم بعكس الاتجاه
  const actualDirection = isRtl ? (direction === 'right' ? 'left' : 'right') : direction;
  
  return actualDirection === 'right' ? (
    <ChevronRight size={size} className={className} />
  ) : (
    <ChevronLeft size={size} className={className} />
  );
};