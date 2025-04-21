import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { LucideIcon } from 'lucide-react';

interface DirectionalIconProps {
  icon: LucideIcon;
  flipInRtl?: boolean;
  rotate180InRtl?: boolean;
  className?: string;
  size?: number | string;
  strokeWidth?: number;
  color?: string;
  onClick?: () => void;
}

/**
 * مكون أيقونة اتجاهية يتعامل مع تغيير اتجاه الأيقونة بناءً على اتجاه اللغة (RTL/LTR)
 * استخدم هذا المكون لأيقونات الأسهم والعناصر المشابهة التي تحتاج إلى الاستجابة لتغيير اتجاه اللغة
 */
export const DirectionalIcon: React.FC<DirectionalIconProps> = ({
  icon: Icon,
  flipInRtl = false,
  rotate180InRtl = false,
  className = '',
  size = 20,
  strokeWidth = 2,
  color,
  onClick,
}) => {
  const { locale } = useTranslation();
  const isRtl = locale === 'ar';
  
  let iconClassName = className;
  
  if (isRtl) {
    if (flipInRtl) {
      iconClassName += ' rtl-icon-flip';
    }
    
    if (rotate180InRtl) {
      iconClassName += ' rtl-rotate-180';
    }
  }
  
  return (
    <Icon 
      className={iconClassName}
      size={size}
      strokeWidth={strokeWidth}
      color={color}
      onClick={onClick}
    />
  );
};

/**
 * مكون سهم مع دعم الاتجاه التلقائي
 * يتم عكس الاتجاه تلقائيًا في واجهات RTL
 */
export const DirectionalArrow: React.FC<Omit<DirectionalIconProps, 'icon' | 'flipInRtl' | 'rotate180InRtl'>> = (props) => {
  const ArrowIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={props.width || 24} 
      height={props.height || 24} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={2} 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={props.className}
    >
      <line x1="5" y1="12" x2="19" y2="12"></line>
      <polyline points="12 5 19 12 12 19"></polyline>
    </svg>
  );
  
  return <DirectionalIcon icon={ArrowIcon as any} flipInRtl={true} {...props} />;
};

export default DirectionalIcon;