import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { GoogleSignInButton } from "./GoogleSignInButton";

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { loginMutation } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

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
      await loginMutation.mutateAsync({ email, password });
      
      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/");
      }
    } catch (error: any) {
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6 border border-blue-200 rounded-lg bg-white shadow-sm">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold">Welcome Back</h2>
        <p className="text-gray-500">
          Sign in to continue to StayChill
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="your@email.com"
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
      </form>
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-gray-500">Or continue with</span>
        </div>
      </div>
      
      <GoogleSignInButton />
      
      <div className="text-center text-sm">
        <p className="text-gray-500">
          Don't have an account?{" "}
          <a 
            onClick={() => navigate("/register")} 
            className="font-medium text-blue-600 hover:text-blue-500 cursor-pointer"
          >
            Register here
          </a>
        </p>
        <p className="mt-2 text-gray-500">
          Are you an admin?{" "}
          <a 
            onClick={() => navigate("/auth?tab=admin")} 
            className="font-medium text-blue-600 hover:text-blue-500 cursor-pointer"
          >
            Admin login
          </a>
        </p>
      </div>
    </div>
  );
}