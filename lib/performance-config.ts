/**
 * إعدادات تحسين الأداء المركزية
 * 
 * هذا الملف يحتوي على ثوابت وإعدادات مشتركة لتحسين أداء التطبيق
 * من خلال تحسين تحميل الصور، والتحميل الكسول، وتجزئة المهام الثقيلة
 */

// إعدادات التحميل الكسول
export const LAZY_LOAD_THRESHOLD = 300; // المسافة بالبكسل قبل الوصول للنافذة التي يبدأ عندها التحميل
export const COMPONENT_LOAD_DELAY = 50; // تأخير تحميل المكون بالمللي ثانية

// إعدادات تحسين الصور
export const IMAGE_OPTIMIZATION = {
  // الجودة الافتراضية للصور (0-100)
  DEFAULT_QUALITY: 80,
  
  // الأحجام المستجيبة للصور (بالبكسل)
  RESPONSIVE_SIZES: [320, 640, 768, 1024, 1280, 1536],
  
  // التنسيقات المفضلة للصور، مرتبة حسب الأفضلية
  PREFERRED_FORMATS: ['webp', 'avif', 'jpeg'],
  
  // حجم الصورة المصغرة (بالبكسل) للتحميل الأولي والتأثير الضبابي
  THUMBNAIL_SIZE: 16,
  
  // جودة الصورة المصغرة (0-100)
  THUMBNAIL_QUALITY: 30,
  
  // تمكين التعديل التلقائي للجودة بناءً على نوع الاتصال
  ADAPTIVE_QUALITY: true,
  
  // تمكين ذاكرة التخزين المؤقت للصور المحسّنة
  ENABLE_CACHE: true,
  
  // حجم الصور في الدفعات المختلفة (للتوازن بين الأداء وسرعة التحميل)
  BATCH_SIZES: {
    CRITICAL: 1024, // العناصر المهمة جداً
    ABOVE_FOLD: 768, // العناصر المرئية دون تمرير
    BELOW_FOLD: 640, // العناصر المرئية بعد التمرير
    BACKGROUND: 480, // العناصر الخلفية
  },
};

// أدوات مساعدة لتحسين الأداء
export class PerformanceUtils {
  /**
   * تنفيذ مهمة على مجموعة من العناصر بتقسيمها إلى دفعات
   * مفيد عند التعامل مع قوائم كبيرة من البيانات
   * 
   * @param items قائمة العناصر المراد معالجتها
   * @param processItemFn دالة لمعالجة كل عنصر
   * @param batchSize حجم الدفعة (عدد العناصر في كل مرة)
   * @returns قائمة العناصر بعد المعالجة
   */
  static chunkedTask<T, R>(
    items: T[],
    processItemFn: (item: T) => R,
    batchSize: number = 10
  ): R[] {
    const result: R[] = [];
    
    // معالجة الدفعة الأولى فورًا
    const firstBatch = items.slice(0, batchSize);
    for (let i = 0; i < firstBatch.length; i++) {
      result.push(processItemFn(firstBatch[i]));
    }
    
    // معالجة الدفعات المتبقية بشكل غير متزامن
    if (items.length > batchSize) {
      // تقسيم المعالجة بحيث لا تؤثر على تجربة المستخدم
      setTimeout(() => {
        for (let i = batchSize; i < items.length; i += batchSize) {
          const batch = items.slice(i, i + batchSize);
          const processBatch = () => {
            for (let j = 0; j < batch.length; j++) {
              const index = i + j;
              if (index < items.length) {
                result[index] = processItemFn(items[index]);
              }
            }
          };
          
          // جدولة الدفعة التالية بعد فترة قصيرة للسماح بتحديث واجهة المستخدم
          setTimeout(processBatch, 0);
        }
      }, 50);
    }
    
    return result;
  }
  
  /**
   * تأخير تنفيذ مهمة لتجنب حظر سلسلة العمليات الرئيسية
   * 
   * @param taskFn المهمة المراد تنفيذها
   * @param delay التأخير بالمللي ثانية
   * @returns وعد يتم حله بعد إكمال المهمة
   */
  static debounceTask<T>(
    taskFn: () => T,
    delay: number = 300
  ): Promise<T> {
    return new Promise((resolve) => {
      let timeout: ReturnType<typeof setTimeout> | undefined;
      
      if (timeout) {
        clearTimeout(timeout);
      }
      
      timeout = setTimeout(() => {
        resolve(taskFn());
      }, delay);
    });
  }
  
  /**
   * تجزئة مهمة كبيرة إلى أجزاء أصغر
   * 
   * @param items العناصر المراد معالجتها
   * @param taskFn دالة المعالجة
   * @returns وعد بنتائج المعالجة
   */
  static splitTask<T, R>(
    items: T[],
    taskFn: (item: T) => R
  ): Promise<R[]> {
    return new Promise((resolve) => {
      const results: R[] = Array(items.length);
      let index = 0;
      
      function processNextBatch() {
        // معالجة حتى 10 عناصر في كل دفعة
        const endIndex = Math.min(index + 10, items.length);
        
        for (let i = index; i < endIndex; i++) {
          results[i] = taskFn(items[i]);
        }
        
        index = endIndex;
        
        if (index < items.length) {
          // جدولة الدفعة التالية
          setTimeout(processNextBatch, 0);
        } else {
          // اكتملت جميع العناصر
          resolve(results);
        }
      }
      
      // بدء المعالجة
      processNextBatch();
    });
  }
}

// أدوات مساعدة لتحسين التعامل مع الاتصال
export class ConnectionUtils {
  /**
   * الحصول على نوع اتصال المستخدم إذا كان متاحًا
   * 
   * @returns نوع الاتصال أو 'unknown' إذا كان غير معروف
   */
  static getConnectionType(): 'slow-2g' | '2g' | '3g' | '4g' | 'unknown' {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const conn = (navigator as any).connection;
      if (conn && conn.effectiveType) {
        return conn.effectiveType as 'slow-2g' | '2g' | '3g' | '4g';
      }
    }
    return 'unknown';
  }
  
  /**
   * التحقق مما إذا كان المستخدم قد فعّل وضع توفير البيانات
   * 
   * @returns true إذا كان وضع توفير البيانات مفعّلًا
   */
  static isDataSaverEnabled(): boolean {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const conn = (navigator as any).connection;
      if (conn && 'saveData' in conn) {
        return !!conn.saveData;
      }
    }
    return false;
  }
  
  /**
   * تقدير عرض النطاق الترددي للمستخدم
   * 
   * @returns تقدير عرض النطاق الترددي بالميجابت في الثانية أو null إذا كان غير متوفر
   */
  static getEstimatedBandwidth(): number | null {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const conn = (navigator as any).connection;
      if (conn && 'downlink' in conn) {
        return conn.downlink;
      }
    }
    return null;
  }
  
  /**
   * التحقق مما إذا كان المستخدم على شبكة محلية (WiFi)
   * 
   * @returns true إذا كان المستخدم متصلاً عبر WiFi
   */
  static isOnWiFi(): boolean {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const conn = (navigator as any).connection;
      if (conn && 'type' in conn) {
        return conn.type === 'wifi';
      }
    }
    // افتراضيًا نفترض أن المستخدم يستخدم اتصالًا جيدًا
    return true;
  }
}