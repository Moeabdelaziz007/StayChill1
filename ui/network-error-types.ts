/**
 * أنواع أخطاء الشبكة المدعومة في النظام
 */
export type NetworkErrorType = 
  | 'connection'   // خطأ في اتصال الشبكة
  | 'server'       // خطأ في الخادم (500s)
  | 'request'      // خطأ في الطلب (400s غير المصادقة)
  | 'unauthorized' // خطأ مصادقة (401, 403)
  | 'timeout'      // انتهاء مهلة الطلب
  | 'unknown';     // خطأ غير معروف

/**
 * تحديد نوع الخطأ بناءً على كائن الخطأ الذي تم رميه
 * 
 * @param error كائن الخطأ الذي تم استلامه
 * @returns نوع الخطأ المناسب
 */
export function determineErrorType(error: any): NetworkErrorType {
  // إذا كان الخطأ يحتوي بالفعل على نوع الخطأ، استخدمه
  if (error.errorType && typeof error.errorType === 'string') {
    return error.errorType as NetworkErrorType;
  }

  // في حالة وجود axios أو عنصر response
  if (error.response) {
    const status = error.response.status;
    
    // أخطاء المصادقة
    if (status === 401 || status === 403) {
      return 'unauthorized';
    }
    
    // أخطاء طلب العميل
    if (status >= 400 && status < 500) {
      return 'request';
    }
    
    // أخطاء الخادم
    if (status >= 500) {
      return 'server';
    }
  }
  
  // في حالة ابورت أو إلغاء الطلب
  if (error.code === 'ECONNABORTED' || error.name === 'AbortError' || error.name === 'TimeoutError') {
    return 'timeout';
  }
  
  // في حالة عدم وجود استجابة من الخادم (مشكلة اتصال محتملة)
  if (error.message && (
      error.message.includes('Network Error') ||
      error.message.includes('Failed to fetch') ||
      error.message.includes('NetworkError')
    )) {
    return 'connection';
  }
  
  // في حالة عدم القدرة على تحديد نوع الخطأ
  return 'unknown';
}

/**
 * الحصول على رسالة خطأ مناسبة لنوع الخطأ
 * 
 * @param error كائن الخطأ الأصلي، يمكن استخدامه للحصول على تفاصيل إضافية
 * @returns رسالة الخطأ
 */
export function getErrorMessage(error: any): string {
  // إذا كان الخطأ يحتوي بالفعل على رسالة خطأ مخصصة، استخدمها
  if (error.errorMessage && typeof error.errorMessage === 'string') {
    return error.errorMessage;
  }
  
  // إذا كان الخطأ من axios وله رسالة خطأ من الخادم
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  // إذا كان الخطأ من fetch ويحتوي على رسالة
  if (error.data?.message) {
    return error.data.message;
  }
  
  // في حالة وجود رسالة خطأ قياسية فقط
  if (error.message && typeof error.message === 'string') {
    return error.message;
  }
  
  // الحصول على رسالة خطأ افتراضية بناءً على نوع الخطأ
  const errorType = determineErrorType(error);
  return getDefaultErrorMessage(errorType);
}

/**
 * رسائل الخطأ الافتراضية بالعربية لكل نوع من أنواع الأخطاء
 * 
 * @param type نوع الخطأ
 * @returns رسالة خطأ افتراضية
 */
export function getDefaultErrorMessage(type: NetworkErrorType): string {
  switch (type) {
    case 'connection':
      return 'لا يمكن الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت.';
    case 'server':
      return 'حدث خطأ في الخادم. يرجى المحاولة مرة أخرى لاحقًا.';
    case 'request':
      return 'لا يمكن معالجة طلبك. يرجى التحقق من المعلومات المدخلة.';
    case 'unauthorized':
      return 'غير مصرح لك بالوصول إلى هذا المحتوى. يرجى تسجيل الدخول مرة أخرى.';
    case 'timeout':
      return 'انتهت مهلة الطلب. يرجى المحاولة مرة أخرى.';
    case 'unknown':
    default:
      return 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى لاحقًا.';
  }
}