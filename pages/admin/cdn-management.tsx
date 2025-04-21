import { useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { CDNIntegrationGuide, CDNStats } from "@/components/admin/CDNIntegrationGuide";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, RefreshCw, Server, Database, Cloud, Globe, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

/**
 * صفحة إدارة شبكة توصيل المحتوى (CDN)
 * تسمح للمسؤولين بتكوين وإدارة خدمات CDN
 */
export default function CDNManagementPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // معالجة حفظ إعدادات CDN
  const handleConfigureCDN = (config: { url: string; enabled: boolean }) => {
    setIsLoading(true);
    
    // محاكاة عملية الحفظ (سيتم استبدالها بطلب API فعلي)
    setTimeout(() => {
      console.log("تم حفظ إعدادات CDN:", config);
      setIsLoading(false);
      
      localStorage.setItem('CDN_CONFIG', JSON.stringify(config));
      
      toast({
        title: "تم تحديث إعدادات CDN",
        description: "سيتم تطبيق الإعدادات الجديدة بعد إعادة تشغيل الخادم.",
      });
    }, 1500);
  };
  
  // تحديث إحصائيات CDN
  const handleRefreshStats = () => {
    setIsLoading(true);
    
    // محاكاة تحديث الإحصائيات (سيتم استبدالها بطلب API فعلي)
    setTimeout(() => {
      setIsLoading(false);
      
      toast({
        title: "تم تحديث إحصائيات CDN",
        description: "تم تحديث البيانات بنجاح.",
      });
    }, 1000);
  };
  
  return (
    <AdminLayout>
      <div className="container py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">إدارة شبكة توصيل المحتوى</h1>
            <p className="text-muted-foreground">
              تكوين وإدارة خدمات CDN لتحسين أداء التطبيق
            </p>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshStats}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            تحديث الإحصائيات
          </Button>
        </div>
        
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">حالة CDN</CardTitle>
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">نشط</div>
              <p className="text-xs text-muted-foreground">
                منذ 27 يوم
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">مزود الخدمة</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2">
              <Cloud className="h-5 w-5 text-primary" />
              <div className="text-xl font-semibold">Cloudflare</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">المناطق النشطة</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2">
              <Map className="h-5 w-5 text-green-500" />
              <div className="text-xl font-semibold">13 منطقة</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">تكلفة التشغيل</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-semibold">$21.50</div>
              <p className="text-xs text-muted-foreground">
                هذا الشهر
              </p>
            </CardContent>
          </Card>
        </div>
        
        <CDNStats />
        
        <Tabs defaultValue="configuration">
          <TabsList className="mb-4">
            <TabsTrigger value="configuration">
              <Server className="h-4 w-4 mr-2" />
              تكوين CDN
            </TabsTrigger>
            <TabsTrigger value="regions">
              <Globe className="h-4 w-4 mr-2" />
              المناطق الجغرافية
            </TabsTrigger>
            <TabsTrigger value="caching">
              <Database className="h-4 w-4 mr-2" />
              سياسات التخزين المؤقت
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="configuration">
            <CDNIntegrationGuide onConfigure={handleConfigureCDN} />
          </TabsContent>
          
          <TabsContent value="regions">
            <Card>
              <CardHeader>
                <CardTitle>المناطق الجغرافية النشطة</CardTitle>
                <CardDescription>
                  الأماكن التي يتم تقديم المحتوى منها عبر شبكة CDN
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {[
                    { region: "أمريكا الشمالية", cities: ["نيويورك", "سان فرانسيسكو", "تورنتو", "شيكاغو"] },
                    { region: "أوروبا", cities: ["لندن", "أمستردام", "فرانكفورت", "باريس"] },
                    { region: "آسيا", cities: ["طوكيو", "سنغافورة", "مومباي", "هونغ كونغ"] },
                    { region: "أستراليا", cities: ["سيدني", "ملبورن"] },
                    { region: "أمريكا الجنوبية", cities: ["ساو باولو", "سانتياغو"] },
                    { region: "الشرق الأوسط", cities: ["دبي", "القاهرة"] },
                  ].map((item, index) => (
                    <Card key={index} className="border border-muted bg-background">
                      <CardHeader className="p-3 pb-0">
                        <CardTitle className="text-sm font-medium">{item.region}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 pt-2">
                        <ul className="text-xs text-muted-foreground space-y-1">
                          {item.cities.map((city, cityIndex) => (
                            <li key={cityIndex} className="flex items-center gap-1.5">
                              <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                              {city}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="caching">
            <Card>
              <CardHeader>
                <CardTitle>سياسات التخزين المؤقت</CardTitle>
                <CardDescription>
                  تكوين كيفية تخزين الملفات المختلفة مؤقتًا في شبكة CDN
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-right py-2 font-medium">نوع الملف</th>
                        <th className="text-right py-2 font-medium">مدة التخزين المؤقت</th>
                        <th className="text-right py-2 font-medium">استراتيجية التخزين المؤقت</th>
                        <th className="text-right py-2 font-medium">الحالة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { type: "الصور (JPG, PNG, WebP)", ttl: "30 يوم", strategy: "Cache Everything", status: "نشط" },
                        { type: "JavaScript", ttl: "7 أيام", strategy: "Cache by file extension", status: "نشط" },
                        { type: "CSS", ttl: "7 أيام", strategy: "Cache by file extension", status: "نشط" },
                        { type: "الخطوط", ttl: "90 يوم", strategy: "Cache by file extension", status: "نشط" },
                        { type: "HTML", ttl: "لا تخزين مؤقت", strategy: "No store", status: "معطل" },
                        { type: "API", ttl: "لا تخزين مؤقت", strategy: "No store", status: "معطل" },
                      ].map((item, index) => (
                        <tr key={index} className="border-b border-border/50 last:border-0">
                          <td className="py-3">{item.type}</td>
                          <td className="py-3">{item.ttl}</td>
                          <td className="py-3">{item.strategy}</td>
                          <td className="py-3">
                            <div className="flex items-center gap-1.5">
                              <div className={`h-2 w-2 rounded-full ${item.status === "نشط" ? "bg-green-500" : "bg-gray-300"}`}></div>
                              {item.status}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}