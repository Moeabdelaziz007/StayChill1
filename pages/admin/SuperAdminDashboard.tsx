import { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { 
  BarChart, 
  LineChart, 
  PieChart, 
  Users, 
  Home, 
  Settings, 
  Coffee, 
  UserCog,
  MapPin,
  TrendingUp, 
  Calendar,
  CreditCard,
  AlertCircle,
  Activity,
  UserPlus, 
  Building2, 
  Wrench,
  Plus,
  Bell,
  FileText,
  Clock,
  ShieldCheck,
  Lock,
  LogIn,
  LogOut,
  MousePointer,
  Mail,
  User,
  CheckCircle,
  XCircle,
  CalendarCheck,
  Receipt,
  DollarSign,
  CreditCard as CardIcon
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { UsersManagement } from '@/components/admin/UsersManagement';
import { PropertiesManagement } from '@/components/admin/PropertiesManagement';
import { ServicesManagement } from '@/components/admin/ServicesManagement';
import { AppSettings } from '@/components/admin/AppSettings';
import { SystemSettings } from '@/components/admin/SystemSettings';
import { LocationsManagement } from '@/components/admin/LocationsManagement';
import { BookingsManagement } from '@/components/admin/BookingsManagement';
import { PaymentsManagement } from '@/components/admin/PaymentsManagement';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// Quick stats card component
const StatsCard = ({ 
  title, 
  value, 
  description, 
  icon, 
  trend, 
  isLoading 
}: { 
  title: string; 
  value: string | number; 
  description: string; 
  icon: React.ReactNode; 
  trend?: { value: number; label: string }; 
  isLoading?: boolean;
}) => (
  <Card className="border-[#00182A]/10 bg-gradient-to-br from-white to-[#F8FAFC] shadow-sm">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <div className="h-8 w-8 rounded-full bg-[#00182A]/10 flex items-center justify-center text-[#00182A]">
        {icon}
      </div>
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <>
          <Skeleton className="h-9 w-32 mb-1" />
          <Skeleton className="h-4 w-24" />
        </>
      ) : (
        <>
          <div className="text-2xl font-bold">{value}</div>
          <p className="text-xs text-muted-foreground">{description}</p>
          {trend && (
            <Badge variant={trend.value >= 0 ? "default" : "destructive"} className="mt-2">
              {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
            </Badge>
          )}
        </>
      )}
    </CardContent>
  </Card>
);

export default function SuperAdminDashboard() {
  const [tab, setTab] = useState('overview');
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [securityLogOpen, setSecurityLogOpen] = useState(false);
  
  // Redirect if not super admin
  useEffect(() => {
    if (user && user.role !== 'super_admin') {
      setLocation('/');
    }
  }, [user, setLocation]);
  
  // Fetch dashboard stats
  const { 
    data: stats,
    isLoading: statsLoading
  } = useQuery({
    queryKey: ['/api/admin/stats'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/admin/stats');
        return await res.json();
      } catch (error) {
        console.error('Error fetching admin stats:', error);
        return {
          users: { total: 0, new: 0, trend: 0 },
          properties: { total: 0, active: 0, trend: 0 },
          bookings: { total: 0, completed: 0, pending: 0, trend: 0 },
          revenue: { total: 0, current: 0, trend: 0 }
        };
      }
    },
    enabled: user?.role === 'super_admin',
  });

  if (!user) {
    return (
      <div className="p-6 text-center">
        <Skeleton className="h-8 w-64 mx-auto mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array(4).fill(null).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-to-b from-[#F8FAFC] to-[#EEF2F7] min-h-screen">
      {/* Security Log Drawer */}
      <Drawer open={securityLogOpen} onOpenChange={setSecurityLogOpen}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle className="flex items-center">
              <ShieldCheck className="h-5 w-5 mr-2 text-green-600" />
              سجل الأمان والنشاط
            </DrawerTitle>
            <DrawerDescription>
              سجل كامل للنشاطات والإجراءات الأمنية في النظام
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4 overflow-y-auto max-h-[70vh]">
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-2">اليوم</h3>
                <div className="space-y-3">
                  {[1, 2, 3].map((_, i) => (
                    <div key={i} className="flex gap-3 text-sm border-b pb-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                        {i === 0 ? <LogIn size={16} /> : i === 1 ? <User size={16} /> : <Lock size={16} />}
                      </div>
                      <div>
                        <p className="font-medium">
                          {i === 0 ? "تسجيل دخول ناجح" : i === 1 ? "تعديل بيانات مستخدم" : "تغيير إعدادات الأمان"}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {i === 0 ? "تم تسجيل الدخول من القاهرة، مصر على جهاز Chrome/Windows" : 
                           i === 1 ? "تم تحديث بيانات المستخدم 'أحمد محمد' بواسطة المشرف العام" : 
                           "تم تغيير إعدادات الأمان للمنصة (تفعيل المصادقة الثنائية)"}
                        </p>
                        <div className="flex items-center mt-1">
                          <Clock size={12} className="text-gray-400 mr-1" />
                          <span className="text-xs text-gray-400">
                            {i === 0 ? "10:30 صباحاً" : i === 1 ? "11:45 صباحاً" : "02:15 مساءً"}
                          </span>
                          <div className="inline-flex mx-2 items-center">
                            <Badge variant="outline" className="text-xs px-1.5 py-0">مشرف عام</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">الأمس</h3>
                <div className="space-y-3">
                  {[1, 2].map((_, i) => (
                    <div key={i} className="flex gap-3 text-sm border-b pb-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        i === 0 ? "bg-yellow-100 text-yellow-600" : "bg-red-100 text-red-600"
                      }`}>
                        {i === 0 ? <AlertCircle size={16} /> : <XCircle size={16} />}
                      </div>
                      <div>
                        <p className="font-medium">
                          {i === 0 ? "محاولة دخول مشبوهة" : "محاولة دخول فاشلة"}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {i === 0 ? "محاولة دخول من موقع غير معتاد (سيول، كوريا الجنوبية)" : 
                           "محاولات متكررة لتسجيل الدخول باسم المستخدم 'admin@staychill.com'"}
                        </p>
                        <div className="flex items-center mt-1">
                          <Clock size={12} className="text-gray-400 mr-1" />
                          <span className="text-xs text-gray-400">
                            {i === 0 ? "05:45 مساءً" : "08:30 مساءً"}
                          </span>
                          <div className="inline-flex mx-2 items-center">
                            <Badge variant="outline" className="text-xs px-1.5 py-0 bg-red-50">تنبيه أمان</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">هذا الأسبوع</h3>
                <div className="space-y-3">
                  {[1, 2, 3].map((_, i) => (
                    <div key={i} className="flex gap-3 text-sm border-b pb-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        i === 0 ? "bg-green-100 text-green-600" : 
                        i === 1 ? "bg-blue-100 text-blue-600" : 
                        "bg-purple-100 text-purple-600"
                      }`}>
                        {i === 0 ? <CheckCircle size={16} /> : i === 1 ? <MousePointer size={16} /> : <Mail size={16} />}
                      </div>
                      <div>
                        <p className="font-medium">
                          {i === 0 ? "تحديث النظام" : i === 1 ? "زيارة صفحة الإعدادات" : "إرسال إشعار جماعي"}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {i === 0 ? "تم تحديث نظام StayChill إلى الإصدار 2.5.0" : 
                           i === 1 ? "زيارة صفحة إعدادات الأمان وتكوين قواعد الوصول" : 
                           "إرسال إشعار جماعي لجميع مديري العقارات"}
                        </p>
                        <div className="flex items-center mt-1">
                          <Clock size={12} className="text-gray-400 mr-1" />
                          <span className="text-xs text-gray-400">
                            {i === 0 ? "الإثنين 9:00 صباحاً" : i === 1 ? "الثلاثاء 11:20 صباحاً" : "الأربعاء 3:15 مساءً"}
                          </span>
                          <div className="inline-flex mx-2 items-center">
                            <Badge variant="outline" className="text-xs px-1.5 py-0">
                              {i === 0 ? "تحديث نظام" : i === 1 ? "نشاط عادي" : "إشعارات"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <DrawerFooter>
            <Button variant="outline" onClick={() => setSecurityLogOpen(false)}>إغلاق</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
      
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold tracking-tight">لوحة تحكم المشرف العام</h1>
          <Badge variant="outline" className="px-3 py-1 text-sm mr-4">
            {user?.firstName || ''} {user?.lastName || ''} • مشرف عام
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-2"
            onClick={() => setTab('users')}
          >
            <UserPlus size={16} />
            <span className="hidden sm:inline">مستخدم جديد</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-2"
            onClick={() => setTab('properties')}
          >
            <Building2 size={16} />
            <span className="hidden sm:inline">إضافة عقار</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-2"
            onClick={() => setTab('services')}
          >
            <Wrench size={16} />
            <span className="hidden sm:inline">خدمة جديدة</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-2"
            onClick={() => setTab('locations')}
          >
            <Plus size={16} />
            <span className="hidden sm:inline">موقع جديد</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-2"
            onClick={() => setTab('bookings')}
          >
            <CalendarCheck size={16} />
            <span className="hidden sm:inline">الحجوزات</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-2"
            onClick={() => setTab('payments')}
          >
            <CardIcon size={16} />
            <span className="hidden sm:inline">المدفوعات</span>
          </Button>
          <Button 
            variant="secondary" 
            size="sm" 
            className="flex items-center gap-2"
            onClick={() => setSecurityLogOpen(true)}
          >
            <ShieldCheck size={16} />
            <span className="hidden sm:inline">سجل الأمان</span>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="flex-wrap h-auto p-1 bg-white border border-[#00182A]/10 shadow-sm rounded-md">
          <TabsTrigger value="overview" className="data-[state=active]:bg-[#00182A] data-[state=active]:text-white hover:bg-[#00182A]/5 transition-colors">
            <BarChart className="h-4 w-4 mr-2" />
            نظرة عامة
          </TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-[#00182A] data-[state=active]:text-white hover:bg-[#00182A]/5 transition-colors">
            <Users className="h-4 w-4 mr-2" />
            المستخدمون
          </TabsTrigger>
          <TabsTrigger value="properties" className="data-[state=active]:bg-[#00182A] data-[state=active]:text-white hover:bg-[#00182A]/5 transition-colors">
            <Home className="h-4 w-4 mr-2" />
            العقارات
          </TabsTrigger>
          <TabsTrigger value="locations" className="data-[state=active]:bg-[#00182A] data-[state=active]:text-white hover:bg-[#00182A]/5 transition-colors">
            <MapPin className="h-4 w-4 mr-2" />
            المواقع
          </TabsTrigger>
          <TabsTrigger value="services" className="data-[state=active]:bg-[#00182A] data-[state=active]:text-white hover:bg-[#00182A]/5 transition-colors">
            <Coffee className="h-4 w-4 mr-2" />
            الخدمات
          </TabsTrigger>
          <TabsTrigger value="bookings" className="data-[state=active]:bg-[#00182A] data-[state=active]:text-white hover:bg-[#00182A]/5 transition-colors">
            <CalendarCheck className="h-4 w-4 mr-2" />
            الحجوزات
          </TabsTrigger>
          <TabsTrigger value="payments" className="data-[state=active]:bg-[#00182A] data-[state=active]:text-white hover:bg-[#00182A]/5 transition-colors">
            <CardIcon className="h-4 w-4 mr-2" />
            المدفوعات
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-[#00182A] data-[state=active]:text-white hover:bg-[#00182A]/5 transition-colors">
            <Bell className="h-4 w-4 mr-2" />
            الإشعارات
          </TabsTrigger>
          <TabsTrigger value="reports" className="data-[state=active]:bg-[#00182A] data-[state=active]:text-white hover:bg-[#00182A]/5 transition-colors">
            <FileText className="h-4 w-4 mr-2" />
            التقارير
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-[#00182A] data-[state=active]:text-white hover:bg-[#00182A]/5 transition-colors">
            <Settings className="h-4 w-4 mr-2" />
            الإعدادات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="إجمالي المستخدمين"
              value={statsLoading ? "..." : stats?.users?.total || 0}
              description={`${statsLoading ? "..." : stats?.users?.new || 0} مستخدم جديد هذا الشهر`}
              icon={<Users className="h-4 w-4" />}
              trend={statsLoading ? undefined : { value: stats?.users?.trend || 0, label: "عن الشهر الماضي" }}
              isLoading={statsLoading}
            />
            <StatsCard
              title="العقارات النشطة"
              value={statsLoading ? "..." : stats?.properties?.active || 0}
              description={`من إجمالي ${statsLoading ? "..." : stats?.properties?.total || 0} عقار`}
              icon={<Home className="h-4 w-4" />}
              trend={statsLoading ? undefined : { value: stats?.properties?.trend || 0, label: "عن الشهر الماضي" }}
              isLoading={statsLoading}
            />
            <StatsCard
              title="الحجوزات"
              value={statsLoading ? "..." : stats?.bookings?.total || 0}
              description={`${statsLoading ? "..." : stats?.bookings?.pending || 0} حجز قيد الانتظار`}
              icon={<Calendar className="h-4 w-4" />}
              trend={statsLoading ? undefined : { value: stats?.bookings?.trend || 0, label: "عن الشهر الماضي" }}
              isLoading={statsLoading}
            />
            <StatsCard
              title="الإيرادات (جنيه)"
              value={statsLoading ? "..." : stats?.revenue?.current?.toLocaleString() || 0}
              description={`من إجمالي ${statsLoading ? "..." : stats?.revenue?.total?.toLocaleString() || 0}`}
              icon={<CreditCard className="h-4 w-4" />}
              trend={statsLoading ? undefined : { value: stats?.revenue?.trend || 0, label: "عن الشهر الماضي" }}
              isLoading={statsLoading}
            />
          </div>
          
          {/* Revenue Chart */}
          <Card className="col-span-4 border-[#00182A]/10 bg-white shadow-sm">
            <CardHeader className="bg-gradient-to-r from-[#00182A]/5 to-[#1E90FF]/5 border-b border-[#00182A]/10">
              <CardTitle>الإيرادات والحجوزات</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {statsLoading ? (
                <Skeleton className="h-[350px] w-full" />
              ) : (
                <div className="h-[350px] flex items-center justify-center">
                  <div className="text-center">
                    <Activity className="h-16 w-16 mx-auto text-[#00182A]/40 mb-4" />
                    <h3 className="text-lg font-medium">مخطط الإيرادات</h3>
                    <p className="text-sm text-gray-600">
                      سيتم عرض مخطط بياني للإيرادات والحجوزات حسب الشهر هنا
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Recent Activity & System Alerts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-[#00182A]/10 bg-white shadow-sm">
              <CardHeader className="bg-gradient-to-r from-[#00182A]/5 to-[#1E90FF]/5 border-b border-[#00182A]/10">
                <CardTitle>النشاط الأخير</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {statsLoading ? (
                  <div className="space-y-2">
                    {Array(5).fill(null).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <TrendingUp className="h-12 w-12 mx-auto text-[#00182A]/40 mb-4" />
                    <p className="text-sm text-gray-600">
                      سيتم عرض آخر الأنشطة والإجراءات في النظام هنا
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="border-[#00182A]/10 bg-white shadow-sm">
              <CardHeader className="bg-gradient-to-r from-[#00182A]/5 to-[#1E90FF]/5 border-b border-[#00182A]/10">
                <CardTitle>تنبيهات النظام</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {statsLoading ? (
                  <div className="space-y-2">
                    {Array(5).fill(null).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 mx-auto text-[#00182A]/40 mb-4" />
                    <p className="text-sm text-gray-600">
                      سيتم عرض تنبيهات وإشعارات هامة متعلقة بالنظام هنا
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <UsersManagement />
        </TabsContent>

        <TabsContent value="properties">
          <PropertiesManagement />
        </TabsContent>

        <TabsContent value="locations">
          <LocationsManagement />
        </TabsContent>

        <TabsContent value="services">
          <ServicesManagement />
        </TabsContent>
        
        <TabsContent value="bookings">
          <BookingsManagement />
        </TabsContent>

        <TabsContent value="payments">
          <PaymentsManagement />
        </TabsContent>
        
        <TabsContent value="notifications">
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <div>
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  إدارة الإشعارات
                </CardTitle>
                <CardDescription>
                  مراقبة وإرسال الإشعارات للمستخدمين
                </CardDescription>
              </div>
              <Button className="bg-[#00182A] hover:bg-[#002D4A]">
                <Bell className="h-4 w-4 mr-2" />
                إرسال إشعار جديد
              </Button>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all">
                <TabsList className="mb-4">
                  <TabsTrigger value="all">جميع الإشعارات</TabsTrigger>
                  <TabsTrigger value="system">إشعارات النظام</TabsTrigger>
                  <TabsTrigger value="bookings">إشعارات الحجوزات</TabsTrigger>
                  <TabsTrigger value="users">إشعارات المستخدمين</TabsTrigger>
                </TabsList>
                <TabsContent value="all">
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((_, i) => (
                      <div key={i} className="flex items-center border p-3 rounded-md">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center mr-3 ${
                          i % 3 === 0 
                            ? "bg-blue-100 text-blue-600" 
                            : i % 3 === 1 
                              ? "bg-green-100 text-green-600" 
                              : "bg-yellow-100 text-yellow-600"
                        }`}>
                          {i % 3 === 0 ? <Users className="h-5 w-5" /> : 
                           i % 3 === 1 ? <Calendar className="h-5 w-5" /> : 
                           <AlertCircle className="h-5 w-5" />}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">
                            {i % 3 === 0 ? "تسجيل مستخدم جديد" : 
                             i % 3 === 1 ? "حجز جديد في راس الحكمة" : 
                             "تنبيه نظام جديد"}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {i % 3 === 0 ? "قام مستخدم جديد بالتسجيل في النظام" : 
                             i % 3 === 1 ? "تم إنشاء حجز جديد بقيمة ١٥٠٠ جنيه" : 
                             "هناك طلب مراجعة لعقار جديد"}
                          </p>
                        </div>
                        <div className="text-xs text-gray-400">
                          منذ {i + 1} {i === 0 ? "ساعة" : "ساعات"}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="system">
                  <div className="text-center py-12">
                    <Bell className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium mb-2">لا توجد إشعارات نظام حالية</h3>
                    <p className="text-sm text-gray-500">ستظهر هنا إشعارات النظام عند توفرها</p>
                  </div>
                </TabsContent>
                <TabsContent value="bookings">
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium mb-2">لا توجد إشعارات حجوزات حالية</h3>
                    <p className="text-sm text-gray-500">ستظهر هنا إشعارات الحجوزات عند توفرها</p>
                  </div>
                </TabsContent>
                <TabsContent value="users">
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium mb-2">لا توجد إشعارات مستخدمين حالية</h3>
                    <p className="text-sm text-gray-500">ستظهر هنا إشعارات المستخدمين عند توفرها</p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="reports">
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <div>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  تقارير النظام
                </CardTitle>
                <CardDescription>
                  متابعة أداء النظام وإنشاء تقارير مخصصة
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Clock className="h-4 w-4 mr-2" />
                  تقرير شهري
                </Button>
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  تصدير PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="performance">
                <TabsList className="mb-4">
                  <TabsTrigger value="performance">أداء النظام</TabsTrigger>
                  <TabsTrigger value="bookings">تقارير الحجوزات</TabsTrigger>
                  <TabsTrigger value="users">تقارير المستخدمين</TabsTrigger>
                  <TabsTrigger value="revenue">تقارير المالية</TabsTrigger>
                </TabsList>
                <TabsContent value="performance">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">أداء الموقع</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex justify-between">
                              <span className="text-sm font-medium">وقت التحميل</span>
                              <span className="text-sm text-green-600">850 مللي ثانية</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-green-500 rounded-full" style={{ width: '15%' }}></div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-1">
                            <div className="flex justify-between">
                              <span className="text-sm font-medium">وقت استجابة API</span>
                              <span className="text-sm text-green-600">120 مللي ثانية</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-green-500 rounded-full" style={{ width: '10%' }}></div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-1">
                            <div className="flex justify-between">
                              <span className="text-sm font-medium">معدل تقديم الطلبات</span>
                              <span className="text-sm text-amber-600">65%</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-500 rounded-full" style={{ width: '65%' }}></div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-1">
                            <div className="flex justify-between">
                              <span className="text-sm font-medium">معدل الارتداد</span>
                              <span className="text-sm text-amber-600">35%</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-500 rounded-full" style={{ width: '35%' }}></div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">استخدام الموارد</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex justify-between">
                              <span className="text-sm font-medium">استخدام وحدة المعالجة</span>
                              <span className="text-sm text-green-600">23%</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-green-500 rounded-full" style={{ width: '23%' }}></div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-1">
                            <div className="flex justify-between">
                              <span className="text-sm font-medium">استخدام الذاكرة</span>
                              <span className="text-sm text-green-600">45%</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-green-500 rounded-full" style={{ width: '45%' }}></div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-1">
                            <div className="flex justify-between">
                              <span className="text-sm font-medium">استخدام التخزين</span>
                              <span className="text-sm text-amber-600">72%</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-500 rounded-full" style={{ width: '72%' }}></div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-1">
                            <div className="flex justify-between">
                              <span className="text-sm font-medium">استخدام قاعدة البيانات</span>
                              <span className="text-sm text-green-600">38%</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-green-500 rounded-full" style={{ width: '38%' }}></div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="md:col-span-2">
                      <CardHeader>
                        <CardTitle className="text-base">سجل أحداث النظام</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="border rounded-md bg-gray-50 p-4 max-h-[300px] overflow-y-auto text-xs font-mono">
                          <div className="text-green-600">[2025-04-20 07:42:12] INFO: النظام يعمل بكفاءة</div>
                          <div className="text-gray-600">[2025-04-20 07:40:55] INFO: اكتمل تحديث قاعدة البيانات</div>
                          <div className="text-amber-600">[2025-04-20 07:32:18] WARN: ارتفاع في استخدام وحدة المعالجة</div>
                          <div className="text-gray-600">[2025-04-20 07:30:00] INFO: تم تنفيذ عملية النسخ الاحتياطي بنجاح</div>
                          <div className="text-amber-600">[2025-04-20 07:25:43] WARN: محاولة دخول فاشلة</div>
                          <div className="text-gray-600">[2025-04-20 07:22:10] INFO: تمت معالجة 5 عمليات حجز جديدة</div>
                          <div className="text-red-600">[2025-04-20 07:15:22] ERROR: فشل في الاتصال بخدمة الدفع</div>
                          <div className="text-gray-600">[2025-04-20 07:10:05] INFO: تم تسجيل 3 مستخدمين جدد</div>
                          <div className="text-gray-600">[2025-04-20 07:05:30] INFO: بدء تشغيل النظام</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                <TabsContent value="bookings">
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium mb-2">تقارير الحجوزات</h3>
                    <p className="text-sm text-gray-500">هذا القسم قيد التطوير. ستتمكن قريبًا من عرض تقارير تفصيلية عن الحجوزات.</p>
                  </div>
                </TabsContent>
                <TabsContent value="users">
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium mb-2">تقارير المستخدمين</h3>
                    <p className="text-sm text-gray-500">هذا القسم قيد التطوير. ستتمكن قريبًا من عرض تقارير تفصيلية عن المستخدمين.</p>
                  </div>
                </TabsContent>
                <TabsContent value="revenue">
                  <div className="text-center py-12">
                    <CreditCard className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium mb-2">التقارير المالية</h3>
                    <p className="text-sm text-gray-500">هذا القسم قيد التطوير. ستتمكن قريبًا من عرض تقارير تفصيلية عن الإيرادات والمصروفات.</p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <AppSettings />
            </div>
            <div>
              <SystemSettings />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}