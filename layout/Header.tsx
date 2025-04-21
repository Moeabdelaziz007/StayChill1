import { useState, useEffect, createContext, useContext } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import LoginModal from "@/components/auth/LoginModal";
import RegisterModal from "@/components/auth/RegisterModal";
import SearchBar from "@/components/ui/SearchBar";
import { useTranslation } from "@/lib/i18n";
import { DirectionalIcon } from "@/components/ui/directional-icon";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuGroup,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";
import { 
  Moon, 
  Sun, 
  Globe, 
  Search, 
  Check, 
  ChevronsUpDown, 
  PlusCircle, 
  ArrowUpRight, 
  Calendar, 
  Users, 
  MapPin,
  Menu,
  Home,
  Building,
  Utensils,
  LogOut,
  User,
  Settings,
  Trophy,
  Heart,
  BookOpen
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


// Theme Context
const ThemeContext = createContext<{
  theme: 'light' | 'dark'; 
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}>({
  theme: 'light',
  toggleTheme: () => {},
  setTheme: () => {}
});

const ThemeProvider = ({ 
  children, 
  defaultTheme = 'system' 
}: { 
  children: React.ReactNode;
  defaultTheme?: string;
}) => {
  // Use localStorage to persist theme choice if available
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    // Check if a theme is stored in localStorage
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark' || savedTheme === 'light') {
        return savedTheme;
      }
      
      // If "system" preference or not set, use system preference
      if (defaultTheme === 'system' || !savedTheme) {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          return 'dark';
        }
      }
    }
    return 'light';
  });

  // Listen for changes in system preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      if (defaultTheme === 'system') {
        setThemeState(e.matches ? 'dark' : 'light');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [defaultTheme]);

  useEffect(() => {
    // Apply dark mode class to document element
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Save theme choice to localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };
  
  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button 
            onClick={toggleTheme} 
            className={`
              p-2 rounded-full 
              ${theme === 'light' 
                ? 'bg-gray-100 hover:bg-gray-200 text-gray-800' 
                : 'bg-gray-700 hover:bg-gray-600 text-[#FFD700]'
              } 
              transition-all duration-300 transform hover:scale-105
            `}
            aria-label={theme === 'light' ? 'تبديل للوضع المظلم' : 'تبديل للوضع الفاتح'}
          >
            {theme === 'light' ? 
              <Moon className="h-5 w-5" /> : 
              <Sun className="h-5 w-5" />
            }
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{theme === 'light' ? 'تفعيل الوضع المظلم' : 'تفعيل الوضع الفاتح'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Language provider - could be expanded to use i18n library
type Language = 'ar' | 'en';

const LanguageContext = createContext<{
  language: Language;
  setLanguage: (lang: Language) => void;
}>({
  language: 'ar',
  setLanguage: () => {},
});

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguage] = useState<Language>('ar');
  
  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

const LanguageSelector = () => {
  const { locale, setLocale } = useTranslation();
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-1">
          <Globe className="h-4 w-4" />
          <span className="hidden md:inline capitalize">{locale === 'ar' ? 'العربية' : 'English'}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>اختر اللغة</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setLocale('ar')} className="flex justify-between items-center">
          <span>العربية</span>
          {locale === 'ar' && <Check className="h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLocale('en')} className="flex justify-between items-center">
          <span>English</span>
          {locale === 'en' && <Check className="h-4 w-4" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Advanced search component
const AdvancedSearch = () => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="sm" className="rounded-full">
            <Search className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>بحث متقدم</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Enhanced header component with language and advanced search
const Header = () => {
  const themeContext = useContext(ThemeContext);
  const { theme, toggleTheme } = themeContext;
  const { user, logoutMutation } = useAuth();
  
  const logout = async () => {
    await logoutMutation.mutateAsync();
  };
  const [location, setLocation] = useLocation();
  const isMobile = useMobile();

  const [language, setLanguage] = useState<Language>('ar');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);

  // Close modals when user logs in
  useEffect(() => {
    if (user) {
      setIsLoginModalOpen(false);
      setIsRegisterModalOpen(false);
    }
  }, [user]);

  const handleLoginClick = () => {
    setIsLoginModalOpen(true);
  };

  const handleRegisterClick = () => {
    setIsRegisterModalOpen(true);
  };

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  const getInitials = (name?: string) => {
    if (!name) return "SC";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const getAdminUrl = () => {
    if (user?.role === "super_admin" || user?.role === "superadmin") return "/admin/dashboard";
    if (user?.role === "property_admin" || user?.role === "propertyadmin") return "/admin/property-dashboard";
    return "";
  };

  return (
    <header className={`w-full border-b border-gray-200 bg-white dark:bg-gray-800 fixed top-0 z-50`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/">
              <div className="flex items-center cursor-pointer">
                <img 
                  src="/assets/brand/logo.svg" 
                  alt="StayChill Logo" 
                  className="h-10"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src = '';
                    e.currentTarget.onerror = null;
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      parent.innerHTML = `
                        <span class="text-xl font-bold text-brand flex items-center">
                          StayChill
                        </span>
                      `;
                    }
                  }}
                />
              </div>
            </Link>
          </div>

          {/* Search Bar (Desktop) */}
          {!isMobile && (
            <div className="hidden md:flex items-center justify-center flex-1 max-w-2xl mx-8">
              <SearchBar />
            </div>
          )}

          {/* Navigation Links */}
          <nav className="flex items-center space-x-2 md:space-x-4">
            {user?.role === "property_admin" || user?.role === "propertyadmin" || user?.role === "super_admin" || user?.role === "superadmin" ? (
              <Link to={getAdminUrl()}>
                <Button variant="ghost" size="sm" className="hidden md:flex">
                  Admin Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/search">
                  <Button variant="ghost" size="sm" className="hidden md:flex">
                    Find a Place
                  </Button>
                </Link>
                <Link to="/restaurants">
                  <Button variant="ghost" size="sm" className="hidden md:flex">
                    Restaurants
                  </Button>
                </Link>
                <Link to="/coming-soon">
                  <Button variant="ghost" size="sm" className="hidden md:flex items-center gap-1">
                    <span>قريباً</span>
                    <Badge variant="outline" className="bg-blue-100/20 text-blue-500 border-blue-200/30 text-xs">جديد</Badge>
                  </Button>
                </Link>
                {user && (
                  <Link to="/trip-planning">
                    <Button variant="ghost" size="sm" className="hidden md:flex items-center gap-1">
                      <span>Trip Planning</span>
                      <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200 text-xs">New</Badge>
                    </Button>
                  </Link>
                )}
              </>
            )}

            {/* Points/Rewards Button */}
            {user && (
              <Link to="/rewards">
                <Button variant="ghost" size="sm" className="hidden md:flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-2 text-brand-orange">
                    <path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2z" />
                  </svg>
                  <span>{user.rewardPoints} Points</span>
                </Button>
              </Link>
            )}
            
            {/* Language Selector */}
            <LanguageSelector />
            
            {/* Theme Toggle */}
            <div className="mx-1">
              <ThemeToggle />
            </div>
            
            {/* Advanced Search Button */}
            <Sheet open={isAdvancedSearchOpen} onOpenChange={setIsAdvancedSearchOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="rounded-full w-8 h-8 p-0 flex items-center justify-center">
                  <Search className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>بحث متقدم</SheetTitle>
                  <SheetDescription>
                    حدد معايير البحث المتقدمة للعثور على أفضل العقارات
                  </SheetDescription>
                </SheetHeader>
                
                <div className="grid gap-6 py-6">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">المنطقة</h4>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between">
                          <span>اختر المنطقة</span>
                          <ChevronsUpDown className="h-4 w-4 opacity-50" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-full">
                        <DropdownMenuItem>رأس الحكمة</DropdownMenuItem>
                        <DropdownMenuItem>شرم الشيخ</DropdownMenuItem>
                        <DropdownMenuItem>الساحل الشمالي</DropdownMenuItem>
                        <DropdownMenuItem>مارينا</DropdownMenuItem>
                        <DropdownMenuItem>مرسى مطروح</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">التاريخ</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <Button variant="outline" className="justify-start text-left font-normal">
                        <Calendar className="mr-2 h-4 w-4" />
                        <span>تاريخ الوصول</span>
                      </Button>
                      <Button variant="outline" className="justify-start text-left font-normal">
                        <Calendar className="mr-2 h-4 w-4" />
                        <span>تاريخ المغادرة</span>
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">عدد الضيوف</h4>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <Users className="mr-2 h-4 w-4" />
                      <span>عدد الضيوف</span>
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">مزايا إضافية</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <DropdownMenuCheckboxItem checked>حمام سباحة</DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem>واي فاي</DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem>إطلالة بحر</DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem>مناسب للعائلات</DropdownMenuCheckboxItem>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">نطاق السعر</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <Button variant="outline" className="justify-start text-left font-normal">
                        <span>الحد الأدنى</span>
                      </Button>
                      <Button variant="outline" className="justify-start text-left font-normal">
                        <span>الحد الأقصى</span>
                      </Button>
                    </div>
                  </div>
                </div>
                
                <SheetFooter>
                  <Button type="submit" className="w-full bg-[#FFD700] hover:bg-[#e5c100] text-[#00182A] font-bold">
                    بحث متقدم
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>

            {/* User Menu Placeholder - Theme toggle already added above */}

            {/* User Menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <div className="flex-shrink-0 flex items-center">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar || undefined} alt={user.username} />
                        <AvatarFallback>{getInitials(`${user.firstName} ${user.lastName}`)}</AvatarFallback>
                      </Avatar>
                    </div>
                    {!isMobile && <span className="hidden md:inline">{user.username}</span>}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile">
                      <div className="w-full cursor-pointer">Profile</div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/bookings">
                      <div className="w-full cursor-pointer">My Bookings</div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/rewards">
                      <div className="w-full cursor-pointer">
                        Rewards 
                        <Badge variant="outline" className="ml-2">
                          {user.rewardPoints} pts
                        </Badge>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/restaurants">
                      <div className="w-full cursor-pointer">
                        Restaurants
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/trip-planning">
                      <div className="w-full cursor-pointer">
                        Trip Planning
                        <Badge variant="outline" className="ml-2 bg-yellow-100 text-yellow-800">
                          New
                        </Badge>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  {(user.role === "property_admin" || user.role === "propertyadmin" || user.role === "super_admin" || user.role === "superadmin") && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to={getAdminUrl()}>
                          <div className="w-full cursor-pointer">Admin Dashboard</div>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                {/* Use direct navigation to login page with Link component */}
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                {/* Continue to use modal for registration or use direct link */}
                <Link to="/register">
                  <Button size="sm">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>

      {/* Mobile Navigation and Search */}
      {isMobile && (
        <>
          {/* Mobile Search Bar */}
          <div className="md:hidden px-4 pb-3">
            <Sheet>
              <SheetTrigger asChild>
                <div className="flex items-center border border-gray-300 rounded-full px-4 py-2 shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700 cursor-pointer">
                  <Search className="h-4 w-4 text-dark-gray dark:text-gray-300" />
                  <span className="ml-3 block w-full text-dark-gray dark:text-gray-300">Where are you going?</span>
                </div>
              </SheetTrigger>
              <SheetContent side="top" className="pt-6 bg-white dark:bg-gray-900">
                <SearchBar />
              </SheetContent>
            </Sheet>
          </div>
          
          {/* Mobile Bottom Navigation Bar */}
          <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-2 py-1 flex justify-around items-center z-50 md:hidden">
            <Link to="/" className="flex flex-col items-center p-2">
              <Home className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <span className="text-xs mt-1 text-gray-500 dark:text-gray-400">Home</span>
            </Link>
            <Link to="/search" className="flex flex-col items-center p-2">
              <Building className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <span className="text-xs mt-1 text-gray-500 dark:text-gray-400">Places</span>
            </Link>
            <Link to="/services" className="flex flex-col items-center p-2">
              <Utensils className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <span className="text-xs mt-1 text-gray-500 dark:text-gray-400">Services</span>
            </Link>
            {user ? (
              <Sheet>
                <SheetTrigger asChild>
                  <button className="flex flex-col items-center p-2">
                    <Menu className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    <span className="text-xs mt-1 text-gray-500 dark:text-gray-400">Menu</span>
                  </button>
                </SheetTrigger>
                <SheetContent side="right" className="bg-white dark:bg-gray-900 pt-6">
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center p-4 mb-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.avatar || undefined} alt={user.username} />
                        <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
                      </Avatar>
                      <div className="ml-4">
                        <p className="font-medium">{user.username}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                      </div>
                    </div>
                    
                    <Link to="/profile" className="flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                      <User className="h-5 w-5 mr-3 text-primary" />
                      <span>Profile</span>
                    </Link>
                    
                    <Link to="/bookings" className="flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                      <Calendar className="h-5 w-5 mr-3 text-primary" />
                      <span>My Bookings</span>
                    </Link>
                    
                    <Link to="/rewards" className="flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                      <Trophy className="h-5 w-5 mr-3 text-primary" />
                      <span>Rewards ({user.rewardPoints} Points)</span>
                    </Link>
                    
                    <Link to="/favorites" className="flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                      <Heart className="h-5 w-5 mr-3 text-primary" />
                      <span>Favorites</span>
                    </Link>
                    
                    <Link to="/trip-planning" className="flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                      <BookOpen className="h-5 w-5 mr-3 text-primary" />
                      <span>Trip Planning</span>
                    </Link>
                    
                    {(user?.role === "property_admin" || user?.role === "propertyadmin" || user?.role === "super_admin" || user?.role === "superadmin") && (
                      <Link to={getAdminUrl()} className="flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                        <Settings className="h-5 w-5 mr-3 text-primary" />
                        <span>Admin Dashboard</span>
                      </Link>
                    )}
                    
                    <button 
                      onClick={handleLogout}
                      className="flex items-center p-3 mt-4 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <LogOut className="h-5 w-5 mr-3" />
                      <span>Logout</span>
                    </button>
                  </div>
                </SheetContent>
              </Sheet>
            ) : (
              <button 
                onClick={handleLoginClick}
                className="flex flex-col items-center p-2"
              >
                <User className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                <span className="text-xs mt-1 text-gray-500 dark:text-gray-400">Login</span>
              </button>
            )}
          </div>
        </>
      )}

      {/* Auth Modals */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
        onRegisterClick={() => {
          setIsLoginModalOpen(false);
          setIsRegisterModalOpen(true);
        }}
      />

      <RegisterModal 
        isOpen={isRegisterModalOpen} 
        onClose={() => setIsRegisterModalOpen(false)} 
        onLoginClick={() => {
          setIsRegisterModalOpen(false);
          setIsLoginModalOpen(true);
        }}
      />
    </header>
  );
};

export default Header;
export {ThemeProvider};