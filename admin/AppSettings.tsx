import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from '@/hooks/use-auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Settings,
  Save,
  RefreshCw,
  Globe,
  Mail,
  Bell,
  Shield,
  CreditCard,
  Landmark,
  Loader2,
  Award,
  Palette,
} from "lucide-react";

type AppSettings = {
  general: {
    siteName: string;
    siteDescription: string;
    contactEmail: string;
    supportPhone: string;
    defaultLanguage: string;
    maintenanceMode: boolean;
  };
  appearance: {
    primaryColor: string;
    accentColor: string;
    logoUrl: string;
    faviconUrl: string;
    darkMode: boolean;
  };
  booking: {
    bookingEnabled: boolean;
    minBookingDays: number;
    maxBookingDays: number;
    advanceBookingDays: number;
    cancellationPeriodHours: number;
    bookingFeePercentage: number;
  };
  rewards: {
    rewardsEnabled: boolean;
    pointsPerCurrency: number;
    minimumPointsRedemption: number;
    pointsExpiryMonths: number;
    welcomeBonus: number;
  };
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    marketingEmails: boolean;
    adminAlerts: boolean;
  };
  seo: {
    metaTitle: string;
    metaDescription: string;
    ogImage: string;
    googleAnalyticsId: string;
    sitemapEnabled: boolean;
  };
};

const DEFAULT_SETTINGS: AppSettings = {
  general: {
    siteName: "StayChill",
    siteDescription: "منصة حجز عقارات مميزة في أفضل المواقع السياحية في مصر",
    contactEmail: "info@staychill.example.com",
    supportPhone: "+201234567890",
    defaultLanguage: "ar",
    maintenanceMode: false,
  },
  appearance: {
    primaryColor: "#00182A",
    accentColor: "#FFD700",
    logoUrl: "/logo.png",
    faviconUrl: "/favicon.ico",
    darkMode: false,
  },
  booking: {
    bookingEnabled: true,
    minBookingDays: 2,
    maxBookingDays: 30,
    advanceBookingDays: 180,
    cancellationPeriodHours: 48,
    bookingFeePercentage: 5,
  },
  rewards: {
    rewardsEnabled: true,
    pointsPerCurrency: 2,
    minimumPointsRedemption: 500,
    pointsExpiryMonths: 12,
    welcomeBonus: 100,
  },
  notifications: {
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: false,
    marketingEmails: true,
    adminAlerts: true,
  },
  seo: {
    metaTitle: "StayChill - منصة حجز عقارات مميزة في مصر",
    metaDescription:
      "احجز أفضل العقارات في راس الحكمة، الساحل الشمالي، شرم الشيخ، ومرسى مطروح بأفضل الأسعار",
    ogImage: "/og-image.jpg",
    googleAnalyticsId: "",
    sitemapEnabled: true,
  },
};

export function AppSettings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const isCustomer = user?.role === 'Customer';
  
  // Fetch settings
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<AppSettings>({
    queryKey: ["/api/admin/settings"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/admin/settings");
        if (!res.ok) throw new Error("Failed to fetch settings");
        return await res.json();
      } catch (error) {
        console.error("Error fetching settings:", error);
        // إذا فشل جلب الإعدادات، استخدم الإعدادات الافتراضية
        return DEFAULT_SETTINGS;
      }
    },
    onSuccess: (data) => {
      setSettings(data);
    },
  });
  
  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (updatedSettings: AppSettings) => {
      const res = await apiRequest("PUT", "/api/admin/settings", updatedSettings);
      if (!res.ok) throw new Error("Failed to update settings");
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "تم تحديث الإعدادات بنجاح",
        variant: "default",
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "فشل تحديث الإعدادات",
        description: error instanceof Error ? error.message : "حدث خطأ غير معروف",
        variant: "destructive",
      });
    },
  });
  
  // Reset settings to default
  const resetSettings = () => {
    if (confirm("هل أنت متأكد من إعادة ضبط جميع الإعدادات إلى الوضع الافتراضي؟")) {
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
  
  const handleGeneralChange = (field: string, value: any) => {
    setSettings((prev) =>
      prev ? { ...prev, general: { ...prev.general, [field]: value } } : null
    );
  };
  
  const handleAppearanceChange = (field: string, value: any) => {
    setSettings((prev) =>
      prev
        ? { ...prev, appearance: { ...prev.appearance, [field]: value } }
        : null
    );
  };
  
  const handleBookingChange = (field: string, value: any) => {
    setSettings((prev) =>
      prev ? { ...prev, booking: { ...prev.booking, [field]: value } } : null
    );
  };
  
  const handleRewardsChange = (field: string, value: any) => {
    setSettings((prev) =>
      prev ? { ...prev, rewards: { ...prev.rewards, [field]: value } } : null
    );
  };
  
  const handleNotificationsChange = (field: string, value: any) => {
    setSettings((prev) =>
      prev
        ? {
            ...prev,
            notifications: { ...prev.notifications, [field]: value },
          }
        : null
    );
  };
  
  const handleSeoChange = (field: string, value: any) => {
    setSettings((prev) =>
      prev ? { ...prev, seo: { ...prev.seo, [field]: value } } : null
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
          <CardTitle>خطأ في تحميل الإعدادات</CardTitle>
          <CardDescription>
            حدث خطأ أثناء محاولة جلب إعدادات التطبيق
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
          <CardDescription>لم يتم العثور على إعدادات التطبيق</CardDescription>
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
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              إعدادات التطبيق
            </CardTitle>
            <CardDescription>
              تخصيص وتكوين إعدادات النظام المختلفة
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetSettings}
              disabled={updateSettingsMutation.isPending}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              إعادة ضبط
            </Button>
            <Button
              size="sm"
              onClick={saveSettings}
              disabled={updateSettingsMutation.isPending}
              className="bg-[#00182A] hover:bg-[#002D4A]"
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
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid grid-cols-2 md:grid-cols-6 w-full">
            <TabsTrigger value="general" className="flex items-center">
              <Globe className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">عام</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center">
              <Palette className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">المظهر</span>
            </TabsTrigger>
            {isCustomer && (
              <TabsTrigger value="booking" className="flex items-center">
                <CreditCard className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">الحجز</span>
              </TabsTrigger>
            )}
            {isCustomer && (
              <TabsTrigger value="rewards" className="flex items-center">
                <Award className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">المكافآت</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="notifications" className="flex items-center">
              <Bell className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">الإشعارات</span>
            </TabsTrigger>
            <TabsTrigger value="seo" className="flex items-center">
              <Shield className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">SEO</span>
            </TabsTrigger>
          </TabsList>
          
          {/* General Settings */}
          <TabsContent value="general" className="space-y-6 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="siteName">اسم الموقع</Label>
                <Input
                  id="siteName"
                  value={settings.general.siteName}
                  onChange={(e) =>
                    handleGeneralChange("siteName", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultLanguage">اللغة الافتراضية</Label>
                <Select
                  value={settings.general.defaultLanguage}
                  onValueChange={(value) =>
                    handleGeneralChange("defaultLanguage", value)
                  }
                >
                  <SelectTrigger id="defaultLanguage">
                    <SelectValue placeholder="اختر اللغة الافتراضية" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ar">العربية</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="siteDescription">وصف الموقع</Label>
                <Textarea
                  id="siteDescription"
                  value={settings.general.siteDescription}
                  onChange={(e) =>
                    handleGeneralChange("siteDescription", e.target.value)
                  }
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactEmail">البريد الإلكتروني للتواصل</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={settings.general.contactEmail}
                  onChange={(e) =>
                    handleGeneralChange("contactEmail", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supportPhone">رقم هاتف الدعم</Label>
                <Input
                  id="supportPhone"
                  value={settings.general.supportPhone}
                  onChange={(e) =>
                    handleGeneralChange("supportPhone", e.target.value)
                  }
                />
              </div>
              <div className="md:col-span-2 flex items-center justify-between space-y-0 p-4 border rounded-md bg-gray-50">
                <div className="space-y-0.5">
                  <Label htmlFor="maintenanceMode" className="font-medium">
                    وضع الصيانة
                  </Label>
                  <p className="text-sm text-gray-500">
                    عند تفعيله، سيرى الزوار صفحة صيانة بدلاً من المحتوى العادي
                  </p>
                </div>
                <Switch
                  id="maintenanceMode"
                  checked={settings.general.maintenanceMode}
                  onCheckedChange={(checked) =>
                    handleGeneralChange("maintenanceMode", checked)
                  }
                />
              </div>
            </div>
          </TabsContent>
          
          {/* Appearance Settings */}
          <TabsContent value="appearance" className="space-y-6 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">اللون الرئيسي</Label>
                <div className="flex gap-2">
                  <Input
                    id="primaryColor"
                    value={settings.appearance.primaryColor}
                    onChange={(e) =>
                      handleAppearanceChange("primaryColor", e.target.value)
                    }
                  />
                  <div
                    className="h-10 w-10 rounded-md border"
                    style={{ backgroundColor: settings.appearance.primaryColor }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="accentColor">لون التمييز</Label>
                <div className="flex gap-2">
                  <Input
                    id="accentColor"
                    value={settings.appearance.accentColor}
                    onChange={(e) =>
                      handleAppearanceChange("accentColor", e.target.value)
                    }
                  />
                  <div
                    className="h-10 w-10 rounded-md border"
                    style={{ backgroundColor: settings.appearance.accentColor }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="logoUrl">رابط الشعار</Label>
                <Input
                  id="logoUrl"
                  value={settings.appearance.logoUrl}
                  onChange={(e) =>
                    handleAppearanceChange("logoUrl", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="faviconUrl">رابط الأيقونة المفضلة</Label>
                <Input
                  id="faviconUrl"
                  value={settings.appearance.faviconUrl}
                  onChange={(e) =>
                    handleAppearanceChange("faviconUrl", e.target.value)
                  }
                />
              </div>
              <div className="md:col-span-2 flex items-center justify-between space-y-0 p-4 border rounded-md bg-gray-50">
                <div className="space-y-0.5">
                  <Label htmlFor="darkMode" className="font-medium">
                    الوضع الداكن
                  </Label>
                  <p className="text-sm text-gray-500">
                    تفعيل الوضع الداكن افتراضيًا لجميع المستخدمين
                  </p>
                </div>
                <Switch
                  id="darkMode"
                  checked={settings.appearance.darkMode}
                  onCheckedChange={(checked) =>
                    handleAppearanceChange("darkMode", checked)
                  }
                />
              </div>
            </div>
          </TabsContent>
          
          {/* Booking Settings - Only shown to Customer role users */}
          {isCustomer && (
            <TabsContent value="booking" className="space-y-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 flex items-center justify-between space-y-0 p-4 border rounded-md bg-gray-50">
                  <div className="space-y-0.5">
                    <Label htmlFor="bookingEnabled" className="font-medium">
                      تفعيل الحجوزات
                    </Label>
                    <p className="text-sm text-gray-500">
                      السماح للمستخدمين بإجراء حجوزات جديدة
                    </p>
                  </div>
                  <Switch
                    id="bookingEnabled"
                    checked={settings.booking.bookingEnabled}
                    onCheckedChange={(checked) =>
                      handleBookingChange("bookingEnabled", checked)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minBookingDays">الحد الأدنى لأيام الحجز</Label>
                  <Input
                    id="minBookingDays"
                    type="number"
                    min="1"
                    value={settings.booking.minBookingDays}
                    onChange={(e) =>
                      handleBookingChange(
                        "minBookingDays",
                        Number(e.target.value)
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxBookingDays">الحد الأقصى لأيام الحجز</Label>
                  <Input
                    id="maxBookingDays"
                    type="number"
                    min="1"
                    value={settings.booking.maxBookingDays}
                    onChange={(e) =>
                      handleBookingChange(
                        "maxBookingDays",
                        Number(e.target.value)
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="advanceBookingDays">
                    الحد الأقصى لأيام الحجز المسبق
                  </Label>
                  <Input
                    id="advanceBookingDays"
                    type="number"
                    min="1"
                    value={settings.booking.advanceBookingDays}
                    onChange={(e) =>
                      handleBookingChange(
                        "advanceBookingDays",
                        Number(e.target.value)
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cancellationPeriodHours">
                    فترة الإلغاء المجانية (بالساعات)
                  </Label>
                  <Input
                    id="cancellationPeriodHours"
                    type="number"
                    min="0"
                    value={settings.booking.cancellationPeriodHours}
                    onChange={(e) =>
                      handleBookingChange(
                        "cancellationPeriodHours",
                        Number(e.target.value)
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bookingFeePercentage">
                    نسبة رسوم الحجز (%)
                  </Label>
                  <Input
                    id="bookingFeePercentage"
                    type="number"
                    min="0"
                    max="100"
                    value={settings.booking.bookingFeePercentage}
                    onChange={(e) =>
                      handleBookingChange(
                        "bookingFeePercentage",
                        Number(e.target.value)
                      )
                    }
                  />
                </div>
              </div>
            </TabsContent>
          )}
          
          {/* Rewards Settings - Only shown to Customer role users */}
          {isCustomer && (
            <TabsContent value="rewards" className="space-y-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 flex items-center justify-between space-y-0 p-4 border rounded-md bg-gray-50">
                  <div className="space-y-0.5">
                    <Label htmlFor="rewardsEnabled" className="font-medium">
                      تفعيل برنامج المكافآت
                    </Label>
                    <p className="text-sm text-gray-500">
                      السماح للمستخدمين بكسب واستبدال نقاط ChillPoints
                    </p>
                  </div>
                  <Switch
                    id="rewardsEnabled"
                    checked={settings.rewards.rewardsEnabled}
                    onCheckedChange={(checked) =>
                      handleRewardsChange("rewardsEnabled", checked)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pointsPerCurrency">
                    عدد النقاط لكل جنيه مصري
                  </Label>
                  <Input
                    id="pointsPerCurrency"
                    type="number"
                    min="0"
                    step="0.1"
                    value={settings.rewards.pointsPerCurrency}
                    onChange={(e) =>
                      handleRewardsChange(
                        "pointsPerCurrency",
                        Number(e.target.value)
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minimumPointsRedemption">
                    الحد الأدنى للنقاط المطلوبة للاستبدال
                  </Label>
                  <Input
                    id="minimumPointsRedemption"
                    type="number"
                    min="0"
                    value={settings.rewards.minimumPointsRedemption}
                    onChange={(e) =>
                      handleRewardsChange(
                        "minimumPointsRedemption",
                        Number(e.target.value)
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pointsExpiryMonths">
                    صلاحية النقاط (بالشهور)
                  </Label>
                  <Input
                    id="pointsExpiryMonths"
                    type="number"
                    min="0"
                    value={settings.rewards.pointsExpiryMonths}
                    onChange={(e) =>
                      handleRewardsChange(
                        "pointsExpiryMonths",
                        Number(e.target.value)
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="welcomeBonus">
                    مكافأة الترحيب للمستخدمين الجدد
                  </Label>
                  <Input
                    id="welcomeBonus"
                    type="number"
                    min="0"
                    value={settings.rewards.welcomeBonus}
                    onChange={(e) =>
                      handleRewardsChange(
                        "welcomeBonus",
                        Number(e.target.value)
                      )
                    }
                  />
                </div>
              </div>
            </TabsContent>
          )}
          
          {/* Notifications Settings */}
          <TabsContent value="notifications" className="space-y-6 pt-6">
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center justify-between space-y-0 p-4 border rounded-md bg-gray-50">
                <div className="space-y-0.5">
                  <Label htmlFor="emailNotifications" className="font-medium">
                    إشعارات البريد الإلكتروني
                  </Label>
                  <p className="text-sm text-gray-500">
                    إرسال إشعارات البريد الإلكتروني للمستخدمين عند حدوث أنشطة مهمة
                  </p>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={settings.notifications.emailNotifications}
                  onCheckedChange={(checked) =>
                    handleNotificationsChange("emailNotifications", checked)
                  }
                />
              </div>
              <div className="flex items-center justify-between space-y-0 p-4 border rounded-md bg-gray-50">
                <div className="space-y-0.5">
                  <Label htmlFor="smsNotifications" className="font-medium">
                    إشعارات الرسائل النصية
                  </Label>
                  <p className="text-sm text-gray-500">
                    إرسال إشعارات الرسائل النصية للمستخدمين عند حدوث أنشطة مهمة
                  </p>
                </div>
                <Switch
                  id="smsNotifications"
                  checked={settings.notifications.smsNotifications}
                  onCheckedChange={(checked) =>
                    handleNotificationsChange("smsNotifications", checked)
                  }
                />
              </div>
              <div className="flex items-center justify-between space-y-0 p-4 border rounded-md bg-gray-50">
                <div className="space-y-0.5">
                  <Label htmlFor="pushNotifications" className="font-medium">
                    إشعارات الدفع (Push)
                  </Label>
                  <p className="text-sm text-gray-500">
                    إرسال إشعارات الدفع للمستخدمين على أجهزتهم المحمولة
                  </p>
                </div>
                <Switch
                  id="pushNotifications"
                  checked={settings.notifications.pushNotifications}
                  onCheckedChange={(checked) =>
                    handleNotificationsChange("pushNotifications", checked)
                  }
                />
              </div>
              <div className="flex items-center justify-between space-y-0 p-4 border rounded-md bg-gray-50">
                <div className="space-y-0.5">
                  <Label htmlFor="marketingEmails" className="font-medium">
                    رسائل تسويقية
                  </Label>
                  <p className="text-sm text-gray-500">
                    إرسال رسائل بريد إلكتروني تسويقية دورية للمستخدمين
                  </p>
                </div>
                <Switch
                  id="marketingEmails"
                  checked={settings.notifications.marketingEmails}
                  onCheckedChange={(checked) =>
                    handleNotificationsChange("marketingEmails", checked)
                  }
                />
              </div>
              <div className="flex items-center justify-between space-y-0 p-4 border rounded-md bg-gray-50">
                <div className="space-y-0.5">
                  <Label htmlFor="adminAlerts" className="font-medium">
                    تنبيهات المشرف
                  </Label>
                  <p className="text-sm text-gray-500">
                    إرسال تنبيهات للمشرفين عند حدوث أنشطة تتطلب اهتمامهم
                  </p>
                </div>
                <Switch
                  id="adminAlerts"
                  checked={settings.notifications.adminAlerts}
                  onCheckedChange={(checked) =>
                    handleNotificationsChange("adminAlerts", checked)
                  }
                />
              </div>
            </div>
          </TabsContent>
          
          {/* SEO Settings */}
          <TabsContent value="seo" className="space-y-6 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="metaTitle">عنوان الميتا</Label>
                <Input
                  id="metaTitle"
                  value={settings.seo.metaTitle}
                  onChange={(e) => handleSeoChange("metaTitle", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="googleAnalyticsId">معرف Google Analytics</Label>
                <Input
                  id="googleAnalyticsId"
                  value={settings.seo.googleAnalyticsId}
                  onChange={(e) =>
                    handleSeoChange("googleAnalyticsId", e.target.value)
                  }
                  placeholder="G-XXXXXXXXXX"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="metaDescription">وصف الميتا</Label>
                <Textarea
                  id="metaDescription"
                  value={settings.seo.metaDescription}
                  onChange={(e) =>
                    handleSeoChange("metaDescription", e.target.value)
                  }
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ogImage">صورة Open Graph</Label>
                <Input
                  id="ogImage"
                  value={settings.seo.ogImage}
                  onChange={(e) => handleSeoChange("ogImage", e.target.value)}
                  placeholder="/og-image.jpg"
                />
              </div>
              <div className="space-y-2 flex items-center">
                <div className="flex items-center justify-between flex-grow p-4 border rounded-md bg-gray-50">
                  <Label htmlFor="sitemapEnabled" className="font-medium">
                    تفعيل خريطة الموقع
                  </Label>
                  <Switch
                    id="sitemapEnabled"
                    checked={settings.seo.sitemapEnabled}
                    onCheckedChange={(checked) =>
                      handleSeoChange("sitemapEnabled", checked)
                    }
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between border-t p-6">
        <Button variant="outline" onClick={resetSettings} disabled={updateSettingsMutation.isPending}>
          إعادة ضبط
        </Button>
        <Button
          onClick={saveSettings}
          disabled={updateSettingsMutation.isPending}
          className="bg-[#00182A] hover:bg-[#002D4A]"
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