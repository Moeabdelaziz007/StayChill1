import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * تنسيق رقم كعملة بتنسيق مناسب
 * @param amount المبلغ المراد تنسيقه
 * @param currency رمز العملة (الافتراضي: USD)
 * @param locale اللغة المستخدمة للتنسيق (الافتراضي: ar-EG)
 * @returns النص المنسق كعملة
 */
export function formatCurrency(
  amount: number,
  currency: string = 'EGP',
  locale: string = 'ar-EG'
): string {
  // خيارات تنسيق العملة
  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  };
  
  // استخدام Intl.NumberFormat للحصول على تنسيق دولي صحيح
  const formatter = new Intl.NumberFormat(locale, options);
  return formatter.format(amount);
}

/**
 * حساب وقت القراءة التقديري للنص
 * @param text النص المراد حساب وقت قراءته
 * @param wordsPerMinute متوسط الكلمات في الدقيقة (افتراضي: 200)
 * @returns وقت القراءة التقديري بالدقائق
 */
export function calculateReadingTime(text: string, wordsPerMinute: number = 200): number {
  const wordCount = text.trim().split(/\s+/).length;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  return readingTimeMinutes;
}

/**
 * اختصار النص إلى طول محدد مع إضافة علامة القطع
 * @param text النص المراد اختصاره
 * @param maxLength الحد الأقصى لطول النص
 * @param suffix علامة القطع (افتراضي: "...")
 * @returns النص المختصر
 */
export function truncateText(text: string, maxLength: number, suffix: string = '...'): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * تحويل تاريخ إلى نص منسق
 * @param date التاريخ المراد تنسيقه
 * @param locale اللغة المستخدمة للتنسيق
 * @param options خيارات التنسيق
 * @returns التاريخ المنسق كنص
 */
export function formatDate(
  date: Date | string | number,
  locale: string = 'ar-EG',
  options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }
): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat(locale, options).format(dateObj);
}

/**
 * إنشاء مفتاح فريد للعنصر في القائمة
 * @param prefix بادئة المفتاح
 * @param id معرف العنصر
 * @returns المفتاح الفريد
 */
export function createKey(prefix: string, id: string | number): string {
  return `${prefix}-${id}`;
}

/**
 * تأخير التنفيذ لوقت محدد
 * @param ms وقت التأخير بالميلي ثانية
 * @returns وعد يتم حله بعد انقضاء المدة
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * تنفيذ استعلام محسن مع إعادة المحاولة وتأخير
 * @param fn الدالة التي سيتم تنفيذها
 * @param retries عدد مرات إعادة المحاولة
 * @param retryDelay وقت التأخير قبل إعادة المحاولة
 * @returns نتيجة تنفيذ الدالة
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  retryDelay: number = 300
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    
    // تأخير متزايد قبل إعادة المحاولة
    await delay(retryDelay);
    
    // إعادة المحاولة بتأخير مضاعف
    return retryWithBackoff(fn, retries - 1, retryDelay * 2);
  }
}
