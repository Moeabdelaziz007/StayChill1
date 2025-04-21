import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../constants/roles';
import { logAuditEvent } from '../firebase-admin';

/**
 * Middleware للتحقق من صلاحيات المستخدم وحماية routes من الوصول غير المصرح به
 * هذا الميدلوير يتحقق مما إذا كان دور المستخدم من ضمن الأدوار المسموح بها للوصول للمسار
 * 
 * @param allowedRoles مصفوفة من الأدوار المسموح لها بالوصول
 * @returns Middleware function تقوم بالتحقق من الصلاحيات
 * 
 * مثال استخدام:
 * router.get('/admin/users', authenticateUser, authorizeRoles(UserRole.SUPER_ADMIN), getAllUsers);
 */
export const authorizeRoles = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // التحقق من وجود المستخدم في الطلب
    if (!req.user) {
      logAuditEvent(req, {
        action: 'authorization_check',
        userId: 'anonymous',
        userRole: 'none',
        resource: req.path,
        success: false,
        details: {
          reason: 'User not authenticated',
          requiredRoles: allowedRoles
        }
      });
      
      return res.status(401).json({
        message: 'غير مصرح به: يجب تسجيل الدخول أولاً',
        error: 'Unauthorized'
      });
    }
    
    // الحصول على دور المستخدم
    const userRole = req.user.role;
    
    // التحقق من صلاحية الدور
    if (!allowedRoles.includes(userRole as UserRole)) {
      logAuditEvent(req, {
        action: 'authorization_check',
        userId: req.user.id,
        userRole: userRole || 'undefined',
        resource: req.path,
        success: false,
        details: {
          reason: 'Insufficient permissions',
          userRole: userRole,
          requiredRoles: allowedRoles
        }
      });
      
      return res.status(403).json({
        message: 'ممنوع: ليس لديك الصلاحيات الكافية للوصول لهذا المورد',
        error: 'Forbidden'
      });
    }
    
    // تسجيل الوصول الناجح في سجل التدقيق
    logAuditEvent(req, {
      action: 'authorization_check',
      userId: req.user.id,
      userRole: userRole || 'undefined',
      resource: req.path,
      success: true,
      details: {
        requiredRoles: allowedRoles
      }
    });
    
    // السماح بالمتابعة إذا كان المستخدم لديه الصلاحيات المطلوبة
    next();
  };
};

/**
 * Middleware للتحقق من مصادقة المستخدم فقط
 * يستخدم للتأكد من أن المستخدم مسجل دخول بغض النظر عن دوره
 */
export const authenticateUser = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    logAuditEvent(req, {
      action: 'authentication_check',
      userId: 'anonymous',
      userRole: 'none',
      resource: req.path,
      success: false,
      details: {
        reason: 'User not authenticated'
      }
    });
    
    return res.status(401).json({
      message: 'غير مصرح به: يجب تسجيل الدخول أولاً',
      error: 'Unauthorized'
    });
  }
  
  // تسجيل المصادقة الناجحة في سجل التدقيق
  logAuditEvent(req, {
    action: 'authentication_check',
    userId: req.user.id,
    userRole: req.user.role || 'undefined',
    resource: req.path,
    success: true
  });
  
  next();
};

/**
 * Middleware للتحقق مما إذا كان المستخدم مالك المورد أو مسؤول
 * يستخدم للمسارات التي يجب أن يكون فيها المستخدم إما مالك المورد أو مسؤول
 * 
 * @param getResourceOwnerId دالة تستخرج معرف مالك المورد من الطلب
 */
export const authorizeOwnerOrAdmin = (
  getResourceOwnerId: (req: Request) => number | string | Promise<number | string>
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // التحقق من وجود المستخدم في الطلب
    if (!req.user) {
      return res.status(401).json({
        message: 'غير مصرح به: يجب تسجيل الدخول أولاً',
        error: 'Unauthorized'
      });
    }
    
    // التحقق ما إذا كان المستخدم مسؤول - المسؤولون لديهم وصول إلى جميع الموارد
    if (req.user.role === UserRole.SUPER_ADMIN || req.user.role === UserRole.PROPERTY_ADMIN) {
      next();
      return;
    }
    
    try {
      // الحصول على معرف مالك المورد
      const ownerId = await getResourceOwnerId(req);
      
      // التحقق مما إذا كان المستخدم هو مالك المورد
      if (req.user.id.toString() === ownerId.toString()) {
        next();
        return;
      }
      
      // إذا وصلنا إلى هنا، فإن المستخدم ليس مالكًا وليس مسؤولًا
      logAuditEvent(req, {
        action: 'owner_authorization_check',
        userId: req.user.id,
        userRole: req.user.role || 'undefined',
        resource: req.path,
        resourceId: ownerId.toString(),
        success: false,
        details: {
          reason: 'User is neither owner nor admin'
        }
      });
      
      res.status(403).json({
        message: 'ممنوع: ليس لديك الصلاحيات الكافية للوصول لهذا المورد',
        error: 'Forbidden'
      });
    } catch (error) {
      // التعامل مع أي أخطاء في الحصول على معرف المالك
      console.error('Error in authorizeOwnerOrAdmin middleware:', error);
      res.status(500).json({
        message: 'حدث خطأ أثناء التحقق من الصلاحيات',
        error: 'Internal Server Error'
      });
    }
  };
};