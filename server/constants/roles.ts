/**
 * تعريف أدوار المستخدمين في النظام
 * يجب استخدام هذه القيم في جميع أنحاء التطبيق بدلاً من استخدام السلاسل النصية مباشرة
 */
export enum UserRole {
  CUSTOMER = "customer",
  PROPERTY_ADMIN = "property_admin",
  SUPER_ADMIN = "super_admin",
}

/**
 * التحقق مما إذا كان الدور المحدد هو دور إداري
 * @param role دور المستخدم للتحقق منه
 * @returns boolean قيمة منطقية تشير إلى ما إذا كان الدور إدارياً
 */
export function isAdminRole(role: UserRole | string | undefined | null): boolean {
  if (!role) return false;
  
  // تحويل السلسلة النصية إلى enum في حالة تم تمرير سلسلة نصية
  const userRole = typeof role === 'string' 
    ? Object.values(UserRole).find(r => r === role.toLowerCase())
    : role;
  
  return userRole === UserRole.SUPER_ADMIN || userRole === UserRole.PROPERTY_ADMIN;
}

/**
 * التحقق مما إذا كان الدور المحدد هو دور مسؤول أعلى
 * @param role دور المستخدم للتحقق منه
 * @returns boolean قيمة منطقية تشير إلى ما إذا كان الدور للمسؤول الأعلى
 */
export function isSuperAdmin(role: UserRole | string | undefined | null): boolean {
  if (!role) return false;
  
  // تحويل السلسلة النصية إلى enum في حالة تم تمرير سلسلة نصية
  const userRole = typeof role === 'string' 
    ? Object.values(UserRole).find(r => r === role.toLowerCase())
    : role;
  
  return userRole === UserRole.SUPER_ADMIN;
}

/**
 * التحقق مما إذا كان الدور المحدد هو دور مسؤول عقارات
 * @param role دور المستخدم للتحقق منه
 * @returns boolean قيمة منطقية تشير إلى ما إذا كان الدور لمسؤول عقارات
 */
export function isPropertyAdmin(role: UserRole | string | undefined | null): boolean {
  if (!role) return false;
  
  // تحويل السلسلة النصية إلى enum في حالة تم تمرير سلسلة نصية
  const userRole = typeof role === 'string' 
    ? Object.values(UserRole).find(r => r === role.toLowerCase())
    : role;
  
  return userRole === UserRole.PROPERTY_ADMIN;
}