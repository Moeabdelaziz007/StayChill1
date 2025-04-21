import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/glass-card";
import { useAuth } from "@/hooks/use-auth";
import { Home, Search, CalendarDays, MessageCircle, User, MapPin } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface NavigationItem {
  icon: React.ElementType;
  label: string;
  href: string;
}

const MobileBottomNavigation = () => {
  const [location] = useLocation();
  const { user } = useAuth();
  const { t } = useTranslation();
  
  // Navigation items for the bottom bar
  const navigationItems: NavigationItem[] = [
    { icon: Home, label: t("nav.home"), href: "/" },
    { icon: Search, label: t("nav.search"), href: "/search" },
    { icon: MapPin, label: t("nav.locations"), href: "/destinations" },
    { icon: CalendarDays, label: t("nav.bookings"), href: user ? "/bookings" : "/auth?from=bookings" },
    { icon: User, label: t("nav.profile"), href: user ? "/profile" : "/auth?from=profile" },
  ];
  
  // Function to check if a nav item is active based on the current location
  const isActive = (href: string) => {
    if (href === "/" && location === "/") return true;
    if (href !== "/" && location.startsWith(href)) return true;
    return false;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
      <GlassCard 
        className="mx-auto w-full max-w-lg rounded-b-none rounded-t-2xl border-t border-white/20"
        variant="premium"
        shadow="none"
      >
        <nav className="flex items-center justify-around h-16">
          {navigationItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            
            return (
              <Link 
                key={`nav-${item.label}`} 
                href={item.href}
                className="flex flex-col items-center justify-center h-full w-16"
              >
                <div className={cn(
                  "flex flex-col items-center justify-center gap-1",
                  active ? "text-white" : "text-gray-400"
                )}>
                  <div className={cn(
                    "relative",
                    active && "after:content-[''] after:absolute after:bottom-[-10px] after:left-1/2 after:transform after:-translate-x-1/2 after:w-1 after:h-1 after:bg-white after:rounded-full"
                  )}>
                    <Icon className={cn("h-5 w-5", active && "text-primary")} />
                  </div>
                  <span className="text-[10px] font-medium">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </GlassCard>
    </div>
  );
};

export default MobileBottomNavigation;