import React, { useState } from 'react';
import {
  Share2, 
  Copy, 
  Check, 
  Twitter, 
  Facebook, 
  Mail, 
  Linkedin, 
  WhatsApp, 
  MessageCircle,
  ArrowRight,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SocialShareProps {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  className?: string;
  platforms?: Array<'facebook' | 'twitter' | 'linkedin' | 'whatsapp' | 'email' | 'telegram'>;
  compact?: boolean;
  position?: 'top' | 'bottom' | 'left' | 'right';
  allowCopy?: boolean;
  onShare?: (platform: string) => void;
}

/**
 * مكون SocialShare - للمشاركة على منصات التواصل الاجتماعي
 * 
 * يتيح للمستخدمين مشاركة المحتوى على منصات التواصل الاجتماعي المختلفة
 * مع دعم لواجهات مختلفة (موسعة أو مدمجة)
 */
const SocialShare: React.FC<SocialShareProps> = ({
  url,
  title = 'شارك هذا المحتوى',
  description = 'شارك هذا المحتوى مع أصدقائك',
  image,
  className,
  platforms = ['facebook', 'twitter', 'linkedin', 'whatsapp', 'email', 'telegram'],
  compact = false,
  position = 'bottom',
  allowCopy = true,
  onShare
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  // معالجة النسخ إلى الحافظة
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      
      toast({
        title: "تم النسخ",
        description: "تم نسخ الرابط إلى الحافظة",
      });
      
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

  // توليد روابط المشاركة
  const generateShareLink = (platform: string): string => {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    const encodedDescription = encodeURIComponent(description);
    
    switch (platform) {
      case 'facebook':
        return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
      case 'twitter':
        return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
      case 'linkedin':
        return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
      case 'whatsapp':
        return `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`;
      case 'email':
        return `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`;
      case 'telegram':
        return `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`;
      default:
        return '#';
    }
  };

  // عند النقر على أيقونة المشاركة
  const handleShare = (e: React.MouseEvent, platform: string) => {
    e.preventDefault();
    
    // محاولة استخدام واجهة Web Share API إذا كانت متوفرة
    if (platform === 'native' && navigator.share) {
      navigator.share({
        title,
        text: description,
        url,
      })
      .then(() => {
        if (onShare) onShare('native');
      })
      .catch(console.error);
      return;
    }
    
    // خلاف ذلك، فتح نافذة مشاركة تقليدية
    const shareLink = generateShareLink(platform);
    window.open(shareLink, '_blank', 'width=600,height=400');
    
    // استدعاء معالج المشاركة
    if (onShare) onShare(platform);
  };

  // تحديد الأيقونة حسب المنصة
  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'facebook':
        return <Facebook className="w-5 h-5" />;
      case 'twitter':
        return <Twitter className="w-5 h-5" />;
      case 'linkedin':
        return <Linkedin className="w-5 h-5" />;
      case 'whatsapp':
        return <WhatsApp className="w-5 h-5" />;
      case 'email':
        return <Mail className="w-5 h-5" />;
      case 'telegram':
        return <MessageCircle className="w-5 h-5" />;
      default:
        return <Share2 className="w-5 h-5" />;
    }
  };

  // تحديد اسم المنصة بالعربية
  const getPlatformName = (platform: string) => {
    switch (platform) {
      case 'facebook':
        return 'فيسبوك';
      case 'twitter':
        return 'تويتر';
      case 'linkedin':
        return 'لينكد إن';
      case 'whatsapp':
        return 'واتساب';
      case 'email':
        return 'البريد الإلكتروني';
      case 'telegram':
        return 'تيليجرام';
      default:
        return 'مشاركة';
    }
  };

  // التحقق من توافق واجهة Web Share API
  const webShareAvailable = typeof navigator !== 'undefined' && navigator.share;
  
  // تحديد فئات CSS حسب الموضع
  const positionClass = {
    top: 'top-0 left-1/2 -translate-x-1/2 -translate-y-full',
    bottom: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-full',
    left: 'left-0 top-1/2 -translate-x-full -translate-y-1/2',
    right: 'right-0 top-1/2 translate-x-full -translate-y-1/2'
  }[position];
  
  // تحديد أنيميشن الظهور حسب الموضع
  const positionAnimation = {
    top: { y: '-100%' },
    bottom: { y: '100%' },
    left: { x: '-100%' },
    right: { x: '100%' }
  }[position];
  
  // عرض النسخة المدمجة
  if (compact) {
    return (
      <div className={cn("relative", className)}>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 rounded-full"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="مشاركة"
        >
          <Share2 className="h-4 w-4" />
          <span>مشاركة</span>
        </Button>
        
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={positionAnimation}
              animate={{ x: 0, y: 0 }}
              exit={positionAnimation}
              transition={{ type: 'spring', damping: 25, stiffness: 500 }}
              className={cn(
                "absolute z-50 bg-card border border-border rounded-lg shadow-md p-2",
                "flex gap-2 items-center mt-2",
                positionClass
              )}
            >
              {allowCopy && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                  className="rounded-full w-9 h-9"
                  aria-label="نسخ الرابط"
                >
                  {isCopied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              )}
              
              {platforms.map((platform) => (
                <Button
                  key={platform}
                  variant="outline"
                  size="icon"
                  className="rounded-full w-9 h-9"
                  onClick={(e) => handleShare(e, platform)}
                  aria-label={`مشاركة على ${getPlatformName(platform)}`}
                >
                  {getPlatformIcon(platform)}
                </Button>
              ))}
              
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full w-7 h-7 absolute -top-2 -right-2 bg-background shadow-sm"
                onClick={() => setIsOpen(false)}
                aria-label="إغلاق"
              >
                <X className="h-3 w-3" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
  
  // عرض النسخة الموسعة
  return (
    <div className={cn("share-options", className)}>
      <div className="flex flex-col space-y-4">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          {title}
        </h3>
        
        {webShareAvailable && (
          <Button 
            variant="default" 
            onClick={(e) => handleShare(e, 'native')}
            className="w-full flex items-center justify-center gap-2"
          >
            <Share2 className="h-5 w-5" />
            <span>مشاركة سريعة</span>
            <ArrowRight className="h-5 w-5 mr-auto" />
          </Button>
        )}
        
        <div className="flex flex-wrap gap-2">
          {platforms.map((platform) => (
            <Button
              key={platform}
              variant="outline"
              className="flex-1 min-w-[120px] flex items-center gap-2"
              onClick={(e) => handleShare(e, platform)}
            >
              {getPlatformIcon(platform)}
              <span>{getPlatformName(platform)}</span>
            </Button>
          ))}
        </div>
        
        {allowCopy && (
          <div className="pt-2 border-t border-border">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={url}
                readOnly
                className="flex-1 px-3 py-2 bg-background border border-border rounded-md text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="flex-shrink-0"
              >
                {isCopied ? (
                  <>
                    <Check className="mr-1 h-4 w-4 text-green-500" />
                    <span>تم النسخ</span>
                  </>
                ) : (
                  <>
                    <Copy className="mr-1 h-4 w-4" />
                    <span>نسخ الرابط</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SocialShare;