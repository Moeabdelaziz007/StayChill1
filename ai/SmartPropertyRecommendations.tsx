import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, Brain, Shuffle, Heart, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import { PropertyCard, PropertyData } from '@/components/PropertyCard';
import { apiRequest } from '@/lib/queryClient';
import { cn } from '@/lib/utils';

// واجهة التفضيلات للتوصيات الذكية
interface RecommendationPreferences {
  location?: string;
  guests?: number;
  priceRange?: { min: number; max: number };
  amenities?: string[];
  startDate?: Date;
  endDate?: Date;
  travelPurpose?: string;
  travelStyle?: string;
  preferredActivities?: string[];
  accessibility?: string[];
}

// واجهة التوصية مع درجة المطابقة وأسباب الحجز
interface PropertyRecommendation {
  property: PropertyData;
  matchScore: number;
  reasonsToBook: string[];
}

// مكون توصيات العقارات الذكية
export const SmartPropertyRecommendations: React.FC<{
  defaultPreferences?: RecommendationPreferences;
  className?: string;
}> = ({ defaultPreferences = {}, className }) => {
  const { t, locale } = useTranslation();
  const [preferences, setPreferences] = useState<RecommendationPreferences>(defaultPreferences);
  const [recommendations, setRecommendations] = useState<PropertyRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showAllReasons, setShowAllReasons] = useState<Record<number, boolean>>({});
  const [activeTab, setActiveTab] = useState<string>('for-you');

  // الحصول على التوصيات من الخادم
  const fetchRecommendations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiRequest('POST', '/api/recommendations', preferences);
      const data = await response.json();
      
      if (data.recommendations) {
        setRecommendations(data.recommendations);
      } else {
        setRecommendations([]);
      }
    } catch (err) {
      console.error('Error getting recommendations:', err);
      setError(t('ai.recommendations.error'));
    } finally {
      setIsLoading(false);
    }
  };

  // تحميل التوصيات عند تغيير التفضيلات
  useEffect(() => {
    fetchRecommendations();
  }, []);

  // تبديل حالة عرض جميع الأسباب
  const toggleShowAllReasons = (propertyId: number) => {
    setShowAllReasons(prev => ({
      ...prev,
      [propertyId]: !prev[propertyId]
    }));
  };

  // تنقية التوصيات حسب علامة التبويب النشطة
  const filteredRecommendations = React.useMemo(() => {
    switch (activeTab) {
      case 'for-you':
        return recommendations;
      case 'best-value':
        return [...recommendations].sort((a, b) => {
          // حساب القيمة مقابل المال (السعر/درجة المطابقة)
          const valueA = a.property.price / a.matchScore;
          const valueB = b.property.price / b.matchScore;
          return valueA - valueB;
        });
      case 'trending':
        // في الواقع سيكون هذا مستنداً إلى بيانات الاتجاهات الفعلية
        // لكن هنا نرتب بناءً على درجة المطابقة كمثال
        return [...recommendations].sort((a, b) => b.matchScore - a.matchScore);
      default:
        return recommendations;
    }
  }, [recommendations, activeTab]);

  // عرض هيكل التحميل
  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <Skeleton className="h-6 w-64" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-full mt-2" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/3">
                  <Skeleton className="h-48 w-full rounded-md" />
                </div>
                <div className="w-full md:w-2/3 space-y-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="mt-4 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // عرض رسالة خطأ
  if (error) {
    return (
      <Card className={cn("w-full text-center py-8", className)}>
        <CardContent>
          <div className="text-destructive mb-4">
            <Brain className="w-12 h-12 mx-auto mb-2 opacity-70" />
            <h3 className="text-lg font-medium">{t('ai.recommendations.errorTitle')}</h3>
            <p className="text-muted-foreground">{error}</p>
          </div>
          <Button onClick={fetchRecommendations} variant="outline">
            {t('ai.recommendations.tryAgain')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // عرض حالة عدم وجود نتائج
  if (recommendations.length === 0) {
    return (
      <Card className={cn("w-full text-center py-8", className)}>
        <CardContent>
          <div className="mb-4">
            <Lightbulb className="w-12 h-12 mx-auto mb-2 opacity-70" />
            <h3 className="text-lg font-medium">{t('ai.recommendations.noResultsTitle')}</h3>
            <p className="text-muted-foreground">{t('ai.recommendations.noResultsDesc')}</p>
          </div>
          <Button onClick={() => setPreferences({})} variant="outline" className="gap-2">
            <Shuffle className="w-4 h-4" />
            {t('ai.recommendations.resetPreferences')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // عرض التوصيات
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          {t('ai.recommendations.title')}
        </CardTitle>
        <CardDescription>
          {t('ai.recommendations.subtitle')}
        </CardDescription>
        
        <Tabs defaultValue="for-you" value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="for-you">{t('ai.recommendations.tabs.forYou')}</TabsTrigger>
            <TabsTrigger value="best-value">{t('ai.recommendations.tabs.bestValue')}</TabsTrigger>
            <TabsTrigger value="trending">{t('ai.recommendations.tabs.trending')}</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-8">
          {filteredRecommendations.map(({ property, matchScore, reasonsToBook }) => (
            <div key={property.id} className="flex flex-col md:flex-row gap-6 pb-6 border-b">
              <div className="w-full md:w-1/3">
                <PropertyCard 
                  property={property} 
                  variant="compact"
                  showDescription={false}
                  showRating={true}
                  className="h-full"
                />
              </div>
              
              <div className="w-full md:w-2/3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-medium">
                    {property.title}
                  </h3>
                  <Badge variant="outline" className={cn(
                    "font-medium",
                    matchScore >= 90 ? "bg-green-50 text-green-700 border-green-200" :
                    matchScore >= 75 ? "bg-blue-50 text-blue-700 border-blue-200" :
                    "bg-orange-50 text-orange-700 border-orange-200"
                  )}>
                    <span className="mr-1">{matchScore}%</span> 
                    {t('ai.recommendations.match')}
                  </Badge>
                </div>
                
                <div className="mt-2">
                  <h4 className="text-sm font-medium flex items-center gap-1 mb-2">
                    <Heart className="w-4 h-4 text-primary" />
                    {t('ai.recommendations.whyBook')}
                  </h4>
                  
                  <ul className="space-y-1 text-sm">
                    {reasonsToBook.slice(0, showAllReasons[property.id] ? undefined : 3).map((reason, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                  
                  {reasonsToBook.length > 3 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="mt-1 h-8 text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground"
                      onClick={() => toggleShowAllReasons(property.id)}
                    >
                      {showAllReasons[property.id] ? (
                        <>
                          {t('ai.recommendations.showLess')}
                          <ChevronUp className="w-3 h-3" />
                        </>
                      ) : (
                        <>
                          {t('ai.recommendations.showMore')}
                          <ChevronDown className="w-3 h-3" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-center border-t pt-4">
        <Button onClick={fetchRecommendations} variant="outline" className="gap-2">
          <Shuffle className="w-4 h-4" />
          {t('ai.recommendations.refresh')}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SmartPropertyRecommendations;