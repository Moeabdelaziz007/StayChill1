import { useState } from "react";
import { useAuth } from "@/hooks/use-auth"; // Fixed import path
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Loader2, Shield } from "lucide-react";

interface AdminLoginFormProps {
  onSuccess?: () => void;
}

export function AdminLoginForm({ onSuccess }: AdminLoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { adminLoginMutation } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Emergency login functionality has been completely removed as requested

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter your email and password",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // First try regular admin login
      await adminLoginMutation.mutateAsync({ 
        email, 
        password
      });
      
      if (onSuccess) {
        onSuccess();
      }
      
      // سيتم التعامل مع التوجيه في admin-login.tsx من خلال التحقق من دور المستخدم
      // لا نحتاج للتوجيه هنا لأن useEffect في صفحة admin-login سيتعامل مع التوجيه
      // بناءً على الدور الحقيقي للمستخدم من قاعدة البيانات
    } catch (error: any) {
      console.error("Admin login error:", error);
      
      toast({
        title: "Login failed",
        description: error.message || "Invalid admin credentials. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6 border border-blue-200 rounded-lg bg-white shadow-sm">
      <div className="space-y-2 text-center">
        <div className="flex justify-center">
          <Shield className="h-12 w-12 text-amber-500" />
        </div>
        <h2 className="text-2xl font-bold">Admin Portal</h2>
        <p className="text-gray-500">
          Sign in to access the administration panel
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="admin@staychill.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        
        <Button 
          type="submit" 
          className="w-full" 
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </Button>
        
        {/* Emergency access button has been completely removed as requested */}
      </form>
      
      <div className="text-center text-sm space-y-2">
        <p className="text-gray-500">
          Not an admin?{" "}
          <a 
            onClick={() => navigate("/auth")} 
            className="font-medium text-blue-600 hover:text-blue-500 cursor-pointer"
          >
            Regular login
          </a>
        </p>
        {/* Emergency access link has been completely removed as requested */}
      </div>
    </div>
  );
}