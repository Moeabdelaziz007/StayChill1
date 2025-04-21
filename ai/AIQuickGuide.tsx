import { useState } from 'react';
import { 
  BrainCircuit, 
  Lightbulb, 
  X, 
  Book, 
  Search,
  BarChart3,
  TrendingUp,
  HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const AIFeatures = [
  {
    id: 'smart-search',
    title: 'البحث الذكي',
    icon: <Search className="h-5 w-5 text-brand" />,
    description: 'استخدم اللغة الطبيعية لوصف العقار المثالي الذي تبحث عنه. يمكنك ذكر الموقع، والميزانية، والمرافق، وحتى الجو الذي تفضله.',
    examples: [
      'أبحث عن فيلا قريبة من الشاطئ مع حمام سباحة خاص ومناسبة للعائلات',
      'شقة هادئة في مرسى مطروح بإطلالة على البحر وقريبة من المطاعم',
      'منزل عطلات في الساحل مناسب لـ 6 أشخاص مع مرآب للسيارات'
    ],
    path: '/search'
  },
  {
    id: 'virtual-tour',
    title: 'الجولة الافتراضية',
    icon: <Book className="h-5 w-5 text-green-500" />,
    description: 'استكشف كل عقار بالتفصيل مع جولة افتراضية ذكية تسلط الضوء على الميزات الفريدة والمناطق المحيطة بالعقار.',
    examples: [
      'تعرف على تفاصيل كل غرفة والديكور الداخلي',
      'اكتشف المرافق الفريدة التي قد لا تظهر في الصور',
      'احصل على معلومات عن المنطقة المحيطة والأنشطة القريبة'
    ],
    path: '/property/1'
  },
  {
    id: 'analytics',
    title: 'التحليلات الذكية',
    icon: <BarChart3 className="h-5 w-5 text-purple-500" />,
    description: 'لأصحاب العقارات: استفد من تحليلات الذكاء الاصطناعي لفهم أداء عقارك واكتشاف فرص تحسين الربحية.',
    examples: [
      'تحليل تفصيلي لمعدلات الإشغال والإيرادات',
      'توصيات ذكية لتحسين التسعير بناءً على اتجاهات السوق',
      'تنبؤات للأداء المستقبلي وأوقات الذروة'
    ],
    path: '/property/1/analytics'
  },
  {
    id: 'trend-prediction',
    title: 'التنبؤ بالاتجاهات',
    icon: <TrendingUp className="h-5 w-5 text-amber-500" />,
    description: 'استكشف توقعات ذكية للاتجاهات المستقبلية في سوق العقارات، مما يساعدك على اتخاذ قرارات أفضل للحجز أو الاستثمار.',
    examples: [
      'تنبؤات بأسعار الإيجار خلال المواسم المختلفة',
      'تحليل للمناطق ذات النمو المتوقع في الطلب',
      'توصيات لأوقات الحجز المثالية للحصول على أفضل قيمة'
    ],
    path: '/property/1/analytics'
  }
];

export function AIQuickGuide() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="fixed bottom-6 right-6 rounded-full shadow-lg border-primary h-12 w-12 z-50 bg-primary/10 hover:bg-primary/20"
              onClick={() => setIsOpen(true)}
            >
              <BrainCircuit className="h-6 w-6 text-primary" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>دليل ميزات الذكاء الاصطناعي</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="md:max-w-[750px] max-h-[80vh] overflow-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-right">
              <BrainCircuit className="h-5 w-5 text-primary inline" />
              <span>دليل ميزات الذكاء الاصطناعي</span>
            </DialogTitle>
            <DialogDescription className="text-right">
              تعرف على كيفية الاستفادة من قوة الذكاء الاصطناعي في تطبيق StayChill
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {AIFeatures.map((feature) => (
              <Card key={feature.id} className="overflow-hidden border-2 hover:border-primary/50 transition-all duration-200">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2 text-right">
                      {feature.icon}
                      <span>{feature.title}</span>
                    </CardTitle>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs"
                      asChild
                    >
                      <a href={feature.path} onClick={() => setIsOpen(false)}>
                        تجربة الميزة
                      </a>
                    </Button>
                  </div>
                  <CardDescription className="text-right">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/50 rounded-md p-3">
                    <p className="text-sm font-medium mb-2 text-right">أمثلة على الاستخدام:</p>
                    <ul className="text-sm space-y-1 text-right">
                      {feature.examples.map((example, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Lightbulb className="h-4 w-4 text-amber-500 mt-1 flex-shrink-0" />
                          <span>{example}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-between items-center px-1">
            <Button 
              variant="outline" 
              size="sm"
              className="text-xs"
              onClick={() => {
                // Open help links
                window.open('https://staychill.app/help/ai-features', '_blank');
              }}
            >
              <HelpCircle className="h-3 w-3 mr-1" />
              المزيد من المساعدة
            </Button>
            
            <DialogClose asChild>
              <Button variant="default" size="sm">
                إغلاق
              </Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}