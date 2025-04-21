import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Zap, X, ExternalLink } from "lucide-react";

interface CDNInfoBannerProps {
  cdnProvider?: string;
  isVisible?: boolean;
  onClose?: () => void;
  className?: string;
}

/**
 * شريط معلومات CDN
 * يظهر معلومات حول استخدام CDN في التطبيق
 */
export function CDNInfoBanner({
  cdnProvider = "Cloudflare",
  isVisible = true,
  onClose,
  className,
}: CDNInfoBannerProps) {
  const [visible, setVisible] = useState(isVisible);
  
  if (!visible) return null;
  
  const handleClose = () => {
    setVisible(false);
    if (onClose) onClose();
    
    // احفظ حالة الإغلاق في localStorage لتذكر تفضيل المستخدم
    localStorage.setItem('cdn_banner_closed', 'true');
  };
  
  return (
    <Alert
      className={`bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800 ${className}`}
    >
      <div className="flex items-start gap-3">
        <Zap className="h-5 w-5 text-blue-500 mt-0.5" />
        <div className="flex-1">
          <AlertTitle className="text-blue-700 dark:text-blue-300 flex items-center gap-2">
            المحتوى يُخدم عبر {cdnProvider} CDN
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
              جديد
            </span>
          </AlertTitle>
          <AlertDescription className="text-blue-600 dark:text-blue-400 mt-1">
            نستخدم شبكة توصيل المحتوى لتسريع تحميل الصور والملفات في تطبيقنا، مما يحسن تجربة المستخدم ويقلل وقت التحميل.
            <Button
              variant="link"
              size="sm"
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-0 h-auto font-normal"
              onClick={() => window.open('https://developers.cloudflare.com/cdn/', '_blank')}
            >
              <span>تعرف على المزيد</span>
              <ExternalLink className="h-3 w-3 mr-1" />
            </Button>
          </AlertDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-full"
          onClick={handleClose}
        >
          <X className="h-4 w-4 text-blue-500" />
          <span className="sr-only">إغلاق</span>
        </Button>
      </div>
    </Alert>
  );
}

/**
 * إعلام الأداء
 * يظهر معلومات حول تحسين الأداء باستخدام CDN
 */
export function PerformanceBanner({ className }: { className?: string }) {
  const [visible, setVisible] = useState(!localStorage.getItem('performance_banner_closed'));
  
  if (!visible) return null;
  
  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg p-4 ${className}`}
    >
      <div className="absolute top-0 right-0 mt-2 mr-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-white/80 hover:text-white hover:bg-white/10 rounded-full"
          onClick={() => {
            setVisible(false);
            localStorage.setItem('performance_banner_closed', 'true');
          }}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">إغلاق</span>
        </Button>
      </div>
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
          <Zap className="h-6 w-6 text-white" />
        </div>
        
        <div className="flex-1">
          <h3 className="font-bold text-lg">الآن أسرع بنسبة 60%</h3>
          <p className="text-white/80 mt-1">
            قمنا بتحسين سرعة تحميل الصفحات باستخدام شبكة CDN عالمية و تقنيات ضغط متقدمة.
            استمتع بتجربة أكثر سلاسة!
          </p>
        </div>
        
        <div className="mt-3 sm:mt-0">
          <Button
            variant="secondary"
            className="bg-white text-indigo-700 hover:bg-white/90 border-0"
            onClick={() => window.open('/about/performance', '_blank')}
          >
            اكتشف التفاصيل
          </Button>
        </div>
      </div>
    </div>
  );
}