import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MapPin, Compass, Utensils, Bus, Coffee,
  Sparkles, ChevronRight, ChevronDown, ChevronUp, 
  AlertCircle, RefreshCw, Map, Star, 
  DollarSign, Repeat, PersonStanding
} from 'lucide-react';
import { PropertyData } from '@/components/PropertyCard';
import { apiRequest } from '@/lib/queryClient';
import { DirectionalIcon } from '@/components/ui/directional-icon';
import { cn } from '@/lib/utils';

// واجهة بيانات دليل المنطقة
interface AreaGuideData {
  overview: string;
  localAttractions: { name: string; description: string; distance: string }[];
  diningOptions: { name: string; cuisine: string; priceRange: string; distance: string }[];
  transportationTips: string[];
  insiderTips: string[];
}

// واجهة لتفضيلات الدليل المخصص
interface AreaGuidePreferences {
  travelStyle?: string;
  interests?: string[];
  dietaryRestrictions?: string[];
  transportMode?: string;
  travelingWith?: string[];
}

// مكون دليل المنطقة المخصص باستخدام الذكاء الاصطناعي
export const PersonalizedAreaGuide: React.FC<{
  property: PropertyData;
  preferences?: AreaGuidePreferences;
  className?: string;
}> = ({ property, preferences = {}, className }) => {
  const { t, locale } = useTranslation();
  const [guideData, setGuideData] = useState<AreaGuideData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedInsiderTip, setExpandedInsiderTip] = useState<Record<number, boolean>>({});
  const [activeTab, setActiveTab] = useState<string>('overview');

  // جلب دليل المنطقة من الخادم
  const fetchAreaGuide = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest(
        'POST',
        `/api/properties/${property.id}/area-guide`,
        preferences
      );
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setGuideData(data);
    } catch (err) {
      console.error('Error loading area guide:', err);
      setError(t('ai.areaGuide.error'));
    } finally {
      setIsLoading(false);
    }
  };

  // تحميل البيانات عند تهيئة المكون
  useEffect(() => {
    fetchAreaGuide();
  }, [property.id]);

  // تبديل حالة توسيع نصائح المحليين
  const toggleInsiderTip = (index: number) => {
    setExpandedInsiderTip(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // الحصول على أيقونة لنوع المطعم
  const getCuisineIcon = (cuisine: string) => {
    const lowerCuisine = cuisine.toLowerCase();
    
    if (lowerCuisine.includes('cafe') || lowerCuisine.includes('coffee')) {
      return Coffee;
    }
    
    return Utensils;
  };

  // عرض مؤشر التحميل
  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-primary" />
            <Skeleton className="h-6 w-64" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-full mt-2" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview">
            <TabsList className="grid w-full grid-cols-4">
              <Skeleton className="h-9 w-full rounded-sm" />
              <Skeleton className="h-9 w-full rounded-sm" />
              <Skeleton className="h-9 w-full rounded-sm" />
              <Skeleton className="h-9 w-full rounded-sm" />
            </TabsList>
            <div className="mt-6 space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </Tabs>
        </CardContent>
      </Card>
    );
  }

  // عرض رسالة الخطأ
  if (error) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-primary" />
            {t('ai.areaGuide.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">{t('ai.areaGuide.errorTitle')}</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchAreaGuide} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            {t('ai.areaGuide.tryAgain')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // عرض حالة عدم وجود بيانات
  if (!guideData) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-primary" />
            {t('ai.areaGuide.title')}
          </CardTitle>
          <CardDescription>
            {t('ai.areaGuide.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Map className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">{t('ai.areaGuide.noDataTitle')}</h3>
          <p className="text-muted-foreground mb-4">{t('ai.areaGuide.noDataDesc')}</p>
          <Button onClick={fetchAreaGuide} variant="default" className="gap-2">
            <Sparkles className="h-4 w-4" />
            {t('ai.areaGuide.generate')}
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
          <Compass className="h-5 w-5 text-primary" />
          {t('ai.areaGuide.title')}
        </CardTitle>
        <CardDescription>
          {property.location} - {t('ai.areaGuide.subtitle')}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="text-xs flex items-center gap-1">
              <Map className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t('ai.areaGuide.tabs.overview')}</span>
              <span className="sm:hidden">{t('ai.areaGuide.tabs.overviewShort')}</span>
            </TabsTrigger>
            <TabsTrigger value="attractions" className="text-xs flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t('ai.areaGuide.tabs.attractions')}</span>
              <span className="sm:hidden">{t('ai.areaGuide.tabs.attractionsShort')}</span>
            </TabsTrigger>
            <TabsTrigger value="dining" className="text-xs flex items-center gap-1">
              <Utensils className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t('ai.areaGuide.tabs.dining')}</span>
              <span className="sm:hidden">{t('ai.areaGuide.tabs.diningShort')}</span>
            </TabsTrigger>
            <TabsTrigger value="tips" className="text-xs flex items-center gap-1">
              <Coffee className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t('ai.areaGuide.tabs.tips')}</span>
              <span className="sm:hidden">{t('ai.areaGuide.tabs.tipsShort')}</span>
            </TabsTrigger>
          </TabsList>
          
          {/* محتوى النظرة العامة */}
          <TabsContent value="overview" className="pt-4">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <p className="text-muted-foreground">{guideData.overview}</p>
              
              <div className="mt-6 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Card className="flex-1 bg-muted/40">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-1.5">
                        <Map className="h-4 w-4 text-primary" />
                        {t('ai.areaGuide.topAttractions')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {guideData.localAttractions.slice(0, 3).map((attraction, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Badge className="mt-0.5 h-5 w-5 rounded-full flex items-center justify-center p-0">
                              {idx + 1}
                            </Badge>
                            <div>
                              <p className="text-sm font-medium">{attraction.name}</p>
                              <p className="text-xs text-muted-foreground">{attraction.distance}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                  
                  <Card className="flex-1 bg-muted/40">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-1.5">
                        <Utensils className="h-4 w-4 text-primary" />
                        {t('ai.areaGuide.topDining')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {guideData.diningOptions.slice(0, 3).map((dining, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Badge className="mt-0.5 h-5 w-5 rounded-full flex items-center justify-center p-0">
                              {idx + 1}
                            </Badge>
                            <div>
                              <p className="text-sm font-medium">{dining.name}</p>
                              <p className="text-xs text-muted-foreground">{dining.cuisine} • {dining.distance}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
                
                <Card className="bg-muted/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-1.5">
                      <Bus className="h-4 w-4 text-primary" />
                      {t('ai.areaGuide.transportationTips')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {guideData.transportationTips.slice(0, 4).map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-primary text-xs mt-0.5">●</span>
                          <span className="text-sm text-muted-foreground">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          {/* محتوى المعالم السياحية */}
          <TabsContent value="attractions" className="pt-4">
            <div className="space-y-4">
              {guideData.localAttractions.map((attraction, idx) => (
                <Card key={idx} className="bg-background/60">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <Badge className="mr-2 h-8 w-8 rounded-full flex items-center justify-center text-lg p-0 bg-primary/10 text-primary border-0 self-start">
                        {idx + 1}
                      </Badge>
                      
                      <div className="flex-1">
                        <h3 className="text-base font-medium">{attraction.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{attraction.description}</p>
                        
                        <div className="flex items-center gap-4 mt-3">
                          <Badge variant="outline" className="gap-1 bg-background">
                            <MapPin className="h-3 w-3" />
                            {attraction.distance}
                          </Badge>
                          
                          <Button variant="ghost" size="sm" className="gap-1 h-7 text-xs">
                            {t('ai.areaGuide.viewOnMap')}
                            <DirectionalIcon icon={ChevronRight} className="h-3.5 w-3.5" flipInRtl={true} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          {/* محتوى المطاعم */}
          <TabsContent value="dining" className="pt-4">
            <div className="space-y-4">
              {guideData.diningOptions.map((dining, idx) => {
                const CuisineIcon = getCuisineIcon(dining.cuisine);
                const priceCount = dining.priceRange.length;
                
                return (
                  <Card key={idx} className="bg-background/60">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="mr-2 h-8 w-8 rounded-full flex items-center justify-center bg-primary/10 text-primary self-start">
                          <CuisineIcon className="h-4 w-4" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <h3 className="text-base font-medium">{dining.name}</h3>
                            
                            <div className="flex items-center gap-1 text-muted-foreground">
                              {Array.from({ length: priceCount }).map((_, i) => (
                                <DollarSign key={i} className="h-3 w-3" />
                              ))}
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <Badge variant="secondary" className="font-normal">
                              {dining.cuisine}
                            </Badge>
                            
                            <Badge variant="outline" className="gap-1 font-normal bg-background">
                              <MapPin className="h-3 w-3" />
                              {dining.distance}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-4 mt-3">
                            <Button variant="ghost" size="sm" className="gap-1 h-7 text-xs">
                              {t('ai.areaGuide.viewOnMap')}
                              <DirectionalIcon icon={ChevronRight} className="h-3.5 w-3.5" flipInRtl={true} />
                            </Button>
                            
                            <Button variant="ghost" size="sm" className="gap-1 h-7 text-xs">
                              {t('ai.areaGuide.viewMenu')}
                              <DirectionalIcon icon={ChevronRight} className="h-3.5 w-3.5" flipInRtl={true} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
          
          {/* محتوى النصائح */}
          <TabsContent value="tips" className="pt-4">
            <div className="space-y-4">
              <Card className="bg-background/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-1.5">
                    <Bus className="h-4 w-4 text-primary" />
                    {t('ai.areaGuide.transportationTips')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {guideData.transportationTips.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-primary text-xs mt-0.5">●</span>
                        <span className="text-sm text-muted-foreground">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              
              <Card className="bg-background/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-1.5">
                    <Star className="h-4 w-4 text-primary" />
                    {t('ai.areaGuide.insiderTips')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {guideData.insiderTips.map((tip, idx) => (
                      <div key={idx}>
                        <div className="flex justify-between items-start">
                          <div className={cn(
                            "flex gap-1.5 text-sm",
                            !expandedInsiderTip[idx] && "max-h-12 overflow-hidden"
                          )}>
                            <span className="text-primary text-xs mt-0.5 min-w-[8px]">●</span>
                            <span className="text-muted-foreground">{tip}</span>
                          </div>
                          
                          {tip.length > 120 && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0 rounded-full ml-2" 
                              onClick={() => toggleInsiderTip(idx)}
                            >
                              {expandedInsiderTip[idx] ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                        
                        {idx < guideData.insiderTips.length - 1 && (
                          <Separator className="mt-3" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t pt-4">
        <Badge variant="outline" className="px-3 py-1.5 bg-primary/5 hover:bg-primary/10 gap-1.5">
          <Sparkles className="h-3.5 w-3.5" />
          {t('ai.areaGuide.aiGenerated')}
        </Badge>
        
        <Button onClick={fetchAreaGuide} variant="outline" size="sm" className="gap-1.5">
          <Repeat className="h-3.5 w-3.5" />
          {t('ai.areaGuide.personalize')}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PersonalizedAreaGuide;