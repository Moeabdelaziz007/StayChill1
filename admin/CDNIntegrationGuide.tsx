import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Server, CloudCog, Globe, Zap, Shield, Gift } from "lucide-react";

interface CDNIntegrationGuideProps {
  onConfigure?: (config: { url: string; enabled: boolean }) => void;
  className?: string;
}

/**
 * دليل تكامل CDN
 * هذا المكون يعرض دليلًا للتكامل مع خدمات CDN المختلفة
 */
export function CDNIntegrationGuide({ onConfigure, className }: CDNIntegrationGuideProps) {
  const { toast } = useToast();
  const [cdnUrl, setCdnUrl] = useState("");
  const [enabled, setEnabled] = useState(false);
  
  const handleSave = () => {
    if (onConfigure) {
      onConfigure({ url: cdnUrl, enabled });
    }
    
    toast({
      title: "تم حفظ إعدادات CDN",
      description: enabled 
        ? "تم تفعيل خدمة CDN وسيتم استخدامها لتقديم الملفات الثابتة." 
        : "تم إلغاء تفعيل خدمة CDN.",
    });
  };
  
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>تكامل شبكة توصيل المحتوى (CDN)</CardTitle>
            <CardDescription>
              قم بتسريع موقعك باستخدام شبكة توصيل المحتوى للصور والملفات الثابتة
            </CardDescription>
          </div>
          <CloudCog className="h-8 w-8 text-primary/80" />
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="cloudflare">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="cloudflare">Cloudflare CDN</TabsTrigger>
            <TabsTrigger value="firebase">Firebase Hosting</TabsTrigger>
            <TabsTrigger value="custom">خدمة مخصصة</TabsTrigger>
          </TabsList>
          
          <TabsContent value="cloudflare" className="mt-4 space-y-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="cloudflare-url">رابط Cloudflare CDN</Label>
              <Input 
                id="cloudflare-url" 
                placeholder="https://your-zone.cloudflare.com" 
                value={cdnUrl}
                onChange={(e) => setCdnUrl(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                قم بإدخال رابط منطقة Cloudflare الخاصة بك
              </p>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="cloudflare-enabled">تفعيل Cloudflare CDN</Label>
                <p className="text-sm text-muted-foreground">
                  قم بتفعيل توصيل المحتوى عبر Cloudflare CDN
                </p>
              </div>
              <Switch 
                id="cloudflare-enabled" 
                checked={enabled}
                onCheckedChange={setEnabled}
              />
            </div>
            
            <Accordion type="single" collapsible>
              <AccordionItem value="cloudflare-setup">
                <AccordionTrigger>دليل إعداد Cloudflare CDN</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 text-sm">
                    <p className="font-medium">خطوات إعداد Cloudflare CDN:</p>
                    <ol className="list-decimal list-inside space-y-2 pr-4">
                      <li>أنشئ حسابًا على <a href="https://cloudflare.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Cloudflare</a></li>
                      <li>أضف النطاق الخاص بموقعك</li>
                      <li>قم بتكوين إعدادات CDN من لوحة التحكم</li>
                      <li>تأكد من تفعيل خيار "Cache Everything"</li>
                      <li>قم بتعيين قواعد التخزين المؤقت للصور والملفات الثابتة</li>
                      <li>أدخل رابط منطقة Cloudflare الخاصة بك في الحقل أعلاه</li>
                    </ol>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md">
              <div className="flex items-start gap-3">
                <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-medium text-blue-800 dark:text-blue-300">مزايا Cloudflare CDN</h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                    <li>• توصيل المحتوى من أقرب نقطة جغرافية للمستخدم</li>
                    <li>• تقليل وقت التحميل بنسبة تصل إلى 60%</li>
                    <li>• حماية من هجمات DDoS</li>
                    <li>• ضغط تلقائي للملفات وتحسين الصور</li>
                    <li>• تخزين مؤقت ذكي للمحتوى</li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="firebase" className="mt-4 space-y-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="firebase-url">رابط Firebase Hosting</Label>
              <Input 
                id="firebase-url" 
                placeholder="https://your-project.web.app" 
                value={cdnUrl}
                onChange={(e) => setCdnUrl(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                قم بإدخال رابط مشروع Firebase الخاص بك
              </p>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="firebase-enabled">تفعيل Firebase Hosting</Label>
                <p className="text-sm text-muted-foreground">
                  قم بتفعيل توصيل المحتوى عبر Firebase Hosting
                </p>
              </div>
              <Switch 
                id="firebase-enabled" 
                checked={enabled}
                onCheckedChange={setEnabled}
              />
            </div>
            
            <Accordion type="single" collapsible>
              <AccordionItem value="firebase-setup">
                <AccordionTrigger>دليل إعداد Firebase Hosting</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 text-sm">
                    <p className="font-medium">خطوات إعداد Firebase Hosting:</p>
                    <ol className="list-decimal list-inside space-y-2 pr-4">
                      <li>أنشئ مشروعًا على <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Firebase Console</a></li>
                      <li>قم بتفعيل Firebase Hosting</li>
                      <li>قم بتثبيت أدوات Firebase CLI باستخدام <code className="bg-muted px-1 py-0.5 rounded">npm install -g firebase-tools</code></li>
                      <li>قم بتكوين المشروع باستخدام <code className="bg-muted px-1 py-0.5 rounded">firebase init hosting</code></li>
                      <li>حدد مجلد "public" ليحتوي على الملفات الثابتة</li>
                      <li>قم بنشر الملفات باستخدام <code className="bg-muted px-1 py-0.5 rounded">firebase deploy --only hosting</code></li>
                      <li>أدخل رابط مشروع Firebase في الحقل أعلاه</li>
                    </ol>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            <div className="bg-orange-50 dark:bg-amber-950 p-3 rounded-md">
              <div className="flex items-start gap-3">
                <Gift className="h-5 w-5 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-medium text-orange-800 dark:text-orange-300">مزايا Firebase Hosting</h4>
                  <ul className="text-sm text-orange-700 dark:text-orange-400 space-y-1">
                    <li>• تكامل سلس مع خدمات Firebase الأخرى</li>
                    <li>• توصيل محتوى سريع باستخدام CDN العالمية من Google</li>
                    <li>• شهادات SSL مجانية تلقائية</li>
                    <li>• تخزين مؤقت ذكي وتحسين أداء</li>
                    <li>• نشر سريع وبسيط للتحديثات</li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="custom" className="mt-4 space-y-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="custom-url">رابط CDN المخصص</Label>
              <Input 
                id="custom-url" 
                placeholder="https://cdn.yourdomain.com" 
                value={cdnUrl}
                onChange={(e) => setCdnUrl(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                قم بإدخال رابط CDN المخصص الخاص بك
              </p>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="custom-enabled">تفعيل CDN المخصص</Label>
                <p className="text-sm text-muted-foreground">
                  قم بتفعيل توصيل المحتوى عبر CDN المخصص
                </p>
              </div>
              <Switch 
                id="custom-enabled" 
                checked={enabled}
                onCheckedChange={setEnabled}
              />
            </div>
            
            <div className="border rounded-md p-3 mt-2">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-medium">متطلبات CDN المخصص</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• يجب أن يوفر CDN إمكانية تخزين الملفات الثابتة</li>
                    <li>• دعم معلمات URL للتحكم في حجم الصور وجودتها</li>
                    <li>• دعم CORS للسماح بالوصول من النطاق الرئيسي</li>
                    <li>• تكوين رؤوس HTTP المناسبة للتخزين المؤقت</li>
                    <li>• يُفضل دعم WebP وصيغ الصور الحديثة</li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground flex items-center gap-1.5">
          <Globe className="h-4 w-4" />
          <span>توفير CDN يساعد في تسريع تقديم التطبيق للمستخدمين حول العالم</span>
        </div>
        <Button onClick={handleSave}>حفظ الإعدادات</Button>
      </CardFooter>
    </Card>
  );
}

/**
 * إحصائيات CDN
 * هذا المكون يعرض إحصائيات استخدام CDN
 */
export function CDNStats() {
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">طلبات CDN</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">2.4M</div>
          <p className="text-xs text-muted-foreground">
            +12.5% من الشهر الماضي
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">حجم البيانات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">347GB</div>
          <p className="text-xs text-muted-foreground">
            +5.2% من الشهر الماضي
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">نسبة الضغط</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">68%</div>
          <p className="text-xs text-muted-foreground">
            توفير 742GB من نقل البيانات
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Cache Hit Ratio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">94.7%</div>
          <p className="text-xs text-muted-foreground">
            +2.1% من الشهر الماضي
          </p>
        </CardContent>
      </Card>
    </div>
  );
}