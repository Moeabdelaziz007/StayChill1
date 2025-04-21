import React, { ReactNode, useState } from 'react';
import { motion } from 'framer-motion';
import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface InteractiveButtonProps extends Omit<ButtonProps, 'asChild'> {
  children: ReactNode;
  hoverScale?: number;
  clickEffect?: boolean;
  animationType?: 'spring' | 'tween';
  hoverClassName?: string;
  activeClassName?: string;
  transitionConfig?: any;
}

/**
 * مكون InteractiveButton - زر متحرك مع تأثيرات تفاعلية
 * يضيف تفاعلات بصرية وحركية للأزرار لتحسين تجربة المستخدم
 * 
 * @param children - محتوى الزر
 * @param hoverScale - نسبة التكبير عند التحويم (1.05 افتراضياً)
 * @param clickEffect - تفعيل تأثير النقر
 * @param animationType - نوع الحركة ('spring' أو 'tween')
 * @param className - الفئات CSS الأساسية
 * @param hoverClassName - فئات CSS إضافية عند التحويم
 * @param activeClassName - فئات CSS إضافية عند النقر
 * @param transitionConfig - إعدادات إضافية للحركة
 */
const InteractiveButton: React.FC<InteractiveButtonProps> = ({
  children,
  hoverScale = 1.05,
  clickEffect = true,
  animationType = 'spring',
  className,
  hoverClassName,
  activeClassName,
  transitionConfig,
  ...props
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isActive, setIsActive] = useState(false);

  // حساب الإعدادات المناسبة للحركة حسب النوع المحدد
  const transition = animationType === 'spring'
    ? { 
        type: "spring",
        stiffness: 400,
        damping: 15,
        ...transitionConfig
      }
    : { 
        type: "tween",
        ease: "easeInOut",
        duration: 0.2,
        ...transitionConfig
      };

  // تجميع تأثيرات الحركة
  const variants = {
    initial: { scale: 1 },
    hover: { scale: hoverScale },
    tap: clickEffect ? { scale: 0.95 } : { scale: hoverScale }
  };

  // تجميع الفئات الإضافية حسب حالة التفاعل
  const combinedClassName = cn(
    className,
    isHovered && hoverClassName,
    isActive && activeClassName
  );

  return (
    <motion.div
      initial="initial"
      whileHover="hover"
      whileTap="tap"
      variants={variants}
      transition={transition}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onTapStart={() => setIsActive(true)}
      onTap={() => setTimeout(() => setIsActive(false), 200)}
      onTapCancel={() => setIsActive(false)}
    >
      <Button
        className={combinedClassName}
        {...props}
      >
        {children}
      </Button>
    </motion.div>
  );
};

export default InteractiveButton;