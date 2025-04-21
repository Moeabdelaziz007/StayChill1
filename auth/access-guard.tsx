import React, { ReactNode } from 'react';
import { useLocation, navigate } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { hasAccessTier } from '@/lib/access-control';
import { useToast } from '@/hooks/use-toast';

interface AccessGuardProps {
  requiredTier: string;
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
  showToast?: boolean;
  loadingComponent?: ReactNode;
}

/**
 * مكون AccessGuard - يحمي المحتوى بناءً على مستوى صلاحيات المستخدم
 * 
 * @param requiredTier - المستوى المطلوب للوصول
 * @param children - المحتوى المراد حمايته
 * @param fallback - محتوى بديل ليتم عرضه إذا لم يكن لدى المستخدم صلاحية كافية
 * @param redirectTo - مسار إعادة التوجيه إذا لم يكن لدى المستخدم صلاحية كافية
 * @param showToast - عرض رسالة تنبيه عند عدم وجود صلاحية كافية
 * @param loadingComponent - مكون يظهر أثناء التحقق من الصلاحيات
 */
const AccessGuard: React.FC<AccessGuardProps> = ({
  requiredTier,
  children,
  fallback,
  redirectTo,
  showToast = true,
  loadingComponent
}) => {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // أثناء تحميل بيانات المستخدم
  if (isLoading) {
    return loadingComponent ? (
      <>{loadingComponent}</>
    ) : (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  // إذا لم يكن هناك مستخدم مسجل دخوله
  if (!user) {
    if (redirectTo) {
      // إذا كان هناك مسار لإعادة التوجيه
      if (showToast) {
        toast({
          title: "يجب تسجيل الدخول",
          description: "يرجى تسجيل الدخول للوصول إلى هذا المحتوى",
          variant: "destructive"
        });
      }
      
      // استخدام navigate بدلاً من إعادة التعيين المباشر
      setLocation(redirectTo);
      return null;
    }
    
    // إذا كان هناك محتوى بديل
    return fallback ? <>{fallback}</> : null;
  }
  
  // التحقق من مستوى الصلاحية
  const hasAccess = hasAccessTier(user, requiredTier);
  
  if (!hasAccess) {
    if (redirectTo) {
      // إذا كان هناك مسار لإعادة التوجيه
      if (showToast) {
        toast({
          title: "صلاحية غير كافية",
          description: "ليس لديك صلاحية كافية للوصول إلى هذا المحتوى",
          variant: "destructive"
        });
      }
      
      // استخدام navigate بدلاً من إعادة التعيين المباشر
      setLocation(redirectTo);
      return null;
    }
    
    // إذا كان هناك محتوى بديل
    return fallback ? <>{fallback}</> : null;
  }
  
  // إذا كان لدى المستخدم الصلاحية المطلوبة
  return <>{children}</>;
};

export default AccessGuard;