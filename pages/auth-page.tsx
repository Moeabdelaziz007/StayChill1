import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { 
  Eye, EyeOff, Mail, Lock, User, LogIn, ArrowRight, ChevronLeft, 
  Home, Compass, Building, Shield, UserCog, GraduationCap
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RoleBasedRedirect } from '@/components/auth/RoleBasedRedirect';
import { getRedirectPathByRole } from '@/lib/route-protection';
import { UserRole } from '@/constants/userRoles';

// Validation schemas
const loginSchema = z.object({
  email: z.string().min(3, { message: 'البريد الإلكتروني مطلوب' }),
  password: z.string().min(6, { message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' }),
  rememberMe: z.boolean().optional()
});

const adminLoginSchema = z.object({
  email: z.string().min(3, { message: 'البريد الإلكتروني مطلوب' }),
  password: z.string().min(6, { message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' }),
});

const registerSchema = z.object({
  username: z.string().min(3, { message: 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل' }),
  email: z.string().email({ message: 'البريد الإلكتروني غير صالح' }),
  password: z.string().min(6, { message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' }),
  firstName: z.string().min(2, { message: 'الاسم الأول مطلوب' }),
  lastName: z.string().min(2, { message: 'الاسم الأخير مطلوب' }),
  agreeTerms: z.boolean().refine(val => val === true, {
    message: 'يجب الموافقة على الشروط والأحكام'
  })
});

type LoginForm = z.infer<typeof loginSchema>;
type AdminLoginForm = z.infer<typeof adminLoginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export default function AuthPage() {
  // Authentication type, from URL query parameter
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  const authType = searchParams.get('tab') || searchParams.get('type') || '';
  
  const [activeTab, setActiveTab] = useState(() => {
    // Set initial tab based on query parameter
    if (authType === 'admin') return 'admin';
    return 'login';
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const { 
    user, 
    loginMutation, 
    adminLoginMutation, 
    registerMutation, 
    googleLoginMutation 
  } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      // استخدام وظيفة getRedirectPathByRole للحصول على المسار المناسب
      const redirectPath = getRedirectPathByRole(user.role as UserRole);
      navigate(redirectPath);
    }
  }, [user, navigate]);

  // Forms
  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false
    }
  });

  const adminLoginForm = useForm<AdminLoginForm>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      agreeTerms: false
    }
  });

  // Handle Google Login
  const handleGoogleLogin = useCallback(() => {
    googleLoginMutation.mutate(undefined, {
      onSuccess: () => {
        toast({
          title: "تم تسجيل الدخول بنجاح",
          description: "مرحباً بك في StayChill",
        });
      },
      onError: (error) => {
        toast({
          title: "خطأ في تسجيل الدخول",
          description: error.message,
          variant: "destructive",
        });
      }
    });
  }, [googleLoginMutation, toast]);

  // Handle form submissions
  const onLogin = (data: LoginForm) => {
    loginMutation.mutate({
      email: data.email,
      password: data.password
    }, {
      onSuccess: () => {
        toast({
          title: "تم تسجيل الدخول بنجاح",
          description: "مرحباً بك في StayChill",
        });
      },
      onError: (error) => {
        toast({
          title: "خطأ في تسجيل الدخول",
          description: error.message,
          variant: "destructive",
        });
      }
    });
  };

  const onAdminLogin = (data: AdminLoginForm) => {
    adminLoginMutation.mutate({
      email: data.email,
      password: data.password
    }, {
      onSuccess: (user) => {
        toast({
          title: "تم تسجيل دخول المسؤول بنجاح",
          description: `مرحباً بك ${user.firstName || ''} ${user.lastName || ''}`,
        });
        
        // استخدام وظيفة getRedirectPathByRole للحصول على المسار المناسب
        const redirectPath = getRedirectPathByRole(user.role as UserRole);
        navigate(redirectPath);
      },
      onError: (error) => {
        toast({
          title: "خطأ في تسجيل دخول المسؤول",
          description: error.message,
          variant: "destructive",
        });
      }
    });
  };

  const onRegister = (data: RegisterForm) => {
    registerMutation.mutate({
      username: data.username,
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName
    }, {
      onSuccess: () => {
        toast({
          title: "تم إنشاء الحساب بنجاح",
          description: "مرحباً بك في StayChill",
        });
      },
      onError: (error) => {
        toast({
          title: "خطأ في إنشاء الحساب",
          description: error.message,
          variant: "destructive",
        });
      }
    });
  };

  // Social login helper function
  const handleSocialLogin = (provider: string) => {
    toast({
      title: "قريباً",
      description: `تسجيل الدخول عبر ${provider} سيكون متاحًا قريبًا`,
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 bg-[#f8fcff]">
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-6 items-stretch rounded-xl overflow-hidden bg-white shadow-lg">
        {/* Left side: Auth forms */}
        <div className="p-6 md:p-8">
          <div className="mb-8">
            <Button variant="ghost" className="p-0 mb-2" onClick={() => navigate('/')}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              <span>العودة إلى الرئيسية</span>
            </Button>
            <h2 className="text-2xl font-bold text-[#00182A]">أهلاً بك في StayChill</h2>
            <p className="text-gray-500 mt-1">وجهتك المثالية للعطلات المميزة في مصر</p>
          </div>

          <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="login" className="data-[state=active]:bg-[#00182A] data-[state=active]:text-white">
                <LogIn className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">تسجيل الدخول</span>
                <span className="sm:hidden">دخول</span>
              </TabsTrigger>
              <TabsTrigger value="register" className="data-[state=active]:bg-[#00182A] data-[state=active]:text-white">
                <User className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">حساب جديد</span>
                <span className="sm:hidden">تسجيل</span>
              </TabsTrigger>
              <TabsTrigger value="admin" className="data-[state=active]:bg-[#00182A] data-[state=active]:text-white">
                <Shield className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">دخول المسؤول</span>
                <span className="sm:hidden">مسؤول</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>البريد الإلكتروني</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                            <Input className="pr-10" placeholder="أدخل البريد الإلكتروني" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>كلمة المرور</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                            <Input 
                              className="pr-10" 
                              type={showPassword ? "text" : "password"} 
                              placeholder="أدخل كلمة المرور" 
                              {...field} 
                            />
                            <button 
                              type="button"
                              className="absolute left-3 top-2.5 text-gray-400 hover:text-gray-600"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center justify-between">
                    <FormField
                      control={loginForm.control}
                      name="rememberMe"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2 space-y-0 space-x-reverse">
                          <FormControl>
                            <Checkbox 
                              checked={field.value} 
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="text-sm cursor-pointer">تذكرني</FormLabel>
                        </FormItem>
                      )}
                    />
                    
                    <Button variant="link" className="p-0 h-auto text-sm" onClick={() => toast({
                      title: "قريباً",
                      description: "ستتوفر ميزة استعادة كلمة المرور قريباً"
                    })}>
                      نسيت كلمة المرور؟
                    </Button>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-[#00182A] hover:bg-[#002D4A] text-white"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
                    <ArrowRight className="h-4 w-4 mr-2" />
                  </Button>
                </form>
              </Form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                  ليس لديك حساب؟{" "}
                  <button 
                    className="text-[#00182A] font-medium hover:underline" 
                    onClick={() => setActiveTab('register')}
                  >
                    إنشاء حساب جديد
                  </button>
                </p>
              </div>
            </TabsContent>

            <TabsContent value="register">
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={registerForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الاسم الأول</FormLabel>
                          <FormControl>
                            <Input placeholder="أدخل الاسم الأول" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الاسم الأخير</FormLabel>
                          <FormControl>
                            <Input placeholder="أدخل الاسم الأخير" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={registerForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>اسم المستخدم</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                            <Input className="pr-10" placeholder="أدخل اسم المستخدم" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>البريد الإلكتروني</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                            <Input className="pr-10" placeholder="أدخل البريد الإلكتروني" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>كلمة المرور</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                            <Input 
                              className="pr-10" 
                              type={showPassword ? "text" : "password"} 
                              placeholder="أدخل كلمة المرور" 
                              {...field} 
                            />
                            <button 
                              type="button"
                              className="absolute left-3 top-2.5 text-gray-400 hover:text-gray-600"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
                    name="agreeTerms"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-2 space-y-0 space-x-reverse">
                        <FormControl>
                          <Checkbox 
                            checked={field.value} 
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div>
                          <FormLabel className="text-sm cursor-pointer">
                            أوافق على <span className="text-[#00182A] underline">الشروط والأحكام</span> و <span className="text-[#00182A] underline">سياسة الخصوصية</span>
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full bg-[#00182A] hover:bg-[#002D4A] text-white"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? "جاري إنشاء الحساب..." : "إنشاء حساب جديد"}
                    <ArrowRight className="h-4 w-4 mr-2" />
                  </Button>
                </form>
              </Form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                  لديك حساب بالفعل؟{" "}
                  <button 
                    className="text-[#00182A] font-medium hover:underline" 
                    onClick={() => setActiveTab('login')}
                  >
                    تسجيل الدخول
                  </button>
                </p>
              </div>
            </TabsContent>

            {/* Admin Login Tab */}
            <TabsContent value="admin">
              <div className="mb-6">
                <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
                  <div className="flex items-center mb-2">
                    <Badge variant="outline" className="bg-blue-100/60 text-blue-800 hover:bg-blue-100/80 border-blue-200">
                      <Shield className="h-3 w-3 mr-1" />
                      دخول محمي
                    </Badge>
                  </div>
                  <p className="text-sm text-blue-800">
                    هذه المنطقة مخصصة لمدراء العقارات والمشرفين فقط. إذا كنت عميلًا، يرجى استخدام خيار تسجيل الدخول العادي.
                  </p>
                </div>
              </div>

              <Form {...adminLoginForm}>
                <form onSubmit={adminLoginForm.handleSubmit(onAdminLogin)} className="space-y-4">
                  <FormField
                    control={adminLoginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>البريد الإلكتروني</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                            <Input className="pr-10" placeholder="أدخل البريد الإلكتروني الإداري" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={adminLoginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>كلمة المرور</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                            <Input 
                              className="pr-10" 
                              type={showPassword ? "text" : "password"} 
                              placeholder="أدخل كلمة المرور" 
                              {...field} 
                            />
                            <button 
                              type="button"
                              className="absolute left-3 top-2.5 text-gray-400 hover:text-gray-600"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-[#00182A] to-[#003662] hover:from-[#002442] hover:to-[#00457a] text-white"
                    disabled={adminLoginMutation.isPending}
                  >
                    {adminLoginMutation.isPending ? (
                      <div className="flex items-center justify-center">
                        <span className="inline-block animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                        <span>جاري تسجيل الدخول...</span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <span>تسجيل دخول المسؤول</span>
                        <Shield className="h-4 w-4 mr-2" />
                      </div>
                    )}
                  </Button>
                </form>
              </Form>
              
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                  لست مسؤولاً؟{" "}
                  <button 
                    className="text-[#00182A] font-medium hover:underline" 
                    onClick={() => setActiveTab('login')}
                  >
                    تسجيل دخول مستخدم عادي
                  </button>
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right side: Hero section */}
        <div className="hidden md:block relative bg-[#00182A] text-white overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#00182A] to-[#00457a] opacity-90"></div>
          <div className="h-full flex flex-col justify-center p-8 relative z-10">
            <h1 className="text-3xl font-bold mb-4">وجهتك المثالية للعطلات</h1>
            <p className="text-lg mb-8 opacity-90">اكتشف أفضل المواقع السياحية في مصر مع خدمات فريدة وإقامة مريحة</p>
            
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <Compass className="h-5 w-5" />
                </div>
                <div className="mr-4">
                  <h3 className="font-medium text-lg">مواقع سياحية رائعة</h3>
                  <p className="opacity-75 text-sm">رأس الحكمة، الساحل الشمالي، مارينا، شرم الشيخ والمزيد</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <Home className="h-5 w-5" />
                </div>
                <div className="mr-4">
                  <h3 className="font-medium text-lg">خدمات مجانية</h3>
                  <p className="opacity-75 text-sm">حجز مطاعم مجاني وقريباً خدمات التنظيف والتوصيل</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div className="mr-4">
                  <h3 className="font-medium text-lg">نظام نقاط مكافآت</h3>
                  <p className="opacity-75 text-sm">اكسب نقاط ChillPoints مع كل حجز واستبدلها بخصومات</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}