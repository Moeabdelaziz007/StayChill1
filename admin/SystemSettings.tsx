import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Save, 
  RefreshCw, 
  Loader2, 
  Globe, 
  Palette, 
  Shield, 
  Settings, 
  Users, 
  Lock,
  Layers,
  GanttChart,
  LayoutGrid
} from 'lucide-react';

// Types for system settings
type PageAccessSettings = {
  [key: string]: {
    customers: boolean;
    propertyAdmins: boolean;
    superAdmins: boolean;
    title: string;
    description: string;
  };
};

type ThemeSettings = {
  primaryColor: string;
  accentColor: string;
  darkMode: boolean;
  fontFamily: string;
  borderRadius: number;
  direction: 'rtl' | 'ltr';
  animations: boolean;
};

type SystemSettings = {
  maintenance: {
    enabled: boolean;
    message: string;
    allowAdminAccess: boolean;
  };
  security: {
    failedLoginAttempts: number;
    lockoutDurationMinutes: number;
    passwordExpireDays: number;
    enforceStrongPasswords: boolean;
    twoFactorAuth: boolean;
  };
  roles: {
    Customer: {
      enabled: boolean;
      permissions: string[];
      description: string;
    };
    Property_admin: {
      enabled: boolean;
      permissions: string[];
      description: string;
    };
    super_admin: {
      enabled: boolean;
      permissions: string[];
      description: string;
    };
  };
  pageAccess: PageAccessSettings;
  theme: ThemeSettings;
};

// Default system settings
const DEFAULT_SETTINGS: SystemSettings = {
  maintenance: {
    enabled: false,
    message: 'نعتذر، الموقع قيد الصيانة حالياً. يرجى المحاولة مرة أخرى لاحقاً.',
    allowAdminAccess: true,
  },
  security: {
    failedLoginAttempts: 5,
    lockoutDurationMinutes: 30,
    passwordExpireDays: 90,
    enforceStrongPasswords: true,
    twoFactorAuth: false,
  },
  roles: {
    Customer: {
      enabled: true,
      permissions: ['view_properties', 'book_properties', 'view_rewards', 'redeem_rewards'],
      description: 'المستخدم العادي الذي يمكنه حجز العقارات واستخدام نظام المكافآت',
    },
    Property_admin: {
      enabled: true,
      permissions: ['manage_own_properties', 'view_own_bookings', 'manage_own_services'],
      description: 'مدير العقارات الذي يمكنه إدارة العقارات الخاصة به وحجوزاتها',
    },
    super_admin: {
      enabled: true,
      permissions: ['manage_all', 'manage_users', 'manage_settings', 'view_analytics'],
      description: 'المشرف العام الذي لديه وصول كامل لجميع ميزات النظام',
    },
  },
  pageAccess: {
    home: {
      customers: true,
      propertyAdmins: true,
      superAdmins: true,
      title: 'الصفحة الرئيسية',
      description: 'الصفحة الرئيسية للموقع',
    },
    properties: {
      customers: true,
      propertyAdmins: true,
      superAdmins: true,
      title: 'صفحة العقارات',
      description: 'صفحة عرض وبحث العقارات',
    },
    bookings: {
      customers: true,
      propertyAdmins: true,
      superAdmins: true,
      title: 'صفحة الحجوزات',
      description: 'صفحة إدارة الحجوزات',
    },
    rewards: {
      customers: true,
      propertyAdmins: false,
      superAdmins: true,
      title: 'صفحة المكافآت',
      description: 'صفحة نظام المكافآت',
    },
    propertyAdmin: {
      customers: false,
      propertyAdmins: true,
      superAdmins: true,
      title: 'لوحة تحكم مدير العقارات',
      description: 'لوحة تحكم خاصة بمديري العقارات',
    },
    superAdmin: {
      customers: false,
      propertyAdmins: false,
      superAdmins: true,
      title: 'لوحة تحكم المشرف العام',
      description: 'لوحة التحكم الرئيسية للمشرفين',
    },
    profile: {
      customers: true,
      propertyAdmins: true,
      superAdmins: true,
      title: 'صفحة الملف الشخصي',
      description: 'صفحة إدارة الملف الشخصي',
    },
    settings: {
      customers: true,
      propertyAdmins: true,
      superAdmins: true,
      title: 'صفحة الإعدادات',
      description: 'صفحة إعدادات الحساب الشخصية',
    },
  },
  theme: {
    primaryColor: '#00182A',
    accentColor: '#1E90FF',
    darkMode: false,
    fontFamily: 'Tajawal, sans-serif',
    borderRadius: 6,
    direction: 'rtl',
    animations: true,
  },
};

export function SystemSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  // Fetch system settings
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<SystemSettings>({
    queryKey: ["/api/admin/system-settings"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/admin/system-settings");
        if (!res.ok) throw new Error("Failed to fetch system settings");
        return await res.json();
      } catch (error) {
        console.error("Error fetching system settings:", error);
        // If fetching fails, use default settings
        return DEFAULT_SETTINGS;
      }
    },
    onSuccess: (data) => {
      setSettings(data);
    },
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (updatedSettings: SystemSettings) => {
      const res = await apiRequest("PUT", "/api/admin/system-settings", updatedSettings);
      if (!res.ok) throw new Error("Failed to update system settings");
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "تم تحديث إعدادات النظام بنجاح",
        variant: "default",
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "فشل تحديث إعدادات النظام",
        description: error instanceof Error ? error.message : "حدث خطأ غير معروف",
        variant: "destructive",
      });
    },
  });

  // Reset settings to default
  const resetSettings = () => {
    if (confirm("هل أنت متأكد من إعادة ضبط جميع إعدادات النظام إلى الوضع الافتراضي؟")) {
      setSettings(DEFAULT_SETTINGS);
      updateSettingsMutation.mutate(DEFAULT_SETTINGS);
    }
  };

  // Save settings
  const saveSettings = () => {
    if (settings) {
      updateSettingsMutation.mutate(settings);
    }
  };

  // Helper functions for updating settings
  const handleMaintenanceChange = (field: string, value: any) => {
    setSettings((prev) =>
      prev ? { ...prev, maintenance: { ...prev.maintenance, [field]: value } } : null
    );
  };

  const handleSecurityChange = (field: string, value: any) => {
    setSettings((prev) =>
      prev ? { ...prev, security: { ...prev.security, [field]: value } } : null
    );
  };

  const handleRoleChange = (role: string, field: string, value: any) => {
    setSettings((prev) =>
      prev ? {
        ...prev,
        roles: {
          ...prev.roles,
          [role]: {
            ...prev.roles[role],
            [field]: value
          }
        }
      } : null
    );
  };

  const handlePageAccessChange = (page: string, role: string, value: boolean) => {
    setSettings((prev) =>
      prev ? {
        ...prev,
        pageAccess: {
          ...prev.pageAccess,
          [page]: {
            ...prev.pageAccess[page],
            [role]: value
          }
        }
      } : null
    );
  };

  const handleThemeChange = (field: string, value: any) => {
    setSettings((prev) =>
      prev ? { ...prev, theme: { ...prev.theme, [field]: value } } : null
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-40" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-64" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-4 w-24" />
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>خطأ في تحميل إعدادات النظام</CardTitle>
          <CardDescription>
            حدث خطأ أثناء محاولة جلب إعدادات النظام
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => refetch()}>إعادة المحاولة</Button>
        </CardContent>
      </Card>
    );
  }

  if (!settings) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>لا توجد إعدادات</CardTitle>
          <CardDescription>لم يتم العثور على إعدادات النظام</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setSettings(DEFAULT_SETTINGS)}>
            استخدام الإعدادات الافتراضية
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-[#00182A]/5 to-[#1E90FF]/5 border border-[#00182A]/10">
      <CardHeader className="bg-gradient-to-r from-[#00182A] to-[#003366] text-white">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              إعدادات النظام
            </CardTitle>
            <CardDescription className="text-gray-200">
              تخصيص وتكوين إعدادات النظام الأساسية والأمان وصلاحيات الوصول
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetSettings}
              disabled={updateSettingsMutation.isPending}
              className="bg-transparent text-white border-white/40 hover:bg-white/10"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              إعادة ضبط
            </Button>
            <Button
              size="sm"
              onClick={saveSettings}
              disabled={updateSettingsMutation.isPending}
              className="bg-white/20 hover:bg-white/30 text-white"
            >
              {updateSettingsMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              حفظ التغييرات
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="maintenance" className="w-full">
          <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full">
            <TabsTrigger value="maintenance" className="flex items-center">
              <Layers className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">النظام</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center">
              <Shield className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">الأمان</span>
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center">
              <Users className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">الأدوار</span>
            </TabsTrigger>
            <TabsTrigger value="pageAccess" className="flex items-center">
              <Lock className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">صلاحيات الوصول</span>
            </TabsTrigger>
            <TabsTrigger value="theme" className="flex items-center">
              <Palette className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">المظهر</span>
            </TabsTrigger>
          </TabsList>

          {/* Maintenance Settings */}
          <TabsContent value="maintenance" className="space-y-6 pt-6">
            <div className="grid grid-cols-1 gap-6">
              <div className="flex items-center justify-between space-y-0 p-4 border rounded-md bg-gradient-to-r from-[#00182A]/5 to-[#1E90FF]/5 border-[#00182A]/10 shadow-sm">
                <div className="space-y-0.5">
                  <Label htmlFor="maintenanceEnabled" className="font-medium">
                    وضع الصيانة
                  </Label>
                  <p className="text-sm text-gray-600">
                    عند تفعيله، سيرى جميع المستخدمين صفحة صيانة بدلاً من المحتوى العادي
                  </p>
                </div>
                <Switch
                  id="maintenanceEnabled"
                  checked={settings.maintenance.enabled}
                  onCheckedChange={(checked) =>
                    handleMaintenanceChange("enabled", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between space-y-0 p-4 border rounded-md bg-gradient-to-r from-[#00182A]/5 to-[#1E90FF]/5 border-[#00182A]/10 shadow-sm">
                <div className="space-y-0.5">
                  <Label htmlFor="allowAdminAccess" className="font-medium">
                    السماح بوصول المشرفين
                  </Label>
                  <p className="text-sm text-gray-600">
                    السماح للمشرفين بالوصول إلى النظام حتى أثناء وضع الصيانة
                  </p>
                </div>
                <Switch
                  id="allowAdminAccess"
                  checked={settings.maintenance.allowAdminAccess}
                  onCheckedChange={(checked) =>
                    handleMaintenanceChange("allowAdminAccess", checked)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maintenanceMessage">رسالة الصيانة</Label>
                <Textarea
                  id="maintenanceMessage"
                  value={settings.maintenance.message}
                  onChange={(e) =>
                    handleMaintenanceChange("message", e.target.value)
                  }
                  rows={3}
                />
              </div>
            </div>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="failedLoginAttempts">عدد محاولات تسجيل الدخول الفاشلة</Label>
                <Input
                  id="failedLoginAttempts"
                  type="number"
                  min="1"
                  value={settings.security.failedLoginAttempts}
                  onChange={(e) =>
                    handleSecurityChange("failedLoginAttempts", Number(e.target.value))
                  }
                />
                <p className="text-xs text-gray-500">عدد محاولات تسجيل الدخول الفاشلة قبل قفل الحساب</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lockoutDurationMinutes">مدة قفل الحساب (بالدقائق)</Label>
                <Input
                  id="lockoutDurationMinutes"
                  type="number"
                  min="1"
                  value={settings.security.lockoutDurationMinutes}
                  onChange={(e) =>
                    handleSecurityChange("lockoutDurationMinutes", Number(e.target.value))
                  }
                />
                <p className="text-xs text-gray-500">المدة التي يظل فيها الحساب مقفلاً بعد تجاوز عدد محاولات تسجيل الدخول الفاشلة</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="passwordExpireDays">مدة صلاحية كلمة المرور (بالأيام)</Label>
                <Input
                  id="passwordExpireDays"
                  type="number"
                  min="0"
                  value={settings.security.passwordExpireDays}
                  onChange={(e) =>
                    handleSecurityChange("passwordExpireDays", Number(e.target.value))
                  }
                />
                <p className="text-xs text-gray-500">عدد الأيام قبل مطالبة المستخدم بتغيير كلمة المرور (0 لتعطيل هذه الميزة)</p>
              </div>

              <div className="flex items-center justify-between space-y-0 p-4 border rounded-md bg-gradient-to-r from-[#00182A]/5 to-[#1E90FF]/5 border-[#00182A]/10 shadow-sm">
                <div className="space-y-0.5">
                  <Label htmlFor="enforceStrongPasswords" className="font-medium">
                    فرض كلمات مرور قوية
                  </Label>
                  <p className="text-sm text-gray-600">
                    مطالبة المستخدمين باستخدام كلمات مرور قوية تتضمن أحرف كبيرة وصغيرة وأرقام ورموز
                  </p>
                </div>
                <Switch
                  id="enforceStrongPasswords"
                  checked={settings.security.enforceStrongPasswords}
                  onCheckedChange={(checked) =>
                    handleSecurityChange("enforceStrongPasswords", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between space-y-0 p-4 border rounded-md bg-gradient-to-r from-[#00182A]/5 to-[#1E90FF]/5 border-[#00182A]/10 shadow-sm">
                <div className="space-y-0.5">
                  <Label htmlFor="twoFactorAuth" className="font-medium">
                    المصادقة الثنائية
                  </Label>
                  <p className="text-sm text-gray-600">
                    تفعيل إمكانية استخدام المصادقة الثنائية لحسابات المستخدمين
                  </p>
                </div>
                <Switch
                  id="twoFactorAuth"
                  checked={settings.security.twoFactorAuth}
                  onCheckedChange={(checked) =>
                    handleSecurityChange("twoFactorAuth", checked)
                  }
                />
              </div>
            </div>
          </TabsContent>

          {/* Roles Settings */}
          <TabsContent value="roles" className="space-y-6 pt-6">
            <div className="grid grid-cols-1 gap-6">
              {Object.entries(settings.roles).map(([role, roleSettings]) => (
                <Card key={role} className="overflow-hidden border-[#00182A]/10">
                  <CardHeader className="bg-gradient-to-r from-[#00182A]/10 to-[#1E90FF]/5 pb-3">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base font-medium">
                        {role === 'Customer' ? 'العميل' : 
                         role === 'Property_admin' ? 'مدير العقارات' : 
                         'المشرف العام'}
                      </CardTitle>
                      <Switch
                        id={`${role}Enabled`}
                        checked={roleSettings.enabled}
                        onCheckedChange={(checked) =>
                          handleRoleChange(role, "enabled", checked)
                        }
                        disabled={role === 'super_admin'} // Cannot disable super_admin role
                      />
                    </div>
                    <CardDescription className="text-gray-600">
                      {roleSettings.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">الصلاحيات</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {roleSettings.permissions.map((permission, i) => (
                          <div key={i} className="flex items-center py-1 px-3 bg-gradient-to-r from-[#00182A]/5 to-[#1E90FF]/5 border border-[#00182A]/10 rounded-md text-sm shadow-sm">
                            <span>{permission}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Page Access Settings */}
          <TabsContent value="pageAccess" className="space-y-6 pt-6">
            <div className="space-y-6">
              <div className="overflow-x-auto rounded-md shadow-sm border border-[#00182A]/10">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-[#00182A]/10 to-[#1E90FF]/5">
                      <th className="text-right py-3 px-4 border border-[#00182A]/10">الصفحة</th>
                      <th className="text-center py-3 px-4 border border-[#00182A]/10">العملاء</th>
                      <th className="text-center py-3 px-4 border border-[#00182A]/10">مديرو العقارات</th>
                      <th className="text-center py-3 px-4 border border-[#00182A]/10">المشرفون العامون</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(settings.pageAccess).map(([page, pageSettings], index) => (
                      <tr key={page} className={`border-b border-[#00182A]/10 ${index % 2 === 0 ? 'bg-white' : 'bg-[#00182A]/5'} hover:bg-[#1E90FF]/5 transition-colors`}>
                        <td className="py-3 px-4 border border-[#00182A]/10">
                          <div className="font-medium">{pageSettings.title}</div>
                          <div className="text-xs text-gray-600">{pageSettings.description}</div>
                        </td>
                        <td className="text-center py-3 px-4 border border-[#00182A]/10">
                          <Switch
                            id={`${page}Customer`}
                            checked={pageSettings.customers}
                            onCheckedChange={(checked) =>
                              handlePageAccessChange(page, "customers", checked)
                            }
                          />
                        </td>
                        <td className="text-center py-3 px-4 border border-[#00182A]/10">
                          <Switch
                            id={`${page}PropertyAdmin`}
                            checked={pageSettings.propertyAdmins}
                            onCheckedChange={(checked) =>
                              handlePageAccessChange(page, "propertyAdmins", checked)
                            }
                          />
                        </td>
                        <td className="text-center py-3 px-4 border border-[#00182A]/10">
                          <Switch
                            id={`${page}SuperAdmin`}
                            checked={pageSettings.superAdmins}
                            onCheckedChange={(checked) =>
                              handlePageAccessChange(page, "superAdmins", checked)
                            }
                            disabled={page === 'superAdmin'} // Always keep superAdmin access for super admins
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* Theme Settings */}
          <TabsContent value="theme" className="space-y-6 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">اللون الرئيسي</Label>
                <div className="flex gap-2">
                  <Input
                    id="primaryColor"
                    value={settings.theme.primaryColor}
                    onChange={(e) => handleThemeChange("primaryColor", e.target.value)}
                  />
                  <div
                    className="h-10 w-10 rounded-md border"
                    style={{ backgroundColor: settings.theme.primaryColor }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accentColor">لون التمييز</Label>
                <div className="flex gap-2">
                  <Input
                    id="accentColor"
                    value={settings.theme.accentColor}
                    onChange={(e) => handleThemeChange("accentColor", e.target.value)}
                  />
                  <div
                    className="h-10 w-10 rounded-md border"
                    style={{ backgroundColor: settings.theme.accentColor }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fontFamily">الخط</Label>
                <Select
                  value={settings.theme.fontFamily}
                  onValueChange={(value) => handleThemeChange("fontFamily", value)}
                >
                  <SelectTrigger id="fontFamily">
                    <SelectValue placeholder="اختر الخط" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tajawal, sans-serif">Tajawal</SelectItem>
                    <SelectItem value="Cairo, sans-serif">Cairo</SelectItem>
                    <SelectItem value="Almarai, sans-serif">Almarai</SelectItem>
                    <SelectItem value="Rubik, sans-serif">Rubik</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="borderRadius">حجم الزوايا (بكسل)</Label>
                <Input
                  id="borderRadius"
                  type="number"
                  min="0"
                  max="20"
                  value={settings.theme.borderRadius}
                  onChange={(e) => handleThemeChange("borderRadius", Number(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="direction">اتجاه الموقع</Label>
                <Select
                  value={settings.theme.direction}
                  onValueChange={(value: 'rtl' | 'ltr') => handleThemeChange("direction", value)}
                >
                  <SelectTrigger id="direction">
                    <SelectValue placeholder="اختر اتجاه الموقع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rtl">من اليمين إلى اليسار (RTL)</SelectItem>
                    <SelectItem value="ltr">من اليسار إلى اليمين (LTR)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between space-y-0 p-4 border rounded-md bg-gradient-to-r from-[#00182A]/5 to-[#1E90FF]/5 border-[#00182A]/10 shadow-sm">
                <div className="space-y-0.5">
                  <Label htmlFor="darkMode" className="font-medium">
                    الوضع الداكن
                  </Label>
                  <p className="text-sm text-gray-600">
                    تفعيل الوضع الداكن افتراضياً لجميع المستخدمين
                  </p>
                </div>
                <Switch
                  id="darkMode"
                  checked={settings.theme.darkMode}
                  onCheckedChange={(checked) => handleThemeChange("darkMode", checked)}
                />
              </div>

              <div className="flex items-center justify-between space-y-0 p-4 border rounded-md bg-gradient-to-r from-[#00182A]/5 to-[#1E90FF]/5 border-[#00182A]/10 shadow-sm">
                <div className="space-y-0.5">
                  <Label htmlFor="animations" className="font-medium">
                    تأثيرات الحركة
                  </Label>
                  <p className="text-sm text-gray-600">
                    تفعيل تأثيرات الحركة والانتقالات السلسة في واجهة المستخدم
                  </p>
                </div>
                <Switch
                  id="animations"
                  checked={settings.theme.animations}
                  onCheckedChange={(checked) => handleThemeChange("animations", checked)}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between border-t p-6 bg-gradient-to-r from-[#00182A]/5 to-[#1E90FF]/5">
        <Button 
          variant="outline" 
          onClick={resetSettings} 
          disabled={updateSettingsMutation.isPending}
          className="border-[#00182A]/30 hover:bg-[#00182A]/5"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          إعادة ضبط
        </Button>
        <Button
          onClick={saveSettings}
          disabled={updateSettingsMutation.isPending}
          className="bg-[#00182A] hover:bg-[#002D4A] text-white"
        >
          {updateSettingsMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          حفظ التغييرات
        </Button>
      </CardFooter>
    </Card>
  );
}