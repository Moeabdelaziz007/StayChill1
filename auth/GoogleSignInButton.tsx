import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { FcGoogle } from "react-icons/fc";

interface GoogleSignInButtonProps {
  className?: string;
}

export function GoogleSignInButton({ className = "" }: GoogleSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { googleLoginMutation } = useAuth();
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await googleLoginMutation.mutateAsync();
    } catch (error: any) {
      console.error("Google sign in error:", error);
      toast({
        title: "Sign in failed",
        description: error.message || "Failed to sign in with Google. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      type="button"
      disabled={isLoading}
      className={`w-full flex items-center justify-center gap-2 ${className}`}
      onClick={handleGoogleSignIn}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <FcGoogle className="h-5 w-5" />
      )}
      {isLoading ? "Signing in..." : "Sign in with Google"}
    </Button>
  );
}