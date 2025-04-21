import { UserRole } from "@/constants/userRoles";

/**
 * وظيفة للتحقق من صلاحية الوصول بناءً على دور المستخدم
 * @param userRole دور المستخدم الحالي
 * @param allowedRoles مصفوفة الأدوار المسموح لها بالوصول
 * @returns صحيح إذا كان الوصول مسموحًا، خطأ إذا كان غير مسموح
 */
export const checkRoleAccess = (
  userRole: UserRole | undefined | null,
  allowedRoles: UserRole[]
): boolean => {
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
};

/**
 * خريطة التوجيه بعد تسجيل الدخول حسب الأدوار
 */
export const roleRedirectMap: Record<UserRole, string> = {
  [UserRole.CUSTOMER]: "/dashboard",
  [UserRole.PROPERTY_ADMIN]: "/admin/property-dashboard",
  [UserRole.SUPER_ADMIN]: "/admin/super-dashboard"
};

/**
 * وظيفة للحصول على مسار التوجيه حسب دور المستخدم
 * @param userRole دور المستخدم
 * @returns مسار التوجيه المناسب
 */
export const getRedirectPathByRole = (userRole: UserRole | undefined | null): string => {
  if (!userRole) return "/auth";
  
  return roleRedirectMap[userRole] || "/dashboard";
};