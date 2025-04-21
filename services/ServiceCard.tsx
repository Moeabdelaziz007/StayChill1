import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Star, Clock, MapPin, Calendar, Tag, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// تعريف نوع البيانات للخدمة
interface ServiceProps {
  id: number;
  name: string;
  description: string;
  location: string;
  address: string;
  serviceType: string;
  priceRange: string;
  image: string;
  rating?: number;
  reviewsCount?: number;
  featured?: boolean;
  active?: boolean;
  contactPhone?: string;
  contactEmail?: string;
  website?: string;
  openingTime?: string;
  closingTime?: string;
  cuisineType?: string;
  nightclubType?: string;
  coverCharge?: number;
  events?: string[];
  reservationFee?: number;
}

// خصائص مكون بطاقة الخدمة
interface ServiceCardProps {
  service: ServiceProps;
  onReserveClick: (service: ServiceProps) => void;
}

export function ServiceCard({ service, onReserveClick }: ServiceCardProps) {
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  // تنسيق السعر ($, $$, $$$)
  const formatPriceRange = (priceRange: string) => {
    return priceRange;
  };

  // تنسيق الساعات
  const formatTime = (time?: string) => {
    if (!time) return "";
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    return `${hour % 12 || 12}:${minutes} ${hour >= 12 ? 'م' : 'ص'}`;
  };

  // تنسيق ساعات العمل
  const formatWorkingHours = () => {
    if (!service.openingTime || !service.closingTime) return "";
    return `${formatTime(service.openingTime)} - ${formatTime(service.closingTime)}`;
  };

  // حساب طول الوصف المعروض
  const truncateDescription = (desc: string, maxLength: number = 120) => {
    return desc.length > maxLength ? `${desc.substring(0, maxLength)}...` : desc;
  };

  return (
    <Card className="overflow-hidden h-full flex flex-col transition-all duration-300 hover:shadow-xl group bg-white dark:bg-gray-800/95 border border-gray-200 dark:border-gray-700">
      {/* صورة الخدمة */}
      <div className="relative h-52 overflow-hidden">
        {service.featured && (
          <div className="absolute top-2 right-2 z-10">
            <Badge className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-sm">
              مميز
            </Badge>
          </div>
        )}
        
        {service.serviceType === "nightclub" && (
          <div className="absolute top-2 left-2 z-10">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge className="bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 flex items-center gap-1 shadow-sm">
                    <span>رسوم حجز</span>
                    <span className="font-bold">${service.reservationFee}</span>
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="bg-black/85 text-white">
                  <p>يتم تطبيق رسوم الحجز للنوادي الليلية</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
        
        <div 
          className={`absolute inset-0 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 animate-pulse transition-opacity duration-300 ${isImageLoaded ? 'opacity-0' : 'opacity-100'}`}
        ></div>
        
        <img 
          src={service.image} 
          alt={service.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
          onLoad={() => setIsImageLoaded(true)}
          style={{ opacity: isImageLoaded ? 1 : 0 }}
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>
        
        {/* معلومات الخدمة على الصورة */}
        <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg line-clamp-1 group-hover:text-white/95 transition-colors">{service.name}</h3>
            <div className="flex items-center bg-black/30 rounded-full px-2 py-0.5">
              <Star className="h-4 w-4 text-yellow-400 mr-1 fill-yellow-400" />
              <span className="text-sm font-medium">{service.rating || 0}</span>
              <span className="text-xs text-white/70 ml-1">({service.reviewsCount || 0})</span>
            </div>
          </div>
          
          <div className="flex items-center text-sm text-white/90 mt-1.5 bg-black/30 w-fit rounded-full px-2 py-0.5">
            <MapPin className="h-3 w-3 mr-1 shrink-0" />
            <span className="truncate">{service.location}</span>
          </div>
        </div>
      </div>
      
      {/* محتوى البطاقة */}
      <CardContent className="py-4 flex-grow">
        <div className="flex justify-between items-center mb-3">
          <div>
            {service.serviceType === "restaurant" && service.cuisineType && (
              <Badge variant="outline" className="text-xs">
                {service.cuisineType}
              </Badge>
            )}
            {service.serviceType === "nightclub" && service.nightclubType && (
              <Badge variant="outline" className="text-xs">
                {service.nightclubType}
              </Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">
              {formatPriceRange(service.priceRange)}
            </span>
            {service.serviceType === "nightclub" && service.coverCharge && (
              <span className="mr-2 text-xs">
                رسوم دخول ${service.coverCharge}
              </span>
            )}
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {truncateDescription(service.description)}
        </p>
        
        <div className="flex items-center text-xs text-muted-foreground mb-2">
          <Clock className="h-3 w-3 mr-1 shrink-0" />
          <span>{formatWorkingHours()}</span>
        </div>
        
        {service.serviceType === "nightclub" && service.events && service.events.length > 0 && (
          <div className="flex items-start text-xs text-muted-foreground mb-2">
            <Calendar className="h-3 w-3 mr-1 shrink-0 mt-0.5" />
            <div>
              <span className="block mb-1">الفعاليات:</span>
              <div className="flex flex-wrap gap-1">
                {service.events.slice(0, 2).map((event, index) => (
                  <Badge key={index} variant="secondary" className="text-[10px]">
                    {event}
                  </Badge>
                ))}
                {service.events.length > 2 && (
                  <Badge variant="secondary" className="text-[10px]">
                    +{service.events.length - 2}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
      
      {/* زر الحجز */}
      <CardFooter className="p-3 pt-0">
        <Button 
          onClick={() => onReserveClick(service)}
          className="w-full"
          variant={service.serviceType === "nightclub" ? "default" : "default"}
        >
          {service.serviceType === "restaurant" ? "حجز طاولة مجاناً" : "حجز (رسوم $15)"}
        </Button>
      </CardFooter>
    </Card>
  );
}