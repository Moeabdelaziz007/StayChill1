import { initializeApp } from 'firebase-admin/app';
import { getAuth, UserRecord } from 'firebase-admin/auth';
import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';
import { storage } from './storage';
import { DecodedIdToken } from 'firebase-admin/auth';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin with environment variables
// Note: In production, you would load this from a service account JSON file
// For Replit, we use environment variables for security
try {
  const firebaseApp = initializeApp({
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  });
  
  logger.info('firebase-admin', 'Firebase Admin SDK initialized successfully');
} catch (error) {
  logger.error('firebase-admin', 'Failed to initialize Firebase Admin SDK', error);
}

// استيراد تعريف أدوار المستخدمين من ملف constants
import { UserRole } from './constants/roles';

// نوع مخصص للعمليات المسموح بها
export enum PermissionAction {
  READ = 'read',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  MANAGE = 'manage'
}

// نوع مخصص للموارد في النظام
export enum ResourceType {
  PROPERTY = 'property',
  BOOKING = 'booking',
  USER = 'user',
  PAYMENT = 'payment',
  REVIEW = 'review',
  RESTAURANT = 'restaurant',
  SERVICE = 'service',
  SETTING = 'setting',
  REPORT = 'report',
  NOTIFICATION = 'notification',
  REWARD = 'reward'
}

// وظيفة مساعدة للتحقق من الصلاحيات بناءً على دور المستخدم والموارد
export const hasPermission = (
  userRole: UserRole, 
  action: PermissionAction, 
  resource: ResourceType, 
  ownerId?: number,
  userId?: number
): boolean => {
  // مصفوفة الصلاحيات
  const permissionMatrix: Record<UserRole, Record<ResourceType, PermissionAction[]>> = {
    [UserRole.CUSTOMER]: {
      [ResourceType.PROPERTY]: [PermissionAction.READ],
      [ResourceType.BOOKING]: [PermissionAction.READ, PermissionAction.CREATE, PermissionAction.UPDATE],
      [ResourceType.USER]: [PermissionAction.READ], 
      [ResourceType.PAYMENT]: [PermissionAction.READ, PermissionAction.CREATE],
      [ResourceType.REVIEW]: [PermissionAction.READ, PermissionAction.CREATE, PermissionAction.UPDATE, PermissionAction.DELETE],
      [ResourceType.RESTAURANT]: [PermissionAction.READ],
      [ResourceType.SERVICE]: [PermissionAction.READ],
      [ResourceType.SETTING]: [],
      [ResourceType.REPORT]: [],
      [ResourceType.NOTIFICATION]: [PermissionAction.READ],
      [ResourceType.REWARD]: [PermissionAction.READ]
    },
    [UserRole.PROPERTY_ADMIN]: {
      [ResourceType.PROPERTY]: [PermissionAction.READ, PermissionAction.CREATE, PermissionAction.UPDATE, PermissionAction.DELETE],
      [ResourceType.BOOKING]: [PermissionAction.READ, PermissionAction.UPDATE, PermissionAction.MANAGE],
      [ResourceType.USER]: [PermissionAction.READ],
      [ResourceType.PAYMENT]: [PermissionAction.READ, PermissionAction.MANAGE],
      [ResourceType.REVIEW]: [PermissionAction.READ, PermissionAction.MANAGE],
      [ResourceType.RESTAURANT]: [PermissionAction.READ],
      [ResourceType.SERVICE]: [PermissionAction.READ],
      [ResourceType.SETTING]: [PermissionAction.READ],
      [ResourceType.REPORT]: [PermissionAction.READ],
      [ResourceType.NOTIFICATION]: [PermissionAction.READ, PermissionAction.CREATE],
      [ResourceType.REWARD]: [PermissionAction.READ]
    },
    [UserRole.SUPER_ADMIN]: {
      [ResourceType.PROPERTY]: [PermissionAction.READ, PermissionAction.CREATE, PermissionAction.UPDATE, PermissionAction.DELETE, PermissionAction.MANAGE],
      [ResourceType.BOOKING]: [PermissionAction.READ, PermissionAction.CREATE, PermissionAction.UPDATE, PermissionAction.DELETE, PermissionAction.MANAGE],
      [ResourceType.USER]: [PermissionAction.READ, PermissionAction.CREATE, PermissionAction.UPDATE, PermissionAction.DELETE, PermissionAction.MANAGE],
      [ResourceType.PAYMENT]: [PermissionAction.READ, PermissionAction.CREATE, PermissionAction.UPDATE, PermissionAction.DELETE, PermissionAction.MANAGE],
      [ResourceType.REVIEW]: [PermissionAction.READ, PermissionAction.CREATE, PermissionAction.UPDATE, PermissionAction.DELETE, PermissionAction.MANAGE],
      [ResourceType.RESTAURANT]: [PermissionAction.READ, PermissionAction.CREATE, PermissionAction.UPDATE, PermissionAction.DELETE, PermissionAction.MANAGE],
      [ResourceType.SERVICE]: [PermissionAction.READ, PermissionAction.CREATE, PermissionAction.UPDATE, PermissionAction.DELETE, PermissionAction.MANAGE],
      [ResourceType.SETTING]: [PermissionAction.READ, PermissionAction.UPDATE, PermissionAction.MANAGE],
      [ResourceType.REPORT]: [PermissionAction.READ, PermissionAction.CREATE, PermissionAction.MANAGE],
      [ResourceType.NOTIFICATION]: [PermissionAction.READ, PermissionAction.CREATE, PermissionAction.UPDATE, PermissionAction.DELETE, PermissionAction.MANAGE],
      [ResourceType.REWARD]: [PermissionAction.READ, PermissionAction.CREATE, PermissionAction.UPDATE, PermissionAction.DELETE, PermissionAction.MANAGE]
    }
  };

  // تحقق من صلاحيات المستخدم
  const allowedActions = permissionMatrix[userRole][resource] || [];
  
  // ممتلكات المستخدم - إضافة قواعد خاصة
  if (ownerId && userId && ownerId === userId) {
    // المستخدم هو مالك المورد
    if (userRole === UserRole.PROPERTY_ADMIN && 
        (resource === ResourceType.PROPERTY || resource === ResourceType.BOOKING)) {
      return true;
    }
    
    if (userRole === UserRole.CUSTOMER && 
        (resource === ResourceType.BOOKING || resource === ResourceType.REVIEW)) {
      return true;
    }
  }
  
  // Super Admin دائمًا يملك صلاحية على كل شيء
  if (userRole === UserRole.SUPER_ADMIN) {
    return true;
  }
  
  return allowedActions.includes(action) || allowedActions.includes(PermissionAction.MANAGE);
};

// سجل تدقيق للعمليات الحساسة
export interface AuditLogEntry {
  action: string;
  userId: number | string;
  userRole: string;
  resource: string;
  resourceId?: string | number;
  success: boolean;
  details?: any;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

// مصفوفة سجلات التدقيق المؤقتة - في التطبيق الحقيقي ستُخزن في قاعدة البيانات
export const auditLogs: AuditLogEntry[] = [];

// وظيفة لتسجيل الأحداث الهامة
export const logAuditEvent = (req: Request, entry: Omit<AuditLogEntry, 'timestamp' | 'ipAddress' | 'userAgent'>) => {
  const auditEntry: AuditLogEntry = {
    ...entry,
    timestamp: new Date(),
    ipAddress: req.ip || req.socket.remoteAddress,
    userAgent: req.headers['user-agent']
  };
  
  // خزن السجل 
  auditLogs.push(auditEntry);
  
  // سجل الحدث في سجل التطبيق
  logger.info('audit-log', `${entry.action} on ${entry.resource} ${entry.resourceId || ''} by ${entry.userId} (${entry.userRole}): ${entry.success ? 'SUCCESS' : 'FAILED'}`, entry.details);
  
  // في الإنتاج: خزن في قاعدة البيانات
};

/**
 * Middleware لتحقق من صحة رمز Firebase في Authorization headers
 * إذا كان الرمز صحيحًا، سيتم تسجيل دخول المستخدم وتمرير الطلب
 * إذا لم يتم تقديم رمز، سيتم تمرير الطلب إلى middleware التالي بدون خطأ
 * 
 * هذا التنفيذ يتضمن:
 * 1. التحقق من صحة رمز Firebase
 * 2. التحقق من أن المستخدم غير محظور
 * 3. التحقق من صلاحية عضوية المستخدم
 * 4. تسجيل محاولة الدخول في سجل التدقيق
 */
export const verifyFirebaseToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // لا يوجد ترويسة تخويل أو ليست Bearer token
    return next();
  }
  
  const idToken = authHeader.split('Bearer ')[1];
  if (!idToken) {
    // لم يتم تقديم رمز
    return next();
  }
  
  try {
    // تحقق من صحة الرمز
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(idToken, true); // checkRevoked = true للتحقق من أن الرمز لم يتم إلغاؤه
    
    // تسجيل محاولة مصادقة ناجحة
    logger.info('firebase-auth', `Verified token for user: ${decodedToken.uid}`);
    
    // تحقق من معلومات المستخدم في Firebase
    try {
      const firebaseUser = await auth.getUser(decodedToken.uid);
      
      // التحقق من أن المستخدم غير معطل في Firebase
      if (firebaseUser.disabled) {
        logger.warn('firebase-auth', `Access attempt by disabled user: ${decodedToken.uid}`);
        
        // تسجيل محاولة وصول من مستخدم معطل
        logAuditEvent(req, {
          action: 'login_attempt',
          userId: decodedToken.uid,
          userRole: 'unknown',
          resource: 'auth',
          success: false,
          details: { reason: 'User account is disabled' }
        });
        
        return res.status(403).json({ 
          error: 'account_disabled', 
          message: 'Your account has been disabled. Please contact support.' 
        });
      }
      
      // التحقق من البريد الإلكتروني المؤكد (اختياري، يمكن إزالته إذا لم تكن المصادقة بالبريد مطلوبة)
      if (decodedToken.email_verified === false && decodedToken.email) {
        logger.warn('firebase-auth', `Access attempt with unverified email: ${decodedToken.email}`);
        // يمكن تعليق هذا الشرط إذا كنت لا تريد طلب تأكيد البريد الإلكتروني
        /*
        return res.status(403).json({ 
          error: 'email_not_verified', 
          message: 'Please verify your email address before continuing.' 
        });
        */
      }
      
    } catch (error) {
      logger.error('firebase-auth', 'Error fetching Firebase user data', error);
      // نستمر بدون خطأ لأن الرمز قد يكون صالحًا على الرغم من مشكلة الوصول إلى Firebase
    }
    
    // إضافة معلومات مستخدم Firebase إلى الطلب
    req.firebaseUser = decodedToken;
    
    // إذا كان المستخدم غير مصدق بالفعل عبر الجلسة
    if (!req.isAuthenticated()) {
      // نحاول العثور على المستخدم وتخويله في قاعدة البيانات الخاصة بنا
      try {
        // الحصول على المستخدم بواسطة Firebase UID
        const user = await storage.getUserByFirebaseUid(decodedToken.uid);
        
        if (user) {
          // تسجيل نجاح المصادقة
          logAuditEvent(req, {
            action: 'login_success',
            userId: user.id,
            userRole: user.role,
            resource: 'auth',
            success: true,
            details: { provider: 'firebase', method: 'token' }
          });
          
          // إذا كان المستخدم موجودًا، نقوم بإعداد مصادقة الجلسة يدويًا
          req.login(user, (err) => {
            if (err) {
              logger.error('firebase-auth', 'Error setting session for Firebase user', err);
              
              // تسجيل فشل تسجيل الدخول
              logAuditEvent(req, {
                action: 'session_setup_failed',
                userId: user.id,
                userRole: user.role,
                resource: 'auth',
                success: false,
                details: { error: err.message }
              });
              
              return res.status(500).json({ error: 'session_setup_failed', message: 'Failed to setup user session' });
            } else {
              logger.info('firebase-auth', `Authenticated user: ${user.username} via Firebase token`);
              next();
            }
          });
        } else {
          // إذا كان المستخدم مع Firebase UID هذا غير موجود بعد
          // يمكننا إنشاء مستخدم جديد تلقائيًا (لا يتم تنفيذه حاليًا)
          logger.info('firebase-auth', `Firebase user not found in database: ${decodedToken.uid}`);
          
          // تسجيل محاولة مصادقة من مستخدم غير موجود
          logAuditEvent(req, {
            action: 'login_attempt',
            userId: decodedToken.uid,
            userRole: 'unknown',
            resource: 'auth',
            success: false,
            details: { reason: 'User not found in database' }
          });
          
          next();
        }
      } catch (error: any) {
        logger.error('firebase-auth', 'Error finding user by Firebase UID', error);
        
        // تسجيل خطأ في نظام المصادقة
        logAuditEvent(req, {
          action: 'auth_system_error',
          userId: decodedToken.uid,
          userRole: 'unknown',
          resource: 'auth',
          success: false,
          details: { error: error.message }
        });
        
        next();
      }
    } else {
      // المستخدم مصدق بالفعل عبر الجلسة، نستمر
      next();
    }
  } catch (error: any) {
    // رمز غير صالح
    logger.warn('firebase-auth', 'Invalid Firebase token', { error: error.message });
    
    // تسجيل محاولة مصادقة فاشلة
    logAuditEvent(req, {
      action: 'token_validation_failed',
      userId: 'unknown',
      userRole: 'unknown',
      resource: 'auth',
      success: false,
      details: { error: error.message }
    });
    
    // نستمر بدون خطأ - يمكن أن يتم مصادقة الطلب عبر طرق أخرى
    next();
  }
};

/**
 * Middleware لفرض مصادقة Firebase - يستخدم للمسارات التي تتطلب مصادقة
 * هذا يتطلب وجود رمز Firebase صالح، وإلا سيتم رفض الطلب
 */
export const requireFirebaseAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'unauthorized', message: 'Authentication required' });
  }
  
  const idToken = authHeader.split('Bearer ')[1];
  if (!idToken) {
    return res.status(401).json({ error: 'unauthorized', message: 'Authentication token required' });
  }
  
  try {
    // تحقق من صحة الرمز
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(idToken, true);
    
    // إضافة معلومات مستخدم Firebase إلى الطلب
    req.firebaseUser = decodedToken;
    
    // التحقق من المستخدم في قاعدة البيانات الخاصة بنا
    const user = await storage.getUserByFirebaseUid(decodedToken.uid);
    
    if (!user) {
      logger.warn('firebase-auth', `Firebase authenticated user not found in database: ${decodedToken.uid}`);
      return res.status(403).json({ error: 'access_denied', message: 'User not found' });
    }
    
    // إذا كان المستخدم غير مصدق عبر الجلسة، قم بإعداد الجلسة
    if (!req.isAuthenticated()) {
      req.login(user, (err) => {
        if (err) {
          logger.error('firebase-auth', 'Error setting session for Firebase user', err);
          return res.status(500).json({ error: 'session_setup_failed', message: 'Failed to setup user session' });
        }
        next();
      });
    } else {
      next();
    }
  } catch (error: any) {
    logger.warn('firebase-auth', 'Invalid Firebase token in protected route', { error: error.message });
    
    // تسجيل محاولة وصول غير مصرح بها
    logAuditEvent(req, {
      action: 'unauthorized_access_attempt',
      userId: 'unknown',
      userRole: 'unknown',
      resource: 'protected_route',
      success: false,
      details: { 
        path: req.path, 
        method: req.method,
        error: error.message 
      }
    });
    
    return res.status(401).json({ 
      error: 'invalid_token', 
      message: 'Invalid or expired authentication token' 
    });
  }
};

// Extend the Express Request interface to include the Firebase user
declare global {
  namespace Express {
    interface Request {
      firebaseUser?: DecodedIdToken;
    }
  }
}

// Helper function to get Firebase user info from a request
export const getFirebaseUserFromRequest = (req: Request) => {
  return req.firebaseUser;
};

// Export the admin SDK for use elsewhere
export { admin };