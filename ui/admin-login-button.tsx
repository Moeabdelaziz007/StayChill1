import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { LockKeyhole } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AdminLoginButtonProps {
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function AdminLoginButton({ 
  className = "",
  variant = "ghost", 
  size = "default"
}: AdminLoginButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link to="/auth?tab=admin">
            <Button 
              variant={variant} 
              size={size} 
              className={`flex items-center gap-2 ${className}`}
            >
              <LockKeyhole className="h-4 w-4" />
              <span className="hidden md:inline">دخول المشرفين</span>
            </Button>
          </Link>
        </TooltipTrigger>
        <TooltipContent>
          <p>تسجيل دخول للمشرفين ومدراء النظام</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}