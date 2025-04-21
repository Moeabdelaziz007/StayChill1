// ثوابت لمستويات الوصول المختلفة مرتبة تصاعديًا حسب الصلاحيات
export const ACCESS_TIERS = {
  BASE: '0', // الوصول الأساسي (للزوار)
  TIER_1: '1', // مستخدم مسجل
  TIER_2: '2', // مشرف عقارات
  TIER_3: '3', // مدير النظام
};

// تعريف الأدوار المختلفة ومستويات الوصول المرتبطة بها
export const ROLE_ACCESS_MAP: Record<string, string> = {
  'guest': ACCESS_TIERS.BASE,
  'Customer': ACCESS_TIERS.TIER_1,
  'Property_admin': ACCESS_TIERS.TIER_2,
  'super_admin': ACCESS_TIERS.TIER_3,
};

// وظائف للتحقق من مستويات الوصول

/**
 * التحقق مما إذا كان المستخدم لديه مستوى وصول معين أو أعلى
 * @param user - بيانات المستخدم
 * @param requiredTier - المستوى المطلوب للوصول
 * @returns true إذا كان لدى المستخدم المستوى المطلوب أو أعلى
 */
export const hasAccessTier = (user: any, requiredTier: string): boolean => {
  if (!user) return false;
  
  // الحصول على دور المستخدم
  const userRole = user.role || 'guest';
  
  // الحصول على مستوى وصول المستخدم بناءً على دوره
  const userTier = ROLE_ACCESS_MAP[userRole] || ACCESS_TIERS.BASE;
  
  // التحقق مما إذا كان مستوى المستخدم أعلى من أو يساوي المستوى المطلوب
  return userTier >= requiredTier;
};

/**
 * الحصول على أعلى مستوى وصول للمستخدم
 * @param user - بيانات المستخدم
 * @returns أعلى مستوى وصول للمستخدم
 */
export const getUserHighestTier = (user: any): string => {
  if (!user) return ACCESS_TIERS.BASE;
  
  // الحصول على دور المستخدم
  const userRole = user.role || 'guest';
  
  // الحصول على مستوى وصول المستخدم بناءً على دوره
  return ROLE_ACCESS_MAP[userRole] || ACCESS_TIERS.BASE;
};

/**
 * التحقق مما إذا كان المستخدم لديه صلاحية للعمل على مورد معين
 * @param user - بيانات المستخدم
 * @param resource - المورد المطلوب (property, booking, etc)
 * @param action - الإجراء المطلوب (view, edit, delete, etc)
 * @param ownerId - معرف مالك المورد (اختياري)
 * @returns true إذا كان لدى المستخدم الصلاحية
 */
export const hasPermission = (
  user: any,
  resource: string,
  action: string,
  ownerId?: number
): boolean => {
  if (!user) return false;
  
  // الحصول على دور المستخدم
  const userRole = user.role || 'guest';
  
  // صلاحيات المدير العام
  if (userRole === 'super_admin') {
    return true; // المدير العام لديه جميع الصلاحيات
  }
  
  // صلاحيات مشرف العقارات
  if (userRole === 'Property_admin') {
    // يمكن لمشرف العقارات إدارة العقارات الخاصة به فقط
    if (resource === 'property') {
      if (ownerId && ownerId !== user.id) {
        return action === 'view'; // يمكنه فقط عرض عقارات الآخرين
      }
      return true; // يمكنه إدارة عقاراته الخاصة بشكل كامل
    }
    
    // يمكن لمشرف العقارات عرض وإدارة الحجوزات المرتبطة بعقاراته
    if (resource === 'booking') {
      return true; // يتم التحقق من ملكية العقار في المستوى التالي من التطبيق
    }
    
    // يمكن لمشرف العقارات عرض المراجعات وإدارتها لعقاراته
    if (resource === 'review') {
      return action === 'view' || action === 'respond';
    }
    
    // يمكن لمشرف العقارات عرض تحليلات عقاراته
    if (resource === 'analytics') {
      return action === 'view';
    }
  }
  
  // صلاحيات المستخدم العادي
  if (userRole === 'Customer') {
    // يمكن للمستخدم العادي عرض العقارات والمطاعم
    if (resource === 'property' || resource === 'restaurant') {
      return action === 'view';
    }
    
    // يمكن للمستخدم العادي عرض وإنشاء حجوزات لنفسه
    if (resource === 'booking' || resource === 'reservation') {
      if (action === 'view' || action === 'create') {
        return true;
      }
      
      if (action === 'edit' || action === 'cancel') {
        return ownerId === user.id; // يمكنه تعديل وإلغاء حجوزاته فقط
      }
    }
    
    // يمكن للمستخدم العادي إنشاء وتعديل المراجعات الخاصة به
    if (resource === 'review') {
      if (action === 'view') {
        return true;
      }
      
      if (action === 'create' || action === 'edit' || action === 'delete') {
        return ownerId === user.id; // يمكنه إدارة مراجعاته فقط
      }
    }
  }
  
  // صلاحيات الزائر
  if (userRole === 'guest') {
    // يمكن للزائر عرض العقارات والمطاعم والمراجعات فقط
    if ((resource === 'property' || resource === 'restaurant' || resource === 'review') && action === 'view') {
      return true;
    }
  }
  
  // في حالة عدم تحديد الصلاحية بشكل صريح
  return false;
};