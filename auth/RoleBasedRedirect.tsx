import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { getRedirectPathByRole } from "@/lib/route-protection";
import { UserRole } from "@/constants/userRoles";
import { Loader2 } from "lucide-react";

interface RoleBasedRedirectProps {
  disabledPaths?: string[];
}

/**
 * مكون يوجه المستخدم تلقائيا حسب دوره بعد تسجيل الدخول
 * يمكن استخدامه في صفحة تسجيل الدخول أو أي صفحة لا ينبغي للمستخدم المصادق رؤيتها
 */
export const RoleBasedRedirect = ({ disabledPaths = ["/auth"] }: RoleBasedRedirectProps) => {
  const { user, isLoading } = useAuth();
  const [location, navigate] = useLocation();

  useEffect(() => {
    // تنفيذ التوجيه فقط إذا كان المستخدم مسجل الدخول وانتهت عملية التحميل
    // ولا يتواجد المستخدم في مسار معفى من التوجيه
    if (user && !isLoading && !disabledPaths.includes(location)) {
      const redirectPath = getRedirectPathByRole(user.role as UserRole);
      navigate(redirectPath);
    }
  }, [user, isLoading, navigate, location, disabledPaths]);

  // لا يعرض شيئا في واجهة المستخدم
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return null;
};