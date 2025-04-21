import { useState, useEffect } from "react";

/**
 * هوك لتتبع مطابقة استعلام الوسائط
 * @param query استعلام وسائط CSS
 * @returns سواء كان استعلام الوسائط يتطابق مع حجم النافذة الحالي
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    // البداية بالقيمة الصحيحة على جانب العميل
    if (typeof window !== "undefined") {
      return window.matchMedia(query).matches;
    }
    // العودة بقيمة افتراضية على جانب الخادم
    return false;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia(query);
    
    // تحديث الحالة عند تغيير مطابقة الاستعلام
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };
    
    // استماع للتغييرات
    mediaQuery.addEventListener("change", listener);
    
    // تنظيف عند إلغاء التثبيت
    return () => {
      mediaQuery.removeEventListener("change", listener);
    };
  }, [query]);

  return matches;
}

/**
 * هوك مبسط للتحقق مما إذا كانت الشاشة الحالية هي شاشة جوال
 * @returns سواء كانت الشاشة الحالية هي شاشة جوال (أقل من 768 بكسل)
 */
export function useMobileScreen(): boolean {
  return useMediaQuery("(max-width: 767.98px)");
}

/**
 * هوك مبسط للتحقق مما إذا كانت الشاشة الحالية هي شاشة كمبيوتر لوحي
 * @returns سواء كانت الشاشة الحالية هي شاشة كمبيوتر لوحي (768px - 1023.98px)
 */
export function useTabletScreen(): boolean {
  return useMediaQuery("(min-width: 768px) and (max-width: 1023.98px)");
}

/**
 * هوك مبسط للتحقق مما إذا كانت الشاشة الحالية هي شاشة سطح مكتب
 * @returns سواء كانت الشاشة الحالية هي شاشة سطح مكتب (أكبر من 1024 بكسل)
 */
export function useDesktopScreen(): boolean {
  return useMediaQuery("(min-width: 1024px)");
}

export default useMediaQuery;