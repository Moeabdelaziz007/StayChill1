import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Sparkles, Eye, Home, Scale, MapPin, Compass, 
  PanelTop, Utensils, Bed, Bath, Coffee, 
  Loader2, AlertCircle, Camera
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { BlurImage } from '@/components/ui/blur-image';
import { PropertyData } from '@/components/PropertyCard';
import { DirectionalIcon } from '@/components/ui/directional-icon';
import { cn } from '@/lib/utils';

// واجهة بيانات الجولة الافتراضية
interface VirtualTourData {
  highlights: string[];
  detailedRoomDescriptions: { room: string; description: string }[];
  surroundingArea: string;
  recommendedExperiences: string[];
}

// مكون لجولة افتراضية محسنة بالذكاء الاصطناعي
export const EnhancedVirtualTour: React.FC<{
  property: PropertyData;
  className?: string;
}> = ({ property, className }) => {
  const { t, locale } = useTranslation();
  const [tourData, setTourData] = useState<VirtualTourData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('highlights');

  // جلب بيانات الجولة الافتراضية من الخادم
  const fetchVirtualTourData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest('GET', `/api/properties/${property.id}/virtual-tour`);
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setTourData(data);
    } catch (err) {
      console.error('Error loading virtual tour:', err);
      setError(t('ai.virtualTour.error'));
    } finally {
      setIsLoading(false);
    }
  };

  // جلب البيانات عند تحميل المكون
  useEffect(() => {
    fetchVirtualTourData();
  }, [property.id]);

  // جلب أيقونة مناسبة لكل غرفة
  const getRoomIcon = (roomName: string) => {
    const name = roomName.toLowerCase();
    if (name.includes('living') || name.includes('salon')) return PanelTop;
    if (name.includes('kitchen') || name.includes('مطبخ')) return Utensils;
    if (name.includes('bedroom') || name.includes('غرفة نوم')) return Bed;
    if (name.includes('bathroom') || name.includes('حمام')) return Bath;
    if (name.includes('balcony') || name.includes('terrace') || name.includes('شرفة')) return Compass;
    return Coffee; // أيقونة افتراضية
  };

  // عرض واجهة التحميل
  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <Skeleton className="h-6 w-64" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-full mt-2" />
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs defaultValue="highlights">
            <TabsList className="grid grid-cols-4 w-full">
              <Skeleton className="h-9 w-full rounded-sm" />
              <Skeleton className="h-9 w-full rounded-sm" />
              <Skeleton className="h-9 w-full rounded-sm" />
              <Skeleton className="h-9 w-full rounded-sm" />
            </TabsList>
            <div className="mt-6 space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </Tabs>
        </CardContent>
      </Card>
    );
  }

  // عرض رسالة خطأ
  if (error) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            {t('ai.virtualTour.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">{t('ai.virtualTour.errorTitle')}</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchVirtualTourData} variant="outline" className="gap-2">
            <Camera className="h-4 w-4" />
            {t('ai.virtualTour.tryAgain')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // عرض رسالة عندما لا تتوفر بيانات
  if (!tourData) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            {t('ai.virtualTour.title')}
          </CardTitle>
          <CardDescription>
            {t('ai.virtualTour.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Camera className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">{t('ai.virtualTour.noDataTitle')}</h3>
          <p className="text-muted-foreground mb-4">{t('ai.virtualTour.noDataDesc')}</p>
          <Button onClick={fetchVirtualTourData} variant="default" className="gap-2">
            <Sparkles className="h-4 w-4" />
            {t('ai.virtualTour.generate')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // عرض البيانات
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-primary" />
          {t('ai.virtualTour.title')}
        </CardTitle>
        <CardDescription>
          {t('ai.virtualTour.subtitle')}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="highlights" className="flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" />
              {t('ai.virtualTour.tabs.highlights')}
            </TabsTrigger>
            <TabsTrigger value="rooms" className="flex items-center gap-1">
              <Home className="h-3.5 w-3.5" />
              {t('ai.virtualTour.tabs.rooms')}
            </TabsTrigger>
            <TabsTrigger value="surroundings" className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {t('ai.virtualTour.tabs.surroundings')}
            </TabsTrigger>
            <TabsTrigger value="experiences" className="flex items-center gap-1">
              <Compass className="h-3.5 w-3.5" />
              {t('ai.virtualTour.tabs.experiences')}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="highlights" className="pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {property.images?.slice(0, 2).map((image, index) => (
                <BlurImage
                  key={index}
                  src={image}
                  alt={`${property.title} - ${index + 1}`}
                  className="w-full h-48 object-cover rounded-md"
                  containerClassName="rounded-md overflow-hidden"
                />
              ))}
            </div>
            
            <div className="mt-4">
              <ul className="space-y-3">
                {tourData.highlights.map((highlight, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-0.5 p-1 h-6 w-6 flex items-center justify-center rounded-full border-primary/50">
                      <span className="text-primary text-xs">{idx + 1}</span>
                    </Badge>
                    <p className="text-muted-foreground">{highlight}</p>
                  </li>
                ))}
              </ul>
            </div>
          </TabsContent>
          
          <TabsContent value="rooms" className="pt-4">
            <Accordion type="single" collapsible className="w-full">
              {tourData.detailedRoomDescriptions.map((room, idx) => {
                const RoomIcon = getRoomIcon(room.room);
                return (
                  <AccordionItem key={idx} value={`room-${idx}`}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        <div className="bg-primary/10 p-1.5 rounded-md">
                          <RoomIcon className="h-4 w-4 text-primary" />
                        </div>
                        <span>{room.room}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-muted-foreground py-2 px-1">
                        {room.description}
                      </p>
                      {property.images && idx < property.images.length && (
                        <BlurImage
                          src={property.images[idx % property.images.length]}
                          alt={room.room}
                          className="w-full h-48 object-cover mt-3 rounded-md"
                          containerClassName="rounded-md overflow-hidden"
                        />
                      )}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </TabsContent>
          
          <TabsContent value="surroundings" className="pt-4">
            <div className="mb-4">
              {property.images?.slice(2, 3).map((image, index) => (
                <BlurImage
                  key={index}
                  src={image}
                  alt={`${property.title} surroundings`}
                  className="w-full h-48 object-cover rounded-md"
                  containerClassName="rounded-md overflow-hidden"
                />
              ))}
            </div>
            
            <div className="space-y-4">
              <h3 className="text-md font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                {t('ai.virtualTour.surroundingsTitle')}
              </h3>
              
              <p className="text-muted-foreground">
                {tourData.surroundingArea}
              </p>
              
              <div className="pt-2">
                <Badge variant="outline" className="bg-primary/5 hover:bg-primary/10">
                  {property.location}
                </Badge>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="experiences" className="pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {tourData.recommendedExperiences.map((experience, idx) => (
                <Card key={idx} className="bg-muted/40 hover:bg-muted/60 transition-colors">
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2 flex items-center gap-1.5">
                      <Compass className="h-4 w-4 text-primary" />
                      {t('ai.virtualTour.experience')} {idx + 1}
                    </h4>
                    <p className="text-sm text-muted-foreground">{experience}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t pt-4">
        <Badge variant="outline" className="px-3 py-1.5 bg-primary/5 hover:bg-primary/10 gap-1.5">
          <Scale className="h-3.5 w-3.5" />
          {t('ai.virtualTour.aiGenerated')}
        </Badge>
        
        <Button onClick={fetchVirtualTourData} variant="outline" size="sm" className="gap-1.5">
          <Sparkles className="h-3.5 w-3.5" />
          {t('ai.virtualTour.regenerate')}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default EnhancedVirtualTour;