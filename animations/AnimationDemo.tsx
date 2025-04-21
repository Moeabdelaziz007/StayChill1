import React, { useState } from 'react';
import { 
  MicroInteraction, 
  AnimatedButton, 
  AnimatedLoader, 
  RippleButton,
  AnimatedText
} from './MicroInteractions';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

/**
 * صفحة عرض توضيحي للتفاعلات المتحركة
 */
const AnimationDemo = () => {
  const [activeTab, setActiveTab] = useState('micro');
  const [likeActive, setLikeActive] = useState(false);
  const [favoriteActive, setFavoriteActive] = useState(false);
  const [successActive, setSuccessActive] = useState(false);

  const handleLikeClick = () => {
    setLikeActive(!likeActive);
    if (!likeActive) {
      toast({
        title: 'عملية ناجحة',
        description: 'تم تفعيل الإعجاب بنجاح',
        variant: 'default',
      });
    }
  };

  const handleFavoriteClick = () => {
    setFavoriteActive(!favoriteActive);
    if (!favoriteActive) {
      toast({
        title: 'إضافة إلى المفضلة',
        description: 'تمت إضافة العنصر إلى المفضلة',
        variant: 'default',
      });
    }
  };

  const handleSuccessAnimation = () => {
    setSuccessActive(true);
    setTimeout(() => setSuccessActive(false), 2000);
    toast({
      title: 'تم الحجز',
      description: 'تم تأكيد الحجز بنجاح',
      variant: 'success',
    });
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-8 text-center">
        <AnimatedText 
          text="تفاعلات متحركة لتجربة مستخدم أفضل" 
          type="bounce" 
          className="text-3xl font-bold mb-4 rtl"
        />
        <AnimatedText 
          text="استكشف تأثيرات الحركة المختلفة المتاحة في تطبيق StayChill" 
          type="fade" 
          className="text-gray-500 rtl"
          delay={0.3}
        />
      </div>

      <Tabs defaultValue="micro" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-8">
          <TabsTrigger value="micro">التفاعلات الصغيرة</TabsTrigger>
          <TabsTrigger value="buttons">الأزرار المتحركة</TabsTrigger>
          <TabsTrigger value="loaders">التحميل المتحرك</TabsTrigger>
        </TabsList>

        <TabsContent value="micro" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>تفاعل الإعجاب</CardTitle>
                <CardDescription>يظهر عند النقر على زر الإعجاب</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center items-center min-h-[100px]">
                <MicroInteraction
                  type="like"
                  size="lg"
                  isActive={likeActive}
                  className="cursor-pointer"
                />
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  variant={likeActive ? "secondary" : "default"}
                  onClick={handleLikeClick}
                >
                  {likeActive ? 'إلغاء الإعجاب' : 'إعجاب'}
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>تفاعل المفضلة</CardTitle>
                <CardDescription>يظهر عند إضافة عنصر إلى المفضلة</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center items-center min-h-[100px]">
                <MicroInteraction
                  type="favorite"
                  size="lg"
                  isActive={favoriteActive}
                  className="cursor-pointer"
                />
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  variant={favoriteActive ? "secondary" : "default"}
                  onClick={handleFavoriteClick}
                >
                  {favoriteActive ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>تفاعل النجاح</CardTitle>
                <CardDescription>يظهر عند إتمام عملية بنجاح</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center items-center min-h-[100px]">
                <MicroInteraction
                  type="success"
                  size="lg"
                  isActive={successActive}
                />
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={handleSuccessAnimation}
                >
                  إظهار تأثير النجاح
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>تفاعل الحجز</CardTitle>
                <CardDescription>يظهر عند تأكيد الحجز</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center items-center min-h-[100px]">
                <MicroInteraction
                  type="booking"
                  size="lg"
                  className="cursor-pointer"
                />
              </CardContent>
              <CardFooter>
                <Button className="w-full">تجربة التأثير</Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>تفاعل المكافأة</CardTitle>
                <CardDescription>يظهر عند الحصول على مكافأة</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center items-center min-h-[100px]">
                <MicroInteraction
                  type="reward"
                  size="lg"
                  className="cursor-pointer"
                />
              </CardContent>
              <CardFooter>
                <Button className="w-full">تجربة التأثير</Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>تفاعل النقر</CardTitle>
                <CardDescription>يظهر استجابة عند النقر</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center items-center min-h-[100px]">
                <MicroInteraction
                  type="tap"
                  size="lg"
                  className="cursor-pointer"
                />
              </CardContent>
              <CardFooter>
                <Button className="w-full">تجربة التأثير</Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="buttons" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>زر بتأثير تكبير عند التحويم</CardTitle>
                <CardDescription>يكبر الزر قليلاً عند تمرير المؤشر فوقه</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center items-center min-h-[100px]">
                <AnimatedButton
                  hoverEffect="scale"
                  className="bg-primary text-white px-6 py-2 rounded-md"
                  onClick={() => toast({ title: 'تم النقر على الزر' })}
                >
                  زر بتأثير تكبير
                </AnimatedButton>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>زر بتأثير نبض عند التحويم</CardTitle>
                <CardDescription>ينبض الزر عند تمرير المؤشر فوقه</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center items-center min-h-[100px]">
                <AnimatedButton
                  hoverEffect="pulse"
                  className="bg-primary text-white px-6 py-2 rounded-md"
                  onClick={() => toast({ title: 'تم النقر على الزر' })}
                >
                  زر بتأثير نبض
                </AnimatedButton>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>زر بتأثير القفز عند التحويم</CardTitle>
                <CardDescription>يقفز الزر قليلاً عند تمرير المؤشر فوقه</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center items-center min-h-[100px]">
                <AnimatedButton
                  hoverEffect="bounce"
                  className="bg-primary text-white px-6 py-2 rounded-md"
                  onClick={() => toast({ title: 'تم النقر على الزر' })}
                >
                  زر بتأثير قفز
                </AnimatedButton>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>زر بتأثير توهج عند التحويم</CardTitle>
                <CardDescription>يتوهج الزر عند تمرير المؤشر فوقه</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center items-center min-h-[100px]">
                <AnimatedButton
                  hoverEffect="glow"
                  className="bg-primary text-white px-6 py-2 rounded-md"
                  onClick={() => toast({ title: 'تم النقر على الزر' })}
                >
                  زر بتأثير توهج
                </AnimatedButton>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>زر بتأثير تموج عند النقر</CardTitle>
                <CardDescription>يظهر تأثير التموج عند النقر على الزر</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center items-center min-h-[100px]">
                <RippleButton
                  className="bg-primary text-white px-6 py-2 rounded-md"
                  onClick={() => toast({ title: 'تم النقر على الزر' })}
                  color="rgba(255, 255, 255, 0.5)"
                >
                  انقر لرؤية التموج
                </RippleButton>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>زر بتأثير تموج ملون عند النقر</CardTitle>
                <CardDescription>يظهر تأثير التموج الملون عند النقر على الزر</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center items-center min-h-[100px]">
                <RippleButton
                  className="bg-primary text-white px-6 py-2 rounded-md"
                  onClick={() => toast({ title: 'تم النقر على الزر' })}
                  color="rgba(255, 165, 0, 0.5)"
                >
                  انقر لرؤية التموج الملون
                </RippleButton>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="loaders" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>تحميل دائري</CardTitle>
                <CardDescription>تأثير التحميل الكلاسيكي الدائري</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center items-center min-h-[100px]">
                <AnimatedLoader
                  type="spinner"
                  size="lg"
                  color="#3B82F6"
                  text="جاري التحميل..."
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>تحميل بالنقاط</CardTitle>
                <CardDescription>تأثير التحميل بالنقاط المتحركة</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center items-center min-h-[100px]">
                <AnimatedLoader
                  type="dots"
                  size="lg"
                  color="#3B82F6"
                  text="جاري التحميل..."
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>تحميل نابض</CardTitle>
                <CardDescription>تأثير التحميل بنبض دائري</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center items-center min-h-[100px]">
                <AnimatedLoader
                  type="pulse"
                  size="lg"
                  color="#3B82F6"
                  text="جاري التحميل..."
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>تحميل قافز</CardTitle>
                <CardDescription>تأثير التحميل بالنقاط القافزة</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center items-center min-h-[100px]">
                <AnimatedLoader
                  type="bounce"
                  size="lg"
                  color="#3B82F6"
                  text="جاري التحميل..."
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>تحميل دائري (صغير)</CardTitle>
                <CardDescription>تأثير التحميل الدائري بحجم صغير</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center items-center min-h-[100px]">
                <AnimatedLoader
                  type="spinner"
                  size="sm"
                  color="#f43f5e"
                  text="جاري التحميل..."
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>تحميل نابض (خاص)</CardTitle>
                <CardDescription>تأثير التحميل بنبض بلون مخصص</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center items-center min-h-[100px]">
                <AnimatedLoader
                  type="pulse"
                  size="md"
                  color="#14b8a6"
                  text="جاري معالجة طلبك..."
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-10 text-center">
        <p className="text-sm text-gray-500 mb-4">استخدم هذه التفاعلات المتحركة لإضافة لمسة من الحيوية إلى تطبيقك</p>
      </div>
    </div>
  );
};

export default AnimationDemo;