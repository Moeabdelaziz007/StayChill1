import React from 'react';
import { WhatsApp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WhatsAppShareProps {
  url: string;
  message?: string;
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children?: React.ReactNode;
  showLabel?: boolean;
  label?: string;
  phoneNumber?: string; // اختياري - رقم هاتف لإرسال الرسالة إليه
  onSuccess?: () => void;
}

/**
 * مكون WhatsAppShare - زر مشاركة عبر واتساب
 * 
 * يوفر زر لمشاركة المحتوى عبر تطبيق واتساب
 * مع دعم إضافة رقم هاتف محدد أو مشاركة عامة
 */
const WhatsAppShare: React.FC<WhatsAppShareProps> = ({
  url,
  message = 'شاهد هذا المحتوى الرائع',
  className,
  variant = 'default',
  size = 'default',
  children,
  showLabel = true,
  label = 'مشاركة عبر واتساب',
  phoneNumber,
  onSuccess
}) => {
  // إنشاء رابط واتساب
  const generateWhatsAppLink = (): string => {
    const encodedMessage = encodeURIComponent(`${message} ${url}`);
    
    if (phoneNumber) {
      // تنسيق رقم الهاتف بإزالة أي رموز أو مسافات
      const formattedNumber = phoneNumber.replace(/[^0-9]/g, '');
      return `https://wa.me/${formattedNumber}?text=${encodedMessage}`;
    }
    
    // رابط مشاركة عام بدون رقم محدد
    return `https://wa.me/?text=${encodedMessage}`;
  };
  
  // معالجة المشاركة
  const handleShare = () => {
    const link = generateWhatsAppLink();
    window.open(link, '_blank');
    
    if (onSuccess) {
      onSuccess();
    }
  };
  
  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleShare}
      className={cn(
        "whatsapp-share-button",
        variant === 'default' && !children && "bg-[#25D366] hover:bg-[#128C7E] text-white",
        className
      )}
    >
      {children || (
        <>
          <WhatsApp className="h-4 w-4 mr-2" />
          {showLabel && <span>{label}</span>}
        </>
      )}
    </Button>
  );
};

export default WhatsAppShare;