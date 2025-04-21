import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  signInWithRedirect, 
  GoogleAuthProvider,
  getRedirectResult,
  signOut,
  onAuthStateChanged as firebaseAuthStateChanged,
  User as FirebaseUser,
  sendEmailVerification,
  createUserWithEmailAndPassword,
  multiFactor,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  RecaptchaVerifier,
  MultiFactorInfo,
  MultiFactorSession,
  TotpMultiFactorGenerator,
  TotpSecret,
  updateProfile,
  sendPasswordResetEmail,
  signInWithEmailAndPassword
} from "firebase/auth";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// تهيئة App Check لتعزيز الأمان
// تم تعطيل App Check مؤقتاً بسبب مشاكل في مصادقة Firebase
// عندما نكون جاهزين لتفعيل App Check مرة أخرى، يمكننا إعادة تفعيل الكود أدناه

// في وضع التطوير، نفعّل وضع التصحيح حتى تعمل الطلبات بشكل موثوق
// قبل الإنتاج، يجب إزالة الإعدادات المتعلقة بوضع التصحيح
/* 
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  // @ts-ignore - self is actually available in the browser
  window.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}

// إنشاء مثيل AppCheck مع مزود reCAPTCHA v3
// Site Key هنا هو المفتاح العام (public) لموقع reCAPTCHA، ليس المفتاح السري
// تهيئة App Check فقط في المتصفح، وليس أثناء تنفيذ SSR
if (typeof window !== 'undefined') {
  try {
    const appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
      isTokenAutoRefreshEnabled: true
    });
    console.log('Firebase App Check initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase App Check:', error);
  }
}
*/

console.log('Firebase App Check temporarily disabled for development');

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Configure Google provider
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

/**
 * Sign in with Google using popup
 * @returns Promise with UserCredential
 */
export const signInWithGooglePopup = () => signInWithPopup(auth, googleProvider);

/**
 * Sign in with Google using redirect
 * Redirects the page to Google sign in page
 */
export const signInWithGoogleRedirect = () => signInWithRedirect(auth, googleProvider);

/**
 * Get the result after being redirected back from Google
 * @returns Promise with UserCredential
 */
export const getGoogleRedirectResult = () => getRedirectResult(auth);

/**
 * Sign in with Google - uses popup by default, falls back to redirect on mobile
 * @returns Promise with UserCredential
 */
export const signInWithGoogle = () => {
  // Check if we're on mobile
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  if (isMobile) {
    // Use redirect for mobile as popups can be problematic
    return signInWithGoogleRedirect();
  } else {
    // Use popup for desktop
    return signInWithGooglePopup();
  }
};

/**
 * Sign out from Firebase
 * @returns Promise that resolves when sign out is complete
 */
export const signOutFromFirebase = () => signOut(auth);

/**
 * Get the current Firebase user
 * @returns The current Firebase user or null if not logged in
 */
export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser;
};

/**
 * Get the current user's ID token
 * @param forceRefresh - Whether to force refresh the token
 * @returns Promise with the ID token or null if not logged in
 */
export const getCurrentUserIdToken = async (forceRefresh = false): Promise<string | null> => {
  const user = auth.currentUser;
  if (!user) return null;
  
  try {
    return await user.getIdToken(forceRefresh);
  } catch (error) {
    console.error("Error getting ID token:", error);
    return null;
  }
};

/**
 * Get the Firebase ID token for the current user
 * @returns Promise with the ID token or null if not logged in
 */
export const getFirebaseIdToken = async (): Promise<string | null> => {
  const user = auth.currentUser;
  if (!user) return null;
  
  try {
    return await user.getIdToken(true); // true forces refresh
  } catch (error) {
    console.error("Error getting ID token:", error);
    return null;
  }
};

/**
 * Listen for Firebase authentication state changes
 * @param callback - Function to call when authentication state changes
 * @returns Unsubscribe function
 */
export const onAuthStateChanged = (callback: (user: FirebaseUser | null) => void) => {
  return firebaseAuthStateChanged(auth, callback);
};

/**
 * Send email verification to the current user
 * @returns Promise that resolves when verification email is sent
 */
export const sendVerificationEmail = async (): Promise<void> => {
  const user = auth.currentUser;
  if (user && !user.emailVerified) {
    await sendEmailVerification(user);
  }
};

/**
 * Check if the current user's email is verified
 * @returns Boolean indicating if email is verified or not
 */
export const isEmailVerified = (): boolean => {
  const user = auth.currentUser;
  return user?.emailVerified || false;
};

/**
 * Register a new user with email and password
 * @param email - User's email
 * @param password - User's password
 * @returns Promise with UserCredential
 */
export const registerWithEmailAndPassword = async (email: string, password: string) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

/**
 * قم بتسجيل الدخول باستخدام البريد الإلكتروني وكلمة المرور
 * @param email - البريد الإلكتروني للمستخدم
 * @param password - كلمة المرور 
 * @returns وعد بنتيجة المصادقة
 */
export const loginWithEmailAndPassword = async (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

/**
 * إرسال رابط إعادة تعيين كلمة المرور إلى البريد الإلكتروني للمستخدم
 * @param email - البريد الإلكتروني للمستخدم
 * @returns وعد يتم حله عندما يتم إرسال البريد الإلكتروني
 */
export const resetPassword = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, email);
};

/**
 * تحديث الملف الشخصي للمستخدم الحالي
 * @param displayName - اسم المستخدم الجديد (اختياري)
 * @param photoURL - عنوان URL للصورة الشخصية الجديدة (اختياري)
 * @returns وعد يتم حله عندما يتم تحديث الملف الشخصي
 */
export const updateUserProfile = async (displayName?: string, photoURL?: string): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error("No user logged in");
  
  await updateProfile(user, {
    displayName: displayName || user.displayName,
    photoURL: photoURL || user.photoURL
  });
};

// إمكانيات التحقق بخطوتين (2FA)

/**
 * التحقق مما إذا كان تمكين التحقق بخطوتين متاحًا للمستخدم الحالي
 * @returns وعد مع قيمة منطقية تشير إلى ما إذا كان التحقق بخطوتين متاحًا
 */
export const is2FAAvailable = async (): Promise<boolean> => {
  const user = auth.currentUser;
  if (!user) return false;
  
  return true; // Firebase يدعم التحقق بخطوتين لجميع المستخدمين
};

/**
 * الحصول على قائمة بمعلومات الوسائط المتعددة المسجلة للمستخدم الحالي
 * @returns وعد مع قائمة MultiFactorInfo
 */
export const getEnrolledFactors = async (): Promise<MultiFactorInfo[]> => {
  const user = auth.currentUser;
  if (!user) return [];
  
  const multiFactorUser = multiFactor(user);
  return multiFactorUser.enrolledFactors;
};

/**
 * تحقق مما إذا كان المستخدم الحالي قد قام بتسجيل أي عوامل للتحقق بخطوتين
 * @returns وعد مع قيمة منطقية تشير إلى ما إذا كان المستخدم قد قام بتسجيل التحقق بخطوتين
 */
export const is2FAEnabled = async (): Promise<boolean> => {
  const factors = await getEnrolledFactors();
  return factors.length > 0;
};

/**
 * إنشاء محقق الـ Recaptcha للاستخدام في التحقق من رقم الهاتف
 * @param containerId - معرف العنصر الذي سيتم عرض محقق الـ Recaptcha فيه
 * @returns محقق الـ Recaptcha
 */
export const createRecaptchaVerifier = (containerId: string): RecaptchaVerifier => {
  return new RecaptchaVerifier(auth, containerId, {
    size: 'normal',
    callback: () => {
      // سيتم استدعاء هذا عندما يتم حل الـ reCAPTCHA
    }
  });
};

/**
 * بدء عملية تسجيل عامل المصادقة متعدد العوامل للهاتف
 * @param phoneNumber - رقم الهاتف بتنسيق E.164 (+201234567890)
 * @param recaptchaVerifier - محقق الـ Recaptcha الذي تم إنشاؤه من قبل
 * @returns وعد مع جلسة التحقق المتعدد العوامل و verificationId
 */
export const startPhoneMFAEnrollment = async (
  phoneNumber: string,
  recaptchaVerifier: RecaptchaVerifier
): Promise<{ session: MultiFactorSession; verificationId: string }> => {
  const user = auth.currentUser;
  if (!user) throw new Error("No user logged in");
  
  const multiFactorUser = multiFactor(user);
  const session = await multiFactorUser.getSession();
  
  const phoneAuthProvider = new PhoneAuthProvider(auth);
  const verificationId = await phoneAuthProvider.verifyPhoneNumber({
    phoneNumber,
    session
  }, recaptchaVerifier);
  
  return { session, verificationId };
};

/**
 * إكمال عملية تسجيل عامل المصادقة متعدد العوامل للهاتف
 * @param verificationId - معرف التحقق من الخطوة السابقة
 * @param verificationCode - رمز التحقق الذي تم إرساله إلى الهاتف
 * @param displayName - اسم العرض لعامل المصادقة (اختياري)
 * @returns وعد يتم حله عندما يتم تسجيل العامل بنجاح
 */
export const completePhoneMFAEnrollment = async (
  verificationId: string,
  verificationCode: string,
  displayName?: string
): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error("No user logged in");
  
  const multiFactorUser = multiFactor(user);
  const phoneAuthCredential = PhoneAuthProvider.credential(verificationId, verificationCode);
  const mfaAssertion = PhoneMultiFactorGenerator.assertion(phoneAuthCredential);
  
  await multiFactorUser.enroll(mfaAssertion, displayName);
};

/**
 * بدء عملية تسجيل عامل المصادقة متعدد العوامل للتطبيق (TOTP)
 * @returns وعد مع كائن TotpSecret
 */
export const startTOTPMFAEnrollment = async (): Promise<TotpSecret> => {
  const user = auth.currentUser;
  if (!user) throw new Error("No user logged in");
  
  const multiFactorUser = multiFactor(user);
  return await TotpMultiFactorGenerator.generateSecret(multiFactorUser);
};

/**
 * إكمال عملية تسجيل عامل المصادقة متعدد العوامل للتطبيق (TOTP)
 * @param secret - السر الذي تم إنشاؤه في الخطوة السابقة
 * @param oneTimePassword - كلمة المرور لمرة واحدة من تطبيق المصادقة
 * @param displayName - اسم العرض لعامل المصادقة (اختياري)
 * @returns وعد يتم حله عندما يتم تسجيل العامل بنجاح
 */
export const completeTOTPMFAEnrollment = async (
  secret: TotpSecret,
  oneTimePassword: string,
  displayName?: string
): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error("No user logged in");
  
  const multiFactorUser = multiFactor(user);
  const credential = TotpMultiFactorGenerator.generateCredential(secret, oneTimePassword);
  const mfaAssertion = TotpMultiFactorGenerator.assertion(credential);
  
  await multiFactorUser.enroll(mfaAssertion, displayName);
};

/**
 * إزالة عامل مصادقة متعدد العوامل
 * @param uid - معرف العامل المراد إزالته
 * @returns وعد يتم حله عندما تتم الإزالة بنجاح
 */
export const unenrollFactor = async (uid: string): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error("No user logged in");
  
  const multiFactorUser = multiFactor(user);
  await multiFactorUser.unenroll({ uid });
};

/**
 * تحديد ما إذا كان يجب فرض التحقق بخطوتين للمستخدم بناءً على دوره
 * @param role - دور المستخدم
 * @returns قيمة منطقية تشير إلى ما إذا كان يجب فرض التحقق بخطوتين
 */
export const shouldEnforce2FA = (role: string): boolean => {
  // فرض التحقق بخطوتين للمشرفين (المسؤولين) ومديري العقارات
  const sensitivesRoles = ['super_admin', 'property_admin'];
  return sensitivesRoles.includes(role);
};

export { auth };