import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Restaurant } from "@shared/schema";
import { useTranslation } from "@/lib/i18n";
import { Star, MapPin, Clock, Phone, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { DirectionalIcon } from "@/components/ui/directional-icon";
import { OptimizedImage } from "@/components/ui/optimized-image";

export interface RestaurantCardProps {
  restaurant: Restaurant;
  onReserveClick?: (restaurant: Restaurant) => void;
}

export const RestaurantCard = ({ restaurant, onReserveClick }: RestaurantCardProps) => {
  const { t } = useTranslation();
  
  // أنشئ رابط من الساعات
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    return `${hour % 12 || 12}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
  };
  
  const openingHours = `${formatTime(restaurant.openingTime)} - ${formatTime(restaurant.closingTime)}`;
  
  // تنسيق نطاق السعر ($, $$, $$$)
  const getPriceLabel = (priceRange: string) => {
    switch (priceRange) {
      case '$': return t('restaurants.priceRanges.budget');
      case '$$': return t('restaurants.priceRanges.moderate');
      case '$$$': return t('restaurants.priceRanges.expensive');
      default: return priceRange;
    }
  };
  
  // إنشاء متوسط التقييم من أصل 5
  const rating = restaurant.rating || 0;
  
  return (
    <Card className="h-full flex flex-col overflow-hidden hover:shadow-md transition-shadow duration-300">
      <div className="relative aspect-[16/9] overflow-hidden">
        <OptimizedImage 
          src={restaurant.images?.[0] || '/placeholder-restaurant.jpg'} 
          alt={restaurant.name}
          width={400}
          height={225}
          className="object-cover w-full h-full transition-transform duration-500 hover:scale-105"
        />
        {restaurant.featured && (
          <Badge className="absolute top-2 start-2 bg-primary text-primary-foreground">
            {t('restaurants.featured')}
          </Badge>
        )}
        <Badge variant="outline" className="absolute top-2 end-2 bg-background/80 backdrop-blur-sm">
          {getPriceLabel(restaurant.priceRange)}
        </Badge>
      </div>
      
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl truncate">{restaurant.name}</CardTitle>
          {restaurant.rating && (
            <div className="flex items-center gap-1 text-green-500">
              <Star className="fill-green-500 h-4 w-4" />
              <span className="text-sm font-medium">{rating.toFixed(1)}</span>
            </div>
          )}
        </div>
        <CardDescription className="line-clamp-1">
          {restaurant.cuisineType}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-3 py-0 flex-grow">
        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-muted-foreground line-clamp-2">
              {restaurant.address}
            </p>
            <p className="text-xs text-muted-foreground/80 mt-0.5">
              {restaurant.location}
            </p>
          </div>
        </div>
        
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{openingHours}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{restaurant.contactPhone}</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-4 pb-4 flex gap-2 mt-auto">
        <Button 
          variant="secondary" 
          size="sm"
          asChild
          className="flex-1"
        >
          <Link to={`/restaurants/${restaurant.id}`}>
            {t('restaurants.viewDetails')}
          </Link>
        </Button>
        
        <Button 
          variant="default" 
          size="sm"
          className="flex-1 gap-1"
          onClick={() => onReserveClick?.(restaurant)}
        >
          {t('restaurants.reserve')}
          <DirectionalIcon icon={ArrowRight} className="h-4 w-4" flipInRtl={true} />
        </Button>
      </CardFooter>
    </Card>
  );
};