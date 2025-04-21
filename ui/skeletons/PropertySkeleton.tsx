import { Skeleton } from "@/components/ui/skeleton";
import { useMobile } from "@/hooks/use-mobile";
import { Card } from "@/components/ui/card";

interface PropertySkeletonProps {
  /**
   * عدد العناصر الوهمية المراد عرضها
   */
  count?: number;
  
  /**
   * نوع التنسيق - شبكة أو قائمة
   */
  layout?: "grid" | "list";
  
  /**
   * فئات CSS إضافية
   */
  className?: string;
}

/**
 * مكون محسن يعرض نماذج تحميل للعقارات مع دعم للأجهزة المحمولة
 */
export function PropertySkeleton({ count = 4, layout = "grid", className = "" }: PropertySkeletonProps) {
  const isMobile = useMobile();
  
  // إنشاء مصفوفة بطول count لتكرار العناصر
  const items = Array(count).fill(null);
  
  // تنسيق الشبكة المتجاوبة
  const gridClasses = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6";
  
  // تنسيق القائمة
  const listClasses = "flex flex-col space-y-6";
  
  // اختيار التنسيق المناسب
  const containerClasses = layout === "grid" ? gridClasses : listClasses;
  
  // نماذج تحميل محسنة للأجهزة المحمولة
  if (isMobile) {
    return (
      <div className={`grid grid-cols-1 gap-6 ${className}`}>
        {items.map((_, index) => (
          <div key={index} className="animate-pulse space-y-3">
            {/* صورة العقار */}
            <div className="relative rounded-lg overflow-hidden">
              <Skeleton className="w-full aspect-[16/9]" />
              
              {/* مؤشر السعر */}
              <div className="absolute bottom-3 left-3">
                <Skeleton className="h-8 w-20 rounded-lg" />
              </div>
              
              {/* أزرار المفضلة والمشاركة */}
              <div className="absolute top-3 right-3 flex flex-col gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            </div>
            
            {/* معلومات العقار */}
            <div className="space-y-2">
              {/* التقييمات */}
              <div className="flex items-center gap-1.5">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-12" />
              </div>
              
              {/* العنوان */}
              <Skeleton className="h-6 w-4/5" />
              
              {/* الموقع */}
              <div className="flex items-center gap-1">
                <Skeleton className="h-3.5 w-3.5 rounded-full flex-shrink-0" />
                <Skeleton className="h-4 w-3/5" />
              </div>
              
              {/* المواصفات */}
              <div className="flex flex-wrap gap-3 py-1">
                <div className="flex items-center gap-1.5">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-8" />
                </div>
                
                <div className="flex items-center gap-1.5">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-8" />
                </div>
                
                <div className="flex items-center gap-1.5">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-8" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  // نماذج تحميل لأجهزة سطح المكتب
  return (
    <div className={`${containerClasses} ${className}`}>
      {items.map((_, index) => (
        <Card key={index} className="overflow-hidden animate-pulse transition-all">
          {/* صورة العقار */}
          <Skeleton className="w-full h-48" />
          
          {/* محتوى العقار */}
          <div className="p-4 space-y-3">
            {/* العنوان والسعر */}
            <div className="flex justify-between items-start">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-5 w-1/5" />
            </div>
            
            {/* الموقع */}
            <Skeleton className="h-4 w-1/2" />
            
            {/* المواصفات (غرف، حمامات، إلخ) */}
            <div className="flex justify-between pt-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-1/4" />
            </div>
            
            {/* التقييم */}
            <div className="flex items-center justify-between pt-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-10 w-24 rounded-md mt-2" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}