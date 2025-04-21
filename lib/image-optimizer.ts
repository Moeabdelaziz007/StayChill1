import { toast } from "@/hooks/use-toast";

// القيم الافتراضية لجودة الصور
export const IMAGE_QUALITY = 80;

/**
 * التحقق من الصورة وضغطها إذا لزم الأمر
 * @param file ملف الصورة المراد التحقق منه وتحسينه
 * @returns ملف الصورة بعد التحقق أو null إذا لم تمر عملية التحقق
 */
export const validateAndOptimizeImage = async (file: File): Promise<File | null> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const { width, height } = img;

      // التحقق من دقة الصورة
      if (width < 1280 || height < 720) {
        toast({
          title: "دقة الصورة منخفضة",
          description: `يجب أن تكون 1280×720 على الأقل. الحالية: ${width}×${height}`,
          variant: "warning",
        });
        resolve(null);
        return;
      }

      // ممكن استخدام مكتبة ضغط هنا لو الحجم فوق 2MB
      if (file.size > 2 * 1024 * 1024) {
        console.log("يفضل ضغط الصورة - الحجم كبير");
        // لاحقًا: إضافة دعم لـ browser-image-compression أو ما شابه
      }

      resolve(file);
    };

    img.onerror = () => {
      toast({
        title: "خطأ في الصورة",
        description: "تعذر تحميل الصورة للتحقق",
        variant: "destructive",
      });
      resolve(null);
    };

    img.src = URL.createObjectURL(file);
  });
};

/**
 * تحويل صورة إلى Base64 للعرض السريع
 * @param file ملف الصورة المراد تحويله
 * @returns سلسلة نصية تمثل الصورة بصيغة Base64
 */
export const imageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

/**
 * تحويل الصورة إلى صيغة WebP للحصول على كفاءة أفضل في حجم الصورة
 * هذا يتطلب دعم canvas في المتصفح
 * ملاحظة: هذه الدالة للتوضيح فقط، تحويل الصور يُفضل أن يتم على الخادم
 */
export const convertToWebP = async (file: File, quality = 0.8): Promise<Blob | null> => {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          resolve(null);
          return;
        }
        
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(blob => {
          if (blob) {
            resolve(blob);
          } else {
            resolve(null);
          }
        }, 'image/webp', quality);
      };
      
      img.onerror = () => {
        resolve(null);
      };
      
      img.src = URL.createObjectURL(file);
    } catch (error) {
      console.error('Error converting to WebP:', error);
      resolve(null);
    }
  });
};

/**
 * عرض معاينة للصورة قبل الرفع
 * @param file ملف الصورة المراد عرض معاينته
 * @param setPreview دالة لتعيين رابط المعاينة
 */
export const setImagePreview = (file: File, setPreview: (url: string) => void): void => {
  const url = URL.createObjectURL(file);
  setPreview(url);
  
  // تنظيف عنوان URL عند إلغاء تحميل الصفحة
  return () => URL.revokeObjectURL(url);
};

/**
 * توليد مجموعة من الصور بأحجام مختلفة للعرض المتجاوب
 * @param src مسار الصورة الأصلية
 * @returns قائمة بمسارات الصور بأحجام مختلفة
 */
export const generateSourceSet = (src: string): string => {
  // لا يمكن إنشاء srcset للروابط الخارجية
  if (src.startsWith('http') && !src.includes(window.location.hostname)) {
    return '';
  }
  
  // في الواقع، هذا يعتمد على وجود خدمة معالجة صور في الخادم
  // هنا نفترض استخدام معلمات محددة في عنوان URL لتحديد الحجم
  const sizes = [640, 768, 1024, 1280, 1536];
  return sizes.map(size => `${src}?w=${size} ${size}w`).join(', ');
};

/**
 * إنشاء نسخة منخفضة الجودة من الصورة لاستخدامها كـ placeholder
 * @param src مسار الصورة الأصلية
 * @returns مسار الصورة منخفضة الجودة
 */
export const getLowQualityPlaceholder = (src: string): string => {
  // هذه الوظيفة تفترض وجود خدمة معالجة صور في الخادم لإنشاء صور منخفضة الجودة
  // في التنفيذ الحقيقي سنستخدم خدمة مثل Cloudinary
  return `${src}?w=40&blur=10&q=30`;
};

/**
 * إنشاء صورة placeholder بلون محدد
 * @param color اللون المراد استخدامه (بصيغة HEX)
 * @returns سلسلة نصية لصورة Data URL
 */
export const createPlaceholderDataUrl = (color: string): string => {
  // إنشاء صورة شفافة صغيرة جداً بلون محدد
  const colorEncoded = color.replace('#', '');
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1' viewBox='0 0 1 1' fill='%23${colorEncoded}'%3E%3Crect width='1' height='1'/%3E%3C/svg%3E`;
};

/**
 * تحليل عنوان URL للصورة لمعرفة إذا كان داخلياً أو خارجياً
 * @param src مسار الصورة
 * @returns معلومات حول الصورة (هل هي خارجية، إلخ)
 */
export const parseImageUrl = (src: string): { isExternal: boolean, path: string } => {
  try {
    const url = new URL(src, window.location.origin);
    return {
      isExternal: url.origin !== window.location.origin,
      path: url.pathname
    };
  } catch (e) {
    // إذا فشل تحليل العنوان، نفترض أنه مسار داخلي
    return {
      isExternal: false,
      path: src
    };
  }
};

/**
 * اكتشاف تنسيقات الصور المدعومة في المتصفح
 * @returns كائن يحدد دعم كل تنسيق
 */
export const detectImageSupport = (): { webp: boolean, avif: boolean } => {
  // يمكن استخدام modernizr أو حلول أخرى أكثر دقة
  // هذا تنفيذ مبسط للتوضيح
  const support = {
    webp: false,
    avif: false
  };
  
  try {
    const canvas = document.createElement('canvas');
    if (canvas.toDataURL('image/webp').startsWith('data:image/webp')) {
      support.webp = true;
    }
    // اختبار دعم AVIF يحتاج إلى منهجية أخرى
    // هنا نستخدم قيمة افتراضية
    support.avif = false;
  } catch (e) {
    // تجاهل الأخطاء - ببساطة ارجع الدعم كـ false
  }
  
  return support;
};