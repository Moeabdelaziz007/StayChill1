import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface WebShareButtonProps {
  url: string;
  title?: string;
  text?: string;
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children?: React.ReactNode;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

/**
 * مكون WebShareButton - زر مشاركة يستخدم واجهة Web Share API
 * 
 * يوفر واجهة مستخدم مبسطة لمشاركة المحتوى باستخدام واجهة المشاركة الأصلية للمتصفح
 * مع التحقق من دعم المتصفح لهذه الميزة
 */
const WebShareButton: React.FC<WebShareButtonProps> = ({
  url,
  title = 'مشاركة',
  text = 'شاهد هذا المحتوى الرائع',
  className,
  variant = 'outline',
  size = 'default',
  children,
  onSuccess,
  onError
}) => {
  const [isShareSupported, setIsShareSupported] = useState(false);
  
  // التحقق من دعم المتصفح لواجهة Web Share API
  useEffect(() => {
    setIsShareSupported(typeof navigator !== 'undefined' && !!navigator.share);
  }, []);
  
  // معالجة المشاركة
  const handleShare = async () => {
    if (!isShareSupported) {
      toast({
        title: "المشاركة غير مدعومة",
        description: "متصفحك لا يدعم ميزة المشاركة المباشرة",
        variant: "destructive"
      });
      
      // نسخ الرابط كبديل
      try {
        await navigator.clipboard.writeText(url);
        toast({
          title: "تم نسخ الرابط",
          description: "تم نسخ الرابط إلى الحافظة بنجاح"
        });
      } catch (error) {
        console.error('فشل نسخ الرابط:', error);
      }
      
      if (onError) onError(new Error('المشاركة غير مدعومة'));
      return;
    }
    
    try {
      await navigator.share({
        title,
        text,
        url
      });
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('فشل المشاركة:', error);
      
      // تجاهل الأخطاء الناتجة عن إلغاء المستخدم للمشاركة
      if (error.name !== 'AbortError') {
        toast({
          title: "فشل المشاركة",
          description: "حدث خطأ أثناء محاولة المشاركة، يرجى المحاولة مرة أخرى",
          variant: "destructive"
        });
        
        if (onError) onError(error);
      }
    }
  };
  
  // إخفاء الزر إذا كانت المشاركة غير مدعومة ولم يتم توفير محتوى مخصص
  if (!isShareSupported && !children) {
    return null;
  }
  
  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleShare}
      className={cn(className)}
      disabled={!isShareSupported && !navigator.clipboard}
    >
      {children || (
        <>
          <Share2 className="mr-2 h-4 w-4" />
          <span>مشاركة</span>
        </>
      )}
    </Button>
  );
};

export default WebShareButton;