import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Property } from '@/hooks/useProperties';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Sparkles, ThumbsUp, MapPin } from 'lucide-react';
import { useLocation } from 'wouter';

interface SmartRecommendationsProps {
  variant?: 'horizontal' | 'grid';
  limit?: number;
  title?: string;
  description?: string;
}

const SmartRecommendations = ({
  variant = 'horizontal',
  limit = 4,
  title = 'توصيات مخصصة لك',
  description = 'بناءً على تفضيلاتك وسلوك التصفح الخاص بك'
}: SmartRecommendationsProps) => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [reasons, setReasons] = useState<Record<number, string[]>>({});
  const [, navigate] = useLocation();

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        
        // إذا كان المستخدم مسجل الدخول، نستخدم واجهة API المخصصة
        // وإلا نستخدم العقارات المميزة كبديل
        const endpoint = user ? '/api/recommendations/personalized' : '/api/properties/featured';
        
        const response = await apiRequest('GET', `${endpoint}?limit=${limit}`);
        const data = await response.json();
        
        setRecommendations(data.properties || data);
        
        // تخزين الأسباب إذا كانت موجودة
        if (data.reasons) {
          setReasons(data.reasons);
        }
      } catch (error) {
        console.error('Error fetching recommendations:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecommendations();
  }, [user, limit]);
  
  // تأثير تحميل بنمط هيكلي (سكيلتون)
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="h-6 w-2/3 bg-gray-200 animate-pulse rounded"></div>
          <div className="h-4 w-1/2 bg-gray-200 animate-pulse rounded"></div>
        </div>
        
        <div className={variant === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4' : ''}>
          {Array(limit).fill(0).map((_, i) => (
            <div key={i} className="bg-gray-100 h-64 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }
  
  // إذا لم تكن هناك توصيات
  if (recommendations.length === 0) {
    return null;
  }
  
  // المحتوى الرئيسي - حسب نوع العرض
  const renderRecommendations = () => {
    if (variant === 'horizontal') {
      return (
        <Carousel
          opts={{
            align: 'start',
            loop: recommendations.length > 3,
          }}
          className="w-full"
        >
          <CarouselContent>
            {recommendations.map((property) => (
              <CarouselItem key={property.id} className="md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                <PropertyCard property={property} reasons={reasons[property.id]} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      );
    } else {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {recommendations.map((property) => (
            <PropertyCard key={property.id} property={property} reasons={reasons[property.id]} />
          ))}
        </div>
      );
    }
  };
  
  return (
    <div className="py-6 space-y-4">
      <div className="flex items-center space-x-2 space-x-reverse">
        <Sparkles className="h-5 w-5 text-yellow-500" />
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      </div>
      <p className="text-muted-foreground">{description}</p>
      
      {renderRecommendations()}
    </div>
  );
};

// مكون بطاقة العقار
const PropertyCard = ({ property, reasons }: { property: Property, reasons?: string[] }) => {
  const [, navigate] = useLocation();
  
  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg">
      <div 
        className="aspect-[16/9] w-full bg-cover bg-center cursor-pointer" 
        style={{ backgroundImage: `url(${property.images[0]})` }}
        onClick={() => navigate(`/property/${property.id}`)}
      />
      <CardHeader className="p-4">
        <CardTitle className="text-lg font-bold line-clamp-1">
          {property.title}
        </CardTitle>
        <CardDescription className="flex items-center text-xs">
          <MapPin className="h-3 w-3 mr-1" />
          {property.location}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {reasons && reasons.length > 0 && (
          <div className="mt-2 text-sm">
            <p className="font-medium text-emerald-700 mb-1 flex items-center">
              <ThumbsUp className="h-3 w-3 mr-1" />
              مناسب لك
            </p>
            <ul className="text-xs text-gray-600 space-y-1">
              {reasons.slice(0, 2).map((reason, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="text-emerald-500 ml-1">•</span>
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between">
        <div className="text-lg font-bold text-brand">
          ${property.price}<span className="text-sm font-normal text-gray-500"> / ليلة</span>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate(`/property/${property.id}`)}
        >
          عرض
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SmartRecommendations;