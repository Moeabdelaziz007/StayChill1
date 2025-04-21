import { ReactNode, useEffect } from "react";
import { useLocation, useNavigate } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { checkRoleAccess } from "@/lib/route-protection";
import { UserRole } from "@/constants/userRoles";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  redirectTo?: string;
}

/**
 * مكون لحماية المسارات حسب أدوار المستخدمين
 */
export const ProtectedRoute = ({
  children,
  allowedRoles,
  redirectTo = "/auth"
}: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // انتظر اكتمال تحميل بيانات المستخدم
    if (!isLoading) {
      const hasAccess = user && checkRoleAccess(user.role as UserRole, allowedRoles);

      if (!hasAccess) {
        toast({
          title: "غير مصرح بالوصول",
          description: "ليس لديك صلاحية الوصول إلى هذه الصفحة.",
          variant: "destructive",
        });
        navigate(redirectTo);
      }
    }
  }, [user, isLoading, allowedRoles, navigate, redirectTo, toast]);

  // عرض حالة التحميل
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  // عرض المحتوى المحمي إذا كان المستخدم مصرح له
  if (user && checkRoleAccess(user.role as UserRole, allowedRoles)) {
    return <>{children}</>;
  }

  // لن يصل الكود هنا بسبب التوجيه في useEffect، ولكن هذا للاحتياط
  return null;
};