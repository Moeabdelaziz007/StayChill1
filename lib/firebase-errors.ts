import { FirebaseError } from 'firebase/app';
import { 
  AuthErrorCodes, 
  MultiFactorResolver
} from 'firebase/auth';

/**
 * نوع أخطاء Firebase المتعلقة بالمصادقة والتحقق بخطوتين
 */
export enum AuthErrorType {
  // أخطاء تسجيل الدخول/التسجيل العادية
  INVALID_CREDENTIALS = 'invalid_credentials',
  USER_NOT_FOUND = 'user_not_found',
  EMAIL_ALREADY_EXISTS = 'email_already_exists',
  WEAK_PASSWORD = 'weak_password',
  USER_DISABLED = 'user_disabled',
  TOO_MANY_REQUESTS = 'too_many_requests',
  NETWORK_ERROR = 'network_error',
  
  // أخطاء متعلقة بالتحقق بخطوتين
  MFA_REQUIRED = 'mfa_required',
  
  // أخطاء أخرى
  POPUP_CLOSED = 'popup_closed',
  POPUP_BLOCKED = 'popup_blocked',
  EXPIRED_TOKEN = 'expired_token',
  CAPTCHA_CHECK_FAILED = 'captcha_check_failed',
  OTHER = 'other'
}

/**
 * واجهة نتيجة معالجة أخطاء المصادقة
 */
export interface AuthErrorResult {
  type: AuthErrorType;
  message: string;
  resolver?: MultiFactorResolver; // مطلوب للتعامل مع التحقق بخطوتين
  originalError: Error;
}

/**
 * تحويل أخطاء Firebase إلى أخطاء مصادقة مبسطة
 * @param error خطأ Firebase أو أي خطأ آخر
 * @returns نتيجة معالجة الخطأ
 */
export function handleAuthError(error: any): AuthErrorResult {
  // التحقق إذا كان الخطأ هو خطأ Firebase
  if (error instanceof FirebaseError) {
    // التحقق إذا كان الخطأ هو خطأ التحقق بخطوتين
    if (error.code === 'auth/multi-factor-auth-required') {
      return {
        type: AuthErrorType.MFA_REQUIRED,
        message: 'المصادقة ثنائية العوامل مطلوبة للمتابعة',
        resolver: error.customData?.resolver,
        originalError: error
      };
    }
    
    // معالجة أخطاء المصادقة الأخرى
    switch (error.code) {
      case AuthErrorCodes.INVALID_PASSWORD:
      case AuthErrorCodes.INVALID_EMAIL:
        return {
          type: AuthErrorType.INVALID_CREDENTIALS,
          message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
          originalError: error
        };
      
      case AuthErrorCodes.USER_DELETED:
        return {
          type: AuthErrorType.USER_NOT_FOUND,
          message: 'لا يوجد حساب بهذا البريد الإلكتروني',
          originalError: error
        };
      
      case AuthErrorCodes.EMAIL_EXISTS:
        return {
          type: AuthErrorType.EMAIL_ALREADY_EXISTS,
          message: 'البريد الإلكتروني مستخدم بالفعل',
          originalError: error
        };
      
      case AuthErrorCodes.WEAK_PASSWORD:
        return {
          type: AuthErrorType.WEAK_PASSWORD,
          message: 'كلمة المرور ضعيفة جدًا. يرجى استخدام كلمة مرور أقوى',
          originalError: error
        };
      
      case AuthErrorCodes.USER_DISABLED:
        return {
          type: AuthErrorType.USER_DISABLED,
          message: 'تم تعطيل هذا الحساب. يرجى الاتصال بالدعم',
          originalError: error
        };
      
      case AuthErrorCodes.TIMEOUT:
      case AuthErrorCodes.NETWORK_REQUEST_FAILED:
        return {
          type: AuthErrorType.NETWORK_ERROR,
          message: 'فشل الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت',
          originalError: error
        };
      
      case AuthErrorCodes.TOO_MANY_ATTEMPTS_TRY_LATER:
        return {
          type: AuthErrorType.TOO_MANY_REQUESTS,
          message: 'تم حظر الوصول مؤقتًا بسبب عدة محاولات فاشلة. حاول مرة أخرى لاحقًا',
          originalError: error
        };
      
      case AuthErrorCodes.POPUP_CLOSED_BY_USER:
        return {
          type: AuthErrorType.POPUP_CLOSED,
          message: 'تم إغلاق نافذة تسجيل الدخول. يرجى المحاولة مرة أخرى',
          originalError: error
        };
      
      case AuthErrorCodes.POPUP_BLOCKED:
        return {
          type: AuthErrorType.POPUP_BLOCKED,
          message: 'تم حظر النافذة المنبثقة. يرجى السماح بالنوافذ المنبثقة لهذا الموقع',
          originalError: error
        };
      
      case AuthErrorCodes.EXPIRED_POPUP_REQUEST:
        return {
          type: AuthErrorType.EXPIRED_TOKEN,
          message: 'انتهت صلاحية الطلب. يرجى المحاولة مرة أخرى',
          originalError: error
        };
      
      case AuthErrorCodes.RECAPTCHA_NOT_ENABLED:
      case AuthErrorCodes.MISSING_RECAPTCHA_TOKEN:
      case AuthErrorCodes.INVALID_RECAPTCHA_TOKEN:
      case AuthErrorCodes.INVALID_RECAPTCHA_ACTION:
        return {
          type: AuthErrorType.CAPTCHA_CHECK_FAILED,
          message: 'فشل التحقق من CAPTCHA. يرجى المحاولة مرة أخرى',
          originalError: error
        };
      
      default:
        return {
          type: AuthErrorType.OTHER,
          message: error.message || 'حدث خطأ غير معروف أثناء المصادقة',
          originalError: error
        };
    }
  }
  
  // إذا لم يكن خطأ Firebase
  return {
    type: AuthErrorType.OTHER,
    message: error.message || 'حدث خطأ غير معروف',
    originalError: error
  };
}

/**
 * التحقق مما إذا كان الخطأ يتطلب التحقق بخطوتين
 * @param error خطأ المصادقة
 * @returns يعيد true إذا كان الخطأ يتطلب التحقق بخطوتين
 */
export function isMfaError(error: any): boolean {
  return (
    error instanceof FirebaseError &&
    error.code === 'auth/multi-factor-auth-required'
  );
}

/**
 * استخراج معلومات التحقق بخطوتين من خطأ المصادقة
 * @param error خطأ المصادقة
 * @returns resolver للتحقق بخطوتين أو null
 */
export function getMfaResolver(error: any): MultiFactorResolver | null {
  if (isMfaError(error)) {
    return error.customData?.resolver || null;
  }
  return null;
}