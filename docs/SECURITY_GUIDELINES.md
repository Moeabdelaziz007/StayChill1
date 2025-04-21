# دليل التحسينات الأمنية - StayChill

## استراتيجيات الأمان الأساسية

تم تنفيذ العديد من استراتيجيات الأمان في منصة StayChill لحماية البيانات والمستخدمين والمعاملات. يوضح هذا الدليل الآليات المستخدمة والممارسات الموصى بها للحفاظ على أمان النظام.

## 1. مصادقة متعددة العوامل (2FA)

تم تنفيذ نظام المصادقة متعدد العوامل باستخدام Firebase Authentication لتوفير طبقات متعددة من الحماية.

### تكوين المصادقة متعددة العوامل

```typescript
// تكوين Firebase لدعم المصادقة متعددة العوامل
export const configureMultiFactorAuth = () => {
  // إعداد مزودي المصادقة المتعددة العوامل
  const recaptchaVerifier = new RecaptchaVerifier(
    'recaptcha-container',
    {
      size: 'invisible',
      callback: () => {
        // تم التحقق من recaptcha بنجاح
      }
    },
    auth
  );
  
  return {
    getPhoneMultiFactorResolver: async (error: any) => {
      if (error.code === 'auth/multi-factor-auth-required') {
        const resolver = getMultiFactorResolver(auth, error);
        return resolver;
      }
      throw error;
    },
    
    enrollPhoneAuthProvider: async (phoneNumber: string) => {
      const user = auth.currentUser;
      if (!user) throw new Error('لم يتم تسجيل الدخول');
      
      // التسجيل في المصادقة متعددة العوامل
      const session = await multiFactor(user).getSession();
      
      // إرسال رمز التحقق إلى الهاتف
      const phoneAuthProvider = new PhoneAuthProvider(auth);
      const verificationId = await phoneAuthProvider.verifyPhoneNumber(
        { phoneNumber, session }, 
        recaptchaVerifier
      );
      
      return verificationId;
    }
  };
};
```

### مكون واجهة المستخدم للمصادقة متعددة العوامل

```tsx
// مكون واجهة المستخدم للتحقق من المصادقة متعددة العوامل
interface TwoFactorAuthChallengeProps {
  resolver: MultiFactorResolver;
  onSuccess: () => void;
  onCancel: () => void;
}

const TwoFactorAuthChallenge: React.FC<TwoFactorAuthChallengeProps> = ({
  resolver,
  onSuccess,
  onCancel
}) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [selectedHint, setSelectedHint] = useState<MultiFactorInfo | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // اختيار عامل المصادقة
  const selectAuthFactor = async (hint: MultiFactorInfo) => {
    try {
      setSelectedHint(hint);
      setError('');
      
      // إرسال رمز التحقق
      const phoneAuthProvider = new PhoneAuthProvider(auth);
      const verificationId = await phoneAuthProvider.verifyPhoneNumber({
        multiFactorHint: hint,
        session: resolver.session
      });
      
      // تخزين معرف التحقق للاستخدام لاحقًا
      setVerificationId(verificationId);
    } catch (err: any) {
      console.error('خطأ في إرسال رمز التحقق:', err);
      setError(getFirebaseErrorMessage(err));
    }
  };
  
  // التحقق من الرمز وإكمال تسجيل الدخول
  const verifyCode = async () => {
    if (!verificationCode || !verificationId) return;
    
    try {
      setIsSubmitting(true);
      setError('');
      
      const cred = PhoneAuthProvider.credential(verificationId, verificationCode);
      const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);
      
      // إكمال تسجيل الدخول باستخدام المصادقة متعددة العوامل
      await resolver.resolveSignIn(multiFactorAssertion);
      onSuccess();
    } catch (err: any) {
      console.error('خطأ في التحقق من الرمز:', err);
      setError(getFirebaseErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="p-6 bg-card rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-4">التحقق بخطوتين</h2>
      
      {!selectedHint ? (
        // عرض خيارات المصادقة متعددة العوامل المتاحة
        <div className="space-y-4">
          <p>الرجاء اختيار طريقة التحقق:</p>
          
          {resolver.hints.map((hint, index) => (
            <Button
              key={index}
              onClick={() => selectAuthFactor(hint)}
              className="w-full justify-start"
              variant="outline"
            >
              <Phone className="w-4 h-4 mr-2" />
              {(hint as PhoneMultiFactorInfo).phoneNumber}
            </Button>
          ))}
          
          <div className="flex justify-between mt-4">
            <Button variant="ghost" onClick={onCancel}>
              إلغاء
            </Button>
          </div>
        </div>
      ) : (
        // عرض نموذج إدخال رمز التحقق
        <div className="space-y-4">
          <p>تم إرسال رمز التحقق إلى:</p>
          <p className="font-medium">
            {(selectedHint as PhoneMultiFactorInfo).phoneNumber}
          </p>
          
          <div className="mt-4">
            <Label htmlFor="verification-code">رمز التحقق</Label>
            <Input
              id="verification-code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="أدخل رمز التحقق المكون من 6 أرقام"
              className="mt-1"
              maxLength={6}
            />
          </div>
          
          {error && (
            <div className="text-destructive text-sm mt-2">
              {error}
            </div>
          )}
          
          <div className="flex justify-between mt-6">
            <Button
              variant="ghost"
              onClick={() => {
                setSelectedHint(null);
                setVerificationCode('');
              }}
              disabled={isSubmitting}
            >
              رجوع
            </Button>
            
            <Button
              onClick={verifyCode}
              disabled={verificationCode.length !== 6 || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  جارٍ التحقق...
                </>
              ) : (
                'تأكيد الرمز'
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TwoFactorAuthChallenge;
```

## 2. نظام التحكم في الوصول الهرمي

تم تنفيذ نظام متدرج للتحكم في الوصول يتيح إدارة الصلاحيات بشكل دقيق.

### قواعد الوصول في قاعدة البيانات

```javascript
// قواعد الوصول للمستندات المقيدة
match /restricted/{doc} {
  // السماح بالقراءة فقط للمستخدمين ذوي مستوى الوصول 2 أو أعلى
  allow read: if request.auth.token.accessLevel >= 2;
  // السماح بالكتابة فقط للمستخدمين ذوي مستوى الوصول 3
  allow write: if request.auth.token.accessLevel >= 3;
}

// قواعد الوصول للعقارات
match /properties/{propertyId} {
  // السماح بالقراءة للجميع
  allow read: if true;
  // السماح بالكتابة للمالك أو المشرف
  allow write: if request.auth.uid == resource.data.ownerId ||
               request.auth.token.accessLevel >= 3;
}

// قواعد الوصول للحجوزات
match /bookings/{bookingId} {
  // السماح بالقراءة للمستخدم المعني أو مالك العقار أو المشرف
  allow read: if request.auth.uid == resource.data.userId ||
              request.auth.uid == getProperty(resource.data.propertyId).ownerId ||
              request.auth.token.accessLevel >= 3;
  // السماح بالإنشاء للمستخدمين المسجلين
  allow create: if request.auth.uid != null;
  // السماح بالتعديل للمستخدم المعني أو مالك العقار أو المشرف
  allow update: if request.auth.uid == resource.data.userId ||
                request.auth.uid == getProperty(resource.data.propertyId).ownerId ||
                request.auth.token.accessLevel >= 3;
  // السماح بالحذف للمشرف فقط
  allow delete: if request.auth.token.accessLevel >= 3;
}
```

### ميدلوير التحقق من الوصول

```typescript
// ميدلوير للتحقق من مستوى الوصول
export const verifyAccessLevel = (requiredLevel: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // التحقق من المصادقة أولاً
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: 'غير مصرح لك' });
      }
      
      // التحقق من مستوى الوصول
      const userLevel = req.user.accessLevel || 0;
      
      if (userLevel < requiredLevel) {
        // تسجيل محاولة الوصول غير المصرح بها
        logger.warn('ACCESS_DENIED', {
          userId: req.user.id,
          requiredLevel,
          actualLevel: userLevel,
          ip: req.ip,
          path: req.path
        });
        
        return res.status(403).json({ message: 'ليس لديك صلاحية كافية' });
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

// ميدلوير للتحقق من ملكية المورد
export const verifyResourceOwnership = (
  resourceType: 'property' | 'booking' | 'review',
  paramName: string = 'id'
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // التحقق من المصادقة أولاً
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: 'غير مصرح لك' });
      }
      
      const resourceId = Number(req.params[paramName]);
      
      // التحقق من ملكية المورد حسب نوعه
      switch (resourceType) {
        case 'property': {
          const property = await storage.getProperty(resourceId);
          
          if (!property) {
            return res.status(404).json({ message: 'العقار غير موجود' });
          }
          
          // التحقق إذا كان المستخدم هو المالك
          if (property.ownerId !== req.user.id && req.user.role !== UserRole.SUPER_ADMIN) {
            return res.status(403).json({ message: 'ليس لديك صلاحية لهذا العقار' });
          }
          
          // إضافة المورد المستخرج إلى الطلب للاستخدام لاحقًا
          req.resource = property;
          break;
        }
        
        case 'booking': {
          const booking = await storage.getBooking(resourceId);
          
          if (!booking) {
            return res.status(404).json({ message: 'الحجز غير موجود' });
          }
          
          // التحقق إذا كان المستخدم هو صاحب الحجز أو مالك العقار
          const isOwner = booking.userId === req.user.id;
          
          if (!isOwner) {
            // التحقق إذا كان المستخدم هو مالك العقار
            const property = await storage.getProperty(booking.propertyId);
            
            if (
              !property || 
              (property.ownerId !== req.user.id && req.user.role !== UserRole.SUPER_ADMIN)
            ) {
              return res.status(403).json({ message: 'ليس لديك صلاحية لهذا الحجز' });
            }
          }
          
          // إضافة المورد المستخرج إلى الطلب للاستخدام لاحقًا
          req.resource = booking;
          break;
        }
        
        case 'review': {
          const review = await storage.getReview(resourceId);
          
          if (!review) {
            return res.status(404).json({ message: 'التقييم غير موجود' });
          }
          
          // التحقق إذا كان المستخدم هو كاتب التقييم
          if (review.userId !== req.user.id && req.user.role !== UserRole.SUPER_ADMIN) {
            return res.status(403).json({ message: 'ليس لديك صلاحية لهذا التقييم' });
          }
          
          // إضافة المورد المستخرج إلى الطلب للاستخدام لاحقًا
          req.resource = review;
          break;
        }
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};
```

### استخدام ميدلوير التحقق من الوصول

```typescript
// تطبيق ميدلوير التحقق من الوصول على طرق API
// مثال: إدارة العقارات
app.get(
  '/api/properties', 
  isAuthenticated, 
  (req, res) => {
    // متاح لجميع المستخدمين المسجلين
  }
);

app.post(
  '/api/properties', 
  isAuthenticated, 
  verifyAccessLevel(ACCESS_LEVELS.PROPERTY_ADMIN), 
  (req, res) => {
    // متاح لمشرفي العقارات والمشرفين الأعلى فقط
  }
);

app.get(
  '/api/admin/users', 
  isAuthenticated, 
  verifyAccessLevel(ACCESS_LEVELS.SUPER_ADMIN), 
  (req, res) => {
    // متاح للمشرفين العامين فقط
  }
);

app.patch(
  '/api/properties/:id', 
  isAuthenticated, 
  verifyResourceOwnership('property'), 
  (req, res) => {
    // التحقق من ملكية العقار قبل السماح بالتعديل
  }
);
```

## 3. حماية Firebase App Check

تم تنفيذ Firebase App Check لحماية واجهات برمجة التطبيقات من الوصول غير المصرح به.

### تكوين Firebase App Check

```typescript
// تكوين Firebase App Check باستخدام reCAPTCHA Enterprise
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';

// التحقق من وجود مفتاح الموقع reCAPTCHA
if (!import.meta.env.VITE_RECAPTCHA_SITE_KEY) {
  throw new Error('مفتاح موقع reCAPTCHA غير متوفر. يرجى ضبط VITE_RECAPTCHA_SITE_KEY في متغيرات البيئة.');
}

// تهيئة Firebase App Check
export const initializeFirebaseAppCheck = () => {
  // تكوين App Check للإنتاج
  const appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
    isTokenAutoRefreshEnabled: true
  });
  
  // تكوين App Check للتطوير (اختياري)
  if (import.meta.env.DEV) {
    // تمكين رموز التصحيح الخاصة بالتطوير فقط في بيئة التطوير
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }
  
  return appCheck;
};

// استدعاء تهيئة App Check مبكرًا في دورة حياة التطبيق
initializeFirebaseAppCheck();
```

### التحقق من صحة رموز App Check على الخادم

```typescript
// التحقق من صحة رموز App Check على الخادم
import { getAuth } from 'firebase-admin/auth';
import { getAppCheck } from 'firebase-admin/app-check';

// ميدلوير للتحقق من صحة رمز App Check
export const verifyAppCheck = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const appCheckToken = req.header('X-Firebase-AppCheck');
    
    if (!appCheckToken) {
      // التحقق من عدم وجود الرمز فقط في بيئة الإنتاج
      if (process.env.NODE_ENV === 'production') {
        return res.status(401).json({ message: 'رمز App Check مفقود' });
      } else {
        // السماح بتخطي التحقق في بيئة التطوير
        return next();
      }
    }
    
    // التحقق من صحة الرمز
    await getAppCheck().verifyToken(appCheckToken);
    
    next();
  } catch (error) {
    // فشل التحقق من صحة رمز App Check
    return res.status(401).json({ message: 'رمز App Check غير صالح' });
  }
};

// تطبيق ميدلوير التحقق على طرق API المهمة
app.use('/api/secure', verifyAppCheck);
```

## 4. حماية ضد هجمات CSRF

تم تنفيذ حماية ضد هجمات تزوير الطلبات عبر المواقع (CSRF).

### تكوين حماية CSRF

```typescript
import csrf from 'csurf';
import cookieParser from 'cookie-parser';

// إعداد الميدلوير
app.use(cookieParser());

// تكوين حماية CSRF
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
});

// تطبيق حماية CSRF على طرق API التي تقوم بتعديل البيانات
app.post('/api/bookings', csrfProtection, (req, res) => {
  // طلب آمن مع حماية CSRF
});

app.patch('/api/properties/:id', csrfProtection, (req, res) => {
  // طلب آمن مع حماية CSRF
});

// توفير رمز CSRF للعميل
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});
```

### استخدام رموز CSRF في العميل

```typescript
// استخدام رموز CSRF في طلبات العميل
const fetchCSRFToken = async () => {
  const res = await fetch('/api/csrf-token');
  const { csrfToken } = await res.json();
  return csrfToken;
};

// وظيفة مساعدة لإضافة رمز CSRF إلى الطلبات
const apiRequest = async (method: string, url: string, data?: any) => {
  // الحصول على رمز CSRF للطلبات التي تعدل البيانات
  let headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (method !== 'GET' && method !== 'HEAD') {
    const csrfToken = await fetchCSRFToken();
    headers['X-CSRF-Token'] = csrfToken;
  }
  
  const response = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: 'include' // إرسال ملفات تعريف الارتباط مع الطلب
  });
  
  return response;
};
```

## 5. تسجيل وتتبع الأمان

تم تنفيذ نظام شامل لتسجيل وتتبع الأحداث الأمنية.

### تسجيل الأحداث الأمنية

```typescript
// نظام تسجيل الأحداث الأمنية
import { getFirestore } from 'firebase-admin/firestore';

// واجهة سجل الأمان
interface SecurityLogEntry {
  timestamp: Date;
  userId?: string | number;
  ipAddress?: string;
  userAgent?: string;
  action: string;
  status: 'success' | 'failure';
  details?: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// وظيفة تسجيل الأحداث الأمنية
export const logSecurityEvent = async (entry: Omit<SecurityLogEntry, 'timestamp'>) => {
  try {
    const db = getFirestore();
    
    // إضافة الطابع الزمني
    const securityLog: SecurityLogEntry = {
      ...entry,
      timestamp: new Date()
    };
    
    // تسجيل الحدث في Firestore
    await db.collection('securityLogs').add(securityLog);
    
    // تسجيل الأحداث الحرجة في السجل أيضًا
    if (entry.severity === 'high' || entry.severity === 'critical') {
      console.error(`[SECURITY] ${entry.action}:`, entry.details);
    }
  } catch (error) {
    console.error('فشل تسجيل حدث الأمان:', error);
  }
};

// تسجيل محاولات تسجيل الدخول
export const logLoginAttempt = (
  req: Request,
  userId: string | number | undefined,
  success: boolean,
  details?: any
) => {
  return logSecurityEvent({
    userId,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    action: 'LOGIN_ATTEMPT',
    status: success ? 'success' : 'failure',
    details,
    severity: success ? 'low' : 'medium'
  });
};

// تسجيل تغييرات الصلاحيات
export const logPermissionChange = (
  req: Request,
  targetUserId: string | number,
  changes: any,
  success: boolean
) => {
  return logSecurityEvent({
    userId: req.user?.id,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    action: 'PERMISSION_CHANGE',
    status: success ? 'success' : 'failure',
    details: {
      targetUserId,
      changes
    },
    severity: 'high'
  });
};

// تسجيل حدث أمني عام
export const logSecurityBreach = (req: Request, details: any) => {
  return logSecurityEvent({
    userId: req.user?.id,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    action: 'SECURITY_BREACH',
    status: 'failure',
    details,
    severity: 'critical'
  });
};
```

### ميدلوير كشف الهجمات

```typescript
// ميدلوير لكشف ومنع هجمات Force Brute
import rateLimit from 'express-rate-limit';

// تحديد معدل محاولات تسجيل الدخول
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 5, // 5 محاولات كحد أقصى
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    // تسجيل محاولة الهجوم
    logSecurityEvent({
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      action: 'BRUTE_FORCE_ATTEMPT',
      status: 'failure',
      details: {
        endpoint: '/api/login',
        attemptCount: req.rateLimit.current
      },
      severity: 'high'
    });
    
    res.status(429).json({
      message: 'عدد كبير من محاولات تسجيل الدخول. يرجى المحاولة مرة أخرى بعد 15 دقيقة.'
    });
  }
});

// تطبيق محدد المعدل على مسار تسجيل الدخول
app.post('/api/login', loginLimiter, authController.login);

// تحديد معدل طلبات إعادة تعيين كلمة المرور
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // ساعة واحدة
  max: 3, // 3 محاولات كحد أقصى
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logSecurityEvent({
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      action: 'PASSWORD_RESET_ABUSE',
      status: 'failure',
      details: {
        endpoint: '/api/reset-password',
        attemptCount: req.rateLimit.current
      },
      severity: 'medium'
    });
    
    res.status(429).json({
      message: 'عدد كبير من محاولات إعادة تعيين كلمة المرور. يرجى المحاولة مرة أخرى بعد ساعة.'
    });
  }
});

// تطبيق محدد المعدل على مسار إعادة تعيين كلمة المرور
app.post('/api/reset-password', passwordResetLimiter, authController.resetPassword);
```

## 6. تشفير البيانات الحساسة

تم تنفيذ آليات لتشفير البيانات الحساسة في التطبيق.

### تشفير كلمات المرور

```typescript
// تشفير كلمات المرور باستخدام bcrypt
import bcrypt from 'bcryptjs';

// تشفير كلمة المرور
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12; // عدد دورات التشفير (يوصى بـ 10-12)
  const salt = await bcrypt.genSalt(saltRounds);
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
};

// التحقق من كلمة المرور
export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

// استخدام تشفير كلمات المرور في التسجيل
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // تشفير كلمة المرور قبل التخزين
    const hashedPassword = await hashPassword(password);
    
    // إنشاء المستخدم بكلمة المرور المشفرة
    const user = await storage.createUser({
      username,
      email,
      password: hashedPassword,
      role: 'user'
    });
    
    // إرجاع المستخدم بدون كلمة المرور
    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    // معالجة الأخطاء
  }
});
```

### تشفير البيانات الحساسة في قاعدة البيانات

```typescript
// تشفير البيانات الحساسة في قاعدة البيانات
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

// الحصول على مفتاح التشفير من متغيرات البيئة
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
  throw new Error('مفتاح التشفير غير صالح. يجب أن يكون 32 بايت.');
}

// تشفير البيانات
export const encryptData = (text: string): { encryptedData: string, iv: string } => {
  // إنشاء متجه تهيئة عشوائي
  const iv = randomBytes(16);
  
  // إنشاء الشفرة
  const cipher = createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  
  // تشفير البيانات
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return {
    encryptedData: encrypted,
    iv: iv.toString('hex')
  };
};

// فك تشفير البيانات
export const decryptData = (encryptedData: string, iv: string): string => {
  // إنشاء فاك الشفرة
  const decipher = createDecipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY),
    Buffer.from(iv, 'hex')
  );
  
  // فك تشفير البيانات
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};

// استخدام التشفير لبيانات بطاقة الائتمان
interface PaymentInfo {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
}

export const storePaymentInfo = async (userId: number, paymentInfo: PaymentInfo) => {
  // تشفير بيانات بطاقة الائتمان
  const { encryptedData: encryptedCardNumber, iv: cardNumberIv } = encryptData(paymentInfo.cardNumber);
  const { encryptedData: encryptedExpiryDate, iv: expiryDateIv } = encryptData(paymentInfo.expiryDate);
  const { encryptedData: encryptedCvv, iv: cvvIv } = encryptData(paymentInfo.cvv);
  
  // تخزين البيانات المشفرة
  const paymentMethod = {
    userId,
    cardNumberEncrypted: encryptedCardNumber,
    cardNumberIv,
    expiryDateEncrypted: encryptedExpiryDate,
    expiryDateIv,
    cvvEncrypted: encryptedCvv,
    cvvIv,
    lastFourDigits: paymentInfo.cardNumber.slice(-4), // تخزين الأرقام الأربعة الأخيرة بشكل غير مشفر للعرض
    createdAt: new Date()
  };
  
  // حفظ في قاعدة البيانات
  return await storage.createPaymentMethod(paymentMethod);
};

export const retrievePaymentInfo = async (paymentMethodId: number): Promise<PaymentInfo> => {
  // استعادة البيانات المشفرة من قاعدة البيانات
  const paymentMethod = await storage.getPaymentMethod(paymentMethodId);
  
  if (!paymentMethod) {
    throw new Error('طريقة الدفع غير موجودة');
  }
  
  // فك تشفير البيانات
  const cardNumber = decryptData(paymentMethod.cardNumberEncrypted, paymentMethod.cardNumberIv);
  const expiryDate = decryptData(paymentMethod.expiryDateEncrypted, paymentMethod.expiryDateIv);
  const cvv = decryptData(paymentMethod.cvvEncrypted, paymentMethod.cvvIv);
  
  return {
    cardNumber,
    expiryDate,
    cvv
  };
};
```

## 7. معايير أمان الخادم

تم تنفيذ معايير أمان الخادم لتعزيز الأمان العام.

### استخدام رؤوس HTTP الأمنية

```typescript
// ميدلوير لإضافة رؤوس HTTP الأمنية
import helmet from 'helmet';

// تطبيق رؤوس الأمان الأساسية
app.use(helmet());

// تكوين سياسة أمان المحتوى
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://apis.google.com", "https://www.gstatic.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https://storage.googleapis.com"],
      connectSrc: ["'self'", "https://*.firebaseio.com", "https://*.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  })
);

// تكوين رؤوس أمان إضافية
app.use(helmet.referrerPolicy({ policy: 'same-origin' }));
app.use(helmet.permittedCrossDomainPolicies());
app.use(helmet.dnsPrefetchControl({ allow: false }));
app.use(helmet.frameguard({ action: 'deny' }));
```

### تأمين ملفات تعريف الارتباط

```typescript
// تكوين ملفات تعريف الارتباط الآمنة
import session from 'express-session';

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000; // 30 يوم بالميللي ثانية

app.use(
  session({
    name: 'staychill.sid', // اسم ملف تعريف الارتباط
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true, // منع الوصول من JavaScript
      secure: process.env.NODE_ENV === 'production', // استخدام HTTPS في الإنتاج
      maxAge: THIRTY_DAYS, // عمر الجلسة
      sameSite: 'lax', // حماية CSRF
    },
    store: sessionStore // استخدام مخزن جلسات خارجي
  })
);
```

## أفضل الممارسات الأمنية

### 1. المصادقة والتحقق

- استخدام المصادقة متعددة العوامل (2FA) لجميع الحسابات، خاصة الحسابات ذات الصلاحيات العالية
- تنفيذ سياسات قوية لكلمات المرور (8 أحرف على الأقل، أحرف كبيرة وصغيرة، أرقام، رموز)
- التحقق من صحة جميع بيانات الإدخال على جانب الخادم
- تحديد معدل المحاولات للوظائف الحساسة مثل تسجيل الدخول وإعادة تعيين كلمة المرور

### 2. التحكم في الوصول

- اتباع مبدأ الامتيازات الأقل لجميع المستخدمين والعمليات
- تنفيذ أدوار مختلفة مع صلاحيات محددة
- التحقق من ملكية الموارد بالإضافة إلى الصلاحيات
- تنفيذ فصل المهام للوظائف الحساسة

### 3. حماية البيانات

- تشفير جميع البيانات الحساسة
- استخدام HTTPS لجميع الاتصالات
- تنفيذ سياسات صارمة لأمان المحتوى (CSP)
- تطبيق حماية CSRF لجميع النماذج والطلبات التي تعدل البيانات

### 4. المراقبة والتدقيق

- تسجيل جميع الأحداث الأمنية المهمة
- مراقبة أنماط الوصول غير العادية
- تنفيذ تنبيهات للأحداث الأمنية الحرجة
- مراجعة سجلات الأمان بانتظام

### 5. استجابة الحوادث

- وضع خطة استجابة للحوادث الأمنية
- تنفيذ إجراءات للإبلاغ عن المشكلات الأمنية
- تحديد المسؤوليات أثناء حوادث الأمان
- إجراء تدريبات منتظمة على استجابة الحوادث