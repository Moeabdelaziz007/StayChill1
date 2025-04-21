import React, { useState } from 'react';
import { Copy, Check, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import WebShareButton from './web-share-button';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface DynamicShareProps {
  url: string;
  title?: string;
  text?: string;
  className?: string;
  buttonVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  buttonSize?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
  label?: string;
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
  showCopy?: boolean;
  onSuccess?: () => void;
}

/**
 * مكون DynamicShare - مكون مشاركة ديناميكي
 * 
 * يوفر زر مشاركة مع خيار نسخ الرابط
 * ويستخدم Web Share API إن كانت متوفرة أو يعرض واجهة مشاركة بديلة
 */
const DynamicShare: React.FC<DynamicShareProps> = ({
  url,
  title = 'مشاركة',
  text = 'شاهد هذا المحتوى الرائع',
  className,
  buttonVariant = 'outline',
  buttonSize = 'default',
  showLabel = true,
  label = 'مشاركة',
  tooltipPosition = 'top',
  showCopy = true,
  onSuccess
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  
  // معالجة نسخ الرابط
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      
      toast({
        title: "تم النسخ",
        description: "تم نسخ الرابط إلى الحافظة",
      });
      
      if (onSuccess) onSuccess();
      
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (error) {
      console.error('فشل نسخ الرابط:', error);
      
      toast({
        title: "فشل النسخ",
        description: "حدث خطأ أثناء محاولة نسخ الرابط",
        variant: "destructive",
      });
    }
  };
  
  // تحديد فئات CSS لموضع التلميح
  const tooltipClass = {
    top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
    left: 'right-full mr-2 top-1/2 -translate-y-1/2',
    right: 'left-full ml-2 top-1/2 -translate-y-1/2'
  }[tooltipPosition];
  
  return (
    <div className={cn("share-container relative flex gap-2", className)}>
      {showCopy && (
        <Button
          variant={buttonVariant}
          size={buttonSize}
          onClick={handleCopy}
          className="relative flex items-center gap-1"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onFocus={() => setShowTooltip(true)}
          onBlur={() => setShowTooltip(false)}
        >
          {isCopied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          {showLabel && <span>{isCopied ? 'تم النسخ' : 'نسخ الرابط'}</span>}
          
          <AnimatePresence>
            {showTooltip && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                className={cn(
                  "absolute z-50 bg-black/90 text-white text-xs py-1 px-2 rounded whitespace-nowrap",
                  tooltipClass
                )}
              >
                {isCopied ? 'تم نسخ الرابط!' : 'نسخ الرابط'}
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      )}
      
      <WebShareButton
        url={url}
        title={title}
        text={text}
        variant={buttonVariant}
        size={buttonSize}
        onSuccess={onSuccess}
        className="relative flex items-center gap-1"
      >
        <Share className="h-4 w-4" />
        {showLabel && <span>{label}</span>}
      </WebShareButton>
    </div>
  );
};

export default DynamicShare;