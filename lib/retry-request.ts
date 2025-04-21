/**
 * استراتيجية إعادة المحاولة
 * توفر آلية لإعادة محاولة الطلبات الفاشلة باستخدام استراتيجية التراجع الأسي
 * تستخدم في ApiErrorBoundary ونظام إدارة الأخطاء
 */

// استيراد الاعتمادات الإضافية لدعم Axios
import axios from 'axios';

/**
 * واجهة استراتيجية إعادة المحاولة
 */
export interface RetryStrategy {
  shouldRetry(): boolean;
  getNextDelayMs(): number;
  getCurrentAttempt(): number;
  reset(): void;
}

/**
 * إنشاء استراتيجية إعادة المحاولة بتراجع أسي
 * 
 * @param maxRetries العدد الأقصى لمحاولات إعادة المحاولة
 * @param initialDelayMs فترة التأخير الأولية بالمللي ثانية
 * @param maxDelayMs فترة التأخير القصوى بالمللي ثانية
 * @param backoffFactor عامل التراجع لزيادة فترة التأخير
 * @returns كائن استراتيجية إعادة المحاولة
 */
export function createRetryStrategy(
  maxRetries: number = 3,
  initialDelayMs: number = 1000,
  maxDelayMs: number = 30000,
  backoffFactor: number = 2
): RetryStrategy {
  let attempts = 0;
  let currentDelay = initialDelayMs;
  
  return {
    /**
     * تحديد ما إذا كان يجب إعادة المحاولة بناءً على عدد المحاولات الحالية
     */
    shouldRetry(): boolean {
      return attempts < maxRetries;
    },
    
    /**
     * الحصول على فترة التأخير التالية مع تطبيق التراجع الأسي
     */
    getNextDelayMs(): number {
      attempts++;
      
      // حساب التأخير الجديد باستخدام استراتيجية التراجع الأسي
      // مع إضافة عشوائية بسيطة (jitter) لمنع تزامن إعادة المحاولات
      const jitter = Math.random() * 0.2 + 0.9; // 0.9-1.1 للعشوائية
      
      // حساب التأخير مع تطبيق عامل التراجع
      currentDelay = Math.min(currentDelay * backoffFactor * jitter, maxDelayMs);
      
      return currentDelay;
    },
    
    /**
     * الحصول على رقم المحاولة الحالية
     */
    getCurrentAttempt(): number {
      return attempts;
    },
    
    /**
     * إعادة تعيين استراتيجية إعادة المحاولة
     */
    reset(): void {
      attempts = 0;
      currentDelay = initialDelayMs;
    }
  };
}

/**
 * وظيفة مساعدة للانتظار لفترة محددة
 * 
 * @param ms وقت الانتظار بالمللي ثانية
 * @returns Promise يتم حله بعد فترة الانتظار المحددة
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * تنفيذ إعادة المحاولة مع التراجع الأسي
 * 
 * @param fn الوظيفة المراد تنفيذها مع إعادة المحاولة
 * @param maxRetries العدد الأقصى لمحاولات إعادة المحاولة
 * @param initialDelayMs فترة التأخير الأولية بالمللي ثانية
 * @param maxDelayMs فترة التأخير القصوى بالمللي ثانية
 * @param shouldRetry وظيفة تحديد ما إذا كان يجب إعادة المحاولة بناءً على الخطأ
 * @returns Promise بنتيجة الوظيفة
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelayMs: number = 1000,
  maxDelayMs: number = 30000,
  shouldRetry: (error: any) => boolean = () => true
): Promise<T> {
  const retryStrategy = createRetryStrategy(maxRetries, initialDelayMs, maxDelayMs);
  
  let lastError: any;
  
  while (true) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // التحقق مما إذا كان يجب إعادة المحاولة بناءً على نوع الخطأ
      if (!shouldRetry(error) || !retryStrategy.shouldRetry()) {
        break;
      }
      
      // الحصول على فترة التأخير التالية والانتظار
      const delayMs = retryStrategy.getNextDelayMs();
      console.log(`Retrying request (attempt ${retryStrategy.getCurrentAttempt()}/${maxRetries}) after ${delayMs}ms`);
      
      await delay(delayMs);
    }
  }
  
  // إذا وصلنا إلى هنا، فهذا يعني أن جميع المحاولات فشلت
  throw lastError;
}

/**
 * إعداد إعادة المحاولة لمكتبة Axios
 * 
 * @param retries عدد مرات إعادة المحاولة
 * @param statusCodesToRetry قائمة أكواد HTTP التي يجب إعادة المحاولة معها
 * @param delayMs فترة التأخير الأولية بالمللي ثانية
 * @param maxDelayMs فترة التأخير القصوى بالمللي ثانية
 * @param backoffFactor عامل التراجع لزيادة فترة التأخير
 */
export function setupAxiosRetry(
  retries: number = 3,
  statusCodesToRetry: number[] = [408, 500, 502, 503, 504],
  delayMs: number = 1000,
  maxDelayMs: number = 30000,
  backoffFactor: number = 2
): void {
  // تحقق من وجود الاعتماد axios
  if (!axios) {
    console.error('Axios is required for setupAxiosRetry');
    return;
  }
  
  // إنشاء معترض الطلب
  axios.interceptors.response.use(
    (response) => response, 
    async (error) => {
      // الحصول على تكوين الطلب الأصلي
      const config = error.config;
      
      // إذا لم يتم تعيين عدد المحاولات بعد، قم بتعيينه
      if (!config || !config.url) {
        return Promise.reject(error);
      }
      
      // تهيئة عداد المحاولة
      config.__retryCount = config.__retryCount || 0;
      
      // التحقق مما إذا كان يجب إعادة المحاولة
      const shouldRetry = 
        config.__retryCount < retries && 
        (error.code === 'ECONNABORTED' || // انتهت مهلة الاتصال
         !error.response || // لا استجابة (مثل خطأ الاتصال)
         statusCodesToRetry.includes(error.response?.status)); // رمز استجابة قابل لإعادة المحاولة
      
      if (!shouldRetry) {
        return Promise.reject(error);
      }
      
      // زيادة عدد المحاولات
      config.__retryCount += 1;
      
      // حساب فترة التأخير باستخدام التراجع الأسي
      const retryDelay = Math.min(
        delayMs * Math.pow(backoffFactor, config.__retryCount - 1) * (0.9 + Math.random() * 0.2),
        maxDelayMs
      );
      
      // تسجيل المحاولة في بيئة التطوير
      if (import.meta.env.DEV) {
        console.log(`Retrying request to ${config.url} (attempt ${config.__retryCount}/${retries}) after ${retryDelay}ms`);
      }
      
      // انتظار قبل إعادة المحاولة
      await delay(retryDelay);
      
      // إعادة محاولة الطلب
      return axios(config);
    }
  );
}