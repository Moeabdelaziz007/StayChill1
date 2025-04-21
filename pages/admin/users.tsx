import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import AdminUserTable from "@/components/dashboard/AdminUserTable";

const AdminUsers = () => {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Check if user is super admin
    if (!user) {
      setIsLoading(false);
      return;
    }
    
    if (user.role !== "superadmin" && user.role !== "super_admin") {
      navigate("/");
      return;
    }
    
    setIsLoading(false);
  }, [user, navigate]);
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin w-8 h-8 border-4 border-brand border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  if (!user || (user.role !== "superadmin" && user.role !== "super_admin")) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p>You don't have permission to access this page.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-muted-foreground">
          Manage users and their roles
        </p>
      </div>
      
      <AdminUserTable />
    </div>
  );
};

export default AdminUsers;
