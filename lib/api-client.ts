import axios from 'axios';
import { setupAxiosRetry } from './retry-request';
import { determineErrorType, getErrorMessage } from '@/components/ui/network-error-types';

/**
 * يقوم بإعداد عميل Axios مع تكوين الطلبات وإعادة المحاولة 
 * والتعامل مع الأخطاء العامة
 */
export const setupApiClient = () => {
  // تكوين عميل Axios الافتراضي
  axios.defaults.baseURL = '/api';
  axios.defaults.timeout = 30000; // 30 ثانية
  axios.defaults.headers.common['Accept'] = 'application/json';
  axios.defaults.headers.post['Content-Type'] = 'application/json';
  
  // تكوين نظام إعادة المحاولة (3 محاولات بحد أقصى)
  setupAxiosRetry(3, [408, 500, 502, 503, 504]);
  
  // تحديد نوع الخطأ ورسالته في متغير عام
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      // إضافة معلومات عن الخطأ لاستخدامها لاحقًا
      if (!error.config?._suppressGlobalErrorHandling) {
        const errorType = determineErrorType(error);
        const errorMessage = getErrorMessage(error);
        
        // تخزين معلومات الخطأ في كائن الخطأ نفسه للاستخدام في مكونات العرض
        error.errorType = errorType;
        error.errorMessage = errorMessage;
        
        // تسجيل الخطأ في وحدة التحكم في بيئة التطوير
        if (import.meta.env.DEV) {
          console.error(`[Network Error] ${errorType}: ${errorMessage}`, error);
        }
      }
      
      return Promise.reject(error);
    }
  );
  
  return {
    // يمكن إضافة المزيد من الوظائف هنا إذا لزم الأمر
  };
};

/**
 * إضافة خاصية لكائن التكوين لإيقاف عرض رسائل الخطأ العامة
 * مفيد عندما تريد معالجة أخطاء معينة بطريقة مخصصة
 */
export const suppressGlobalErrorHandling = (config: any = {}) => {
  return {
    ...config,
    _suppressGlobalErrorHandling: true,
  };
};

/**
 * تحديد ما إذا كان ينبغي إظهار رسالة خطأ للمستخدم بناءً على نوع الخطأ
 */
export const shouldShowErrorToast = (error: any): boolean => {
  // لا تظهر أخطاء المصادقة 401 لأنها غالبًا ما تظهر عند بدء التطبيق
  if (error.response?.status === 401 && window.location.pathname !== '/login') {
    return false;
  }
  
  // تجاهل الأخطاء التي تم تعيينها من قبل المطور
  if (error.config?._suppressGlobalErrorHandling) {
    return false;
  }
  
  return true;
};

export default setupApiClient;