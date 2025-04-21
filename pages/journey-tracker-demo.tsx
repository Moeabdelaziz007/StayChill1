import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import JourneyProgressTracker, { JourneyStep } from '@/components/JourneyProgressTracker';
import { Compass, Home, Map, Sailboat, Sun, Umbrella, Building, Car, Waves } from 'lucide-react';
import { motion } from 'framer-motion';

// Beach Vacation Journey - Define these outside component
const beachVacationSteps: JourneyStep[] = [
  {
    id: 'planning',
    title: 'التخطيط',
    description: 'اختر وجهتك واحجز الإقامة',
    status: 'completed',
    icon: <Compass className="h-6 w-6" />
  },
  {
    id: 'preparation',
    title: 'التحضير',
    description: 'احزم حقائبك وجهز كل شيء',
    status: 'completed',
    icon: <Home className="h-6 w-6" />
  },
  {
    id: 'travel',
    title: 'السفر',
    description: 'الطريق إلى وجهتك',
    status: 'current',
    icon: <Car className="h-6 w-6" />
  },
  {
    id: 'arrival',
    title: 'الوصول',
    description: 'استمتع بيومك الأول',
    status: 'upcoming',
    icon: <Building className="h-6 w-6" />
  },
  {
    id: 'activities',
    title: 'الأنشطة',
    description: 'استكشف وجهتك',
    status: 'upcoming',
    icon: <Umbrella className="h-6 w-6" />
  },
  {
    id: 'relaxation',
    title: 'الاسترخاء',
    description: 'استمتع بالشاطئ',
    status: 'upcoming',
    icon: <Waves className="h-6 w-6" />
  }
];

// Booking Journey - Define these outside component
const bookingSteps: JourneyStep[] = [
  {
    id: 'search',
    title: 'البحث',
    description: 'ابحث عن وجهتك المثالية',
    status: 'completed',
    icon: <Map className="h-6 w-6" />
  },
  {
    id: 'select',
    title: 'الاختيار',
    description: 'اختر العقار المناسب',
    status: 'completed',
    icon: <Building className="h-6 w-6" />
  },
  {
    id: 'booking',
    title: 'الحجز',
    description: 'أكمل حجزك',
    status: 'current',
    icon: <Sailboat className="h-6 w-6" />
  },
  {
    id: 'confirmation',
    title: 'التأكيد',
    description: 'تأكيد الحجز',
    status: 'upcoming',
    icon: <Sun className="h-6 w-6" />
  }
];

const JourneyTrackerDemo = React.memo(() => {
  const [currentVacationStep, setCurrentVacationStep] = useState('travel');
  const [currentBookingStep, setCurrentBookingStep] = useState('booking');
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');

  // Animation for the page content - memoized to prevent recreating on each render
  const pageVariants = useMemo(() => ({
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: { duration: 0.5, staggerChildren: 0.1 }
    }
  }), []);

  const cardVariants = useMemo(() => ({
    initial: { y: 20, opacity: 0 },
    animate: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.5 }
    }
  }), []);
  
  // Memoize handlers to prevent recreation on each render
  const handleOrientationHorizontal = useCallback(() => {
    setOrientation('horizontal');
  }, []);
  
  const handleOrientationVertical = useCallback(() => {
    setOrientation('vertical');
  }, []);
  
  const handleVacationStepClick = useCallback((stepId: string) => {
    setCurrentVacationStep(stepId);
  }, []);
  
  const handleBookingStepClick = useCallback((stepId: string) => {
    setCurrentBookingStep(stepId);
  }, []);
  
  // Memoize navigation handlers for beach vacation
  const handlePrevVacationStep = useCallback(() => {
    const currentIndex = beachVacationSteps.findIndex((step: JourneyStep) => step.id === currentVacationStep);
    if (currentIndex > 0) {
      setCurrentVacationStep(beachVacationSteps[currentIndex - 1].id);
    }
  }, [currentVacationStep]);
  
  const handleNextVacationStep = useCallback(() => {
    const currentIndex = beachVacationSteps.findIndex((step: JourneyStep) => step.id === currentVacationStep);
    if (currentIndex < beachVacationSteps.length - 1) {
      setCurrentVacationStep(beachVacationSteps[currentIndex + 1].id);
    }
  }, [currentVacationStep]);
  
  // Memoize navigation handlers for booking
  const handlePrevBookingStep = useCallback(() => {
    const currentIndex = bookingSteps.findIndex((step: JourneyStep) => step.id === currentBookingStep);
    if (currentIndex > 0) {
      setCurrentBookingStep(bookingSteps[currentIndex - 1].id);
    }
  }, [currentBookingStep]);
  
  const handleNextBookingStep = useCallback(() => {
    const currentIndex = bookingSteps.findIndex((step: JourneyStep) => step.id === currentBookingStep);
    if (currentIndex < bookingSteps.length - 1) {
      setCurrentBookingStep(bookingSteps[currentIndex + 1].id);
    }
  }, [currentBookingStep]);

  return (
    <motion.div 
      className="container mx-auto py-8 px-4"
      initial="initial"
      animate="animate"
      variants={pageVariants}
    >
      <motion.div variants={cardVariants}>
        <h1 className="text-3xl font-bold text-center mb-6 text-primary">متتبع تقدم الرحلة المتحرك</h1>
        <p className="text-center mb-8 text-gray-600">تتبع رحلتك مع تأثيرات رسوم متحركة رائعة</p>
      </motion.div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <Button 
          variant={orientation === 'horizontal' ? 'default' : 'outline'}
          onClick={handleOrientationHorizontal}
          className="w-full md:w-auto"
        >
          عرض أفقي
        </Button>
        <Button 
          variant={orientation === 'vertical' ? 'default' : 'outline'}
          onClick={handleOrientationVertical}
          className="w-full md:w-auto"
        >
          عرض عمودي
        </Button>
      </div>

      <Tabs defaultValue="vacation" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="vacation">رحلة الإجازة</TabsTrigger>
          <TabsTrigger value="booking">رحلة الحجز</TabsTrigger>
        </TabsList>

        <TabsContent value="vacation">
          <motion.div variants={cardVariants}>
            <Card>
              <CardHeader>
                <CardTitle>رحلة الإجازة على الشاطئ</CardTitle>
                <CardDescription>
                  تتبع مسار رحلتك من التخطيط إلى الاستمتاع بالشاطئ
                </CardDescription>
              </CardHeader>
              <CardContent>
                <JourneyProgressTracker
                  steps={beachVacationSteps}
                  currentStepId={currentVacationStep}
                  orientation={orientation}
                  className="max-w-4xl mx-auto my-8"
                  onStepClick={handleVacationStepClick}
                />
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  onClick={handlePrevVacationStep}
                  disabled={currentVacationStep === beachVacationSteps[0].id}
                >
                  الخطوة السابقة
                </Button>
                <Button 
                  onClick={handleNextVacationStep}
                  disabled={currentVacationStep === beachVacationSteps[beachVacationSteps.length - 1].id}
                >
                  الخطوة التالية
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="booking">
          <motion.div variants={cardVariants}>
            <Card>
              <CardHeader>
                <CardTitle>رحلة الحجز</CardTitle>
                <CardDescription>
                  تتبع مسار حجزك من البحث إلى تأكيد الحجز
                </CardDescription>
              </CardHeader>
              <CardContent>
                <JourneyProgressTracker
                  steps={bookingSteps}
                  currentStepId={currentBookingStep}
                  orientation={orientation}
                  className="max-w-4xl mx-auto my-8"
                  onStepClick={handleBookingStepClick}
                />
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  onClick={handlePrevBookingStep}
                  disabled={currentBookingStep === bookingSteps[0].id}
                >
                  الخطوة السابقة
                </Button>
                <Button 
                  onClick={handleNextBookingStep}
                  disabled={currentBookingStep === bookingSteps[bookingSteps.length - 1].id}
                >
                  الخطوة التالية
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>

      <motion.div 
        className="mt-12 p-6 bg-muted rounded-lg text-center"
        variants={cardVariants}
      >
        <h2 className="text-2xl font-bold mb-4">كيفية استخدام مكون متتبع تقدم الرحلة</h2>
        <p className="mb-4">
          يمكن استخدام هذا المكون لتتبع تقدم المستخدم عبر أي رحلة متعددة الخطوات، مثل:
        </p>
        <ul className="list-disc list-inside text-left mb-4">
          <li>رحلة الحجز</li>
          <li>حالة الرحلة الفعلية</li>
          <li>تتبع الخدمات (مثل حجز المطاعم، استئجار السيارات، إلخ)</li>
          <li>حالة المعاملات المالية</li>
        </ul>
        <p>انقر على أي خطوة للانتقال إليها مباشرة، أو استخدم الأزرار للتنقل بين الخطوات.</p>
      </motion.div>
    </motion.div>
  );
});

export default JourneyTrackerDemo;