import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { AuthProvider } from "@/hooks/use-auth";
import { setupApiClient } from "@/lib/api-client";

// إعداد نظام الاتصال بالـ API وإعادة المحاولة
setupApiClient();

// تم نقل إعداد نظام الأخطاء إلى NetworkErrorProvider في App.tsx

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <App />
        <Toaster />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);
