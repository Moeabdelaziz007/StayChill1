import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BlurImage } from "@/components/ui/blur-image";
import { Heart, MapPin, Star, BedDouble, Bath, ArrowRight, Users } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { LAZY_LOAD_THRESHOLD } from "@/lib/performance-config";

// تعريف نوع البيانات للعقار
export interface PropertyData {
  id: number;
  title: string;
  description: string;
  price: number;
  priceUnit?: 'night' | 'day' | 'week' | 'month';
  location: string;
  rating?: number;
  reviewCount?: number;
  images: string[];
  thumbnailImage?: string;
  featured?: boolean;
  amenities?: string[];
  discount?: number;
  bedrooms?: number;
  bathrooms?: number;
  capacity?: number;
  availableFrom?: string;
  availableTo?: string;
  owner?: {
    id: number;
    name: string;
    avatar?: string;
  }
}

interface OptimizedPropertyCardProps {
  property: PropertyData;
  variant?: 'default' | 'compact' | 'featured';
  showLocation?: boolean;
  showRating?: boolean;
  showPrice?: boolean;
  showDescription?: boolean;
  showAmenities?: boolean;
  className?: string;
  enableFavorite?: boolean;
  onFavoriteToggle?: (id: number, isFavorite: boolean) => void;
  isLoading?: boolean;
  loadingPriority?: 'high' | 'low';
  loadingStrategy?: 'eager' | 'lazy' | 'progressive';
}

/**
 * بطاقة عقار محسنة عالية الأداء
 * تستخدم التحميل الكسول والتدريجي للصور لتحسين الأداء وتقليل استهلاك الموارد
 */
const OptimizedPropertyCard = React.memo(({
  property,
  variant = 'default',
  showLocation = true,
  showRating = true,
  showPrice = true,
  showDescription = variant !== 'compact',
  showAmenities = variant === 'featured',
  className,
  enableFavorite = true,
  onFavoriteToggle,
  isLoading = false,
  loadingPriority = 'low',
  loadingStrategy = 'progressive',
}: OptimizedPropertyCardProps) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isVisible, setIsVisible] = useState(loadingPriority === 'high');
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // تهيئة متغيرات مفيدة
  const isFeatured = variant === 'featured' || property.featured;
  const thumbnailImage = property.thumbnailImage || property.images[0];
  const displayImage = isFeatured && property.images.length > 1 
    ? property.images[0] 
    : thumbnailImage;
    
  // اختيار استراتيجية التحميل المناسبة
  const imageLoadingStrategy = useMemo(() => {
    if (loadingStrategy === 'eager') return 'eager';
    if (loadingStrategy === 'lazy') return 'lazy';
    return 'lazy'; // progressive strategy default - lazy with blur
  }, [loadingStrategy]);
  
  // إعداد observer لتتبع ظهور البطاقة في نافذة العرض
  useEffect(() => {
    if (loadingPriority === 'high' || isVisible) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: `${LAZY_LOAD_THRESHOLD}px`,
        threshold: 0.1,
      }
    );
    
    if (cardRef.current) {
      observer.observe(cardRef.current);
    }
    
    return () => observer.disconnect();
  }, [loadingPriority, isVisible]);
  
  // التعامل مع نقر زر المفضلة
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const newState = !isFavorite;
    setIsFavorite(newState);
    
    if (onFavoriteToggle) {
      onFavoriteToggle(property.id, newState);
    }
  };
  
  // عرض هيكل التحميل
  if (isLoading) {
    return (
      <Card 
        ref={cardRef} 
        className={cn("overflow-hidden h-full transition-all duration-300 hover:shadow-lg", className)}
      >
        <div className="relative" style={{ aspectRatio: "16/9" }}>
          <Skeleton className="h-full w-full" />
        </div>
        <CardHeader className="p-4">
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-5/6" />
        </CardContent>
        <CardFooter className="p-4 pt-0 flex justify-between">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-16" />
        </CardFooter>
      </Card>
    );
  }
  
  // عرض البطاقة فقط بعد أن تصبح مرئية
  if (!isVisible) {
    return (
      <div
        ref={cardRef}
        className={cn("overflow-hidden h-full", className)}
        style={{ aspectRatio: "auto", minHeight: "300px" }}
      >
        <Skeleton className="h-full w-full" />
      </div>
    );
  }
  
  return (
    <Card 
      ref={cardRef}
      className={cn(
        "overflow-hidden h-full transition-all duration-300 hover:shadow-lg",
        isFeatured && "border-primary/30",
        !isImageLoaded && "animate-pulse",
        className
      )}
    >
      {/* صورة العقار */}
      <div className="relative">
        <Link href={`/property/${property.id}`}>
          <BlurImage
            src={displayImage}
            alt={property.title}
            className="w-full object-cover transition-transform duration-300 hover:scale-105"
            containerClassName="cursor-pointer"
            style={{ aspectRatio: "16/9" }}
            priority={loadingPriority === 'high'}
            objectFit="cover"
            onLoad={() => setIsImageLoaded(true)}
          />
        </Link>
        
        {/* زر المفضلة */}
        {enableFavorite && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-2 right-2 rounded-full bg-background/80 hover:bg-background transition-colors z-10"
            onClick={handleFavoriteClick}
            aria-label={isFavorite ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
          >
            <Heart className={cn("h-5 w-5", isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground")} />
          </Button>
        )}
        
        {/* علامة "مميز" إذا كان العقار مميزًا */}
        {isFeatured && (
          <Badge className="absolute top-2 left-2 z-10 bg-primary text-xs font-medium">
            عقار مميز
          </Badge>
        )}
        
        {/* عرض الخصم إذا كان متاحًا */}
        {property.discount && property.discount > 0 && (
          <Badge className="absolute bottom-2 left-2 z-10 bg-green-600 text-xs font-medium">
            خصم {property.discount}%
          </Badge>
        )}
      </div>
      
      {/* معلومات رئيسية */}
      <CardHeader className={cn("p-4", variant === 'compact' && "py-3")}>
        {/* التقييم والمراجعات */}
        {showRating && property.rating && (
          <div className="flex items-center gap-1.5 mb-2">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{property.rating.toFixed(1)}</span>
            {property.reviewCount && (
              <span className="text-sm text-muted-foreground">({property.reviewCount} مراجعة)</span>
            )}
          </div>
        )}
        
        {/* عنوان العقار */}
        <CardTitle className="text-lg leading-tight">
          <Link href={`/property/${property.id}`} className="hover:text-primary transition-colors">
            {property.title}
          </Link>
        </CardTitle>
        
        {/* الموقع */}
        {showLocation && (
          <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span>{property.location}</span>
          </div>
        )}
      </CardHeader>
      
      <CardContent className={cn("p-4 pt-0 space-y-3", variant === 'compact' && "py-2")}>
        {/* الوصف */}
        {showDescription && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {property.description}
          </p>
        )}
        
        {/* مميزات مختصرة */}
        <div className="flex items-center gap-4 text-sm">
          {property.bedrooms && (
            <div className="flex items-center gap-1.5">
              <BedDouble className="h-4 w-4 text-muted-foreground" />
              <span>{property.bedrooms} غرفة نوم</span>
            </div>
          )}
          
          {property.bathrooms && (
            <div className="flex items-center gap-1.5">
              <Bath className="h-4 w-4 text-muted-foreground" />
              <span>{property.bathrooms} حمام</span>
            </div>
          )}
          
          {property.capacity && (
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{property.capacity} شخص</span>
            </div>
          )}
        </div>
        
        {/* وسائل الراحة */}
        {showAmenities && property.amenities && property.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {property.amenities.slice(0, 3).map((amenity, index) => (
              <Badge key={index} variant="secondary" className="font-normal text-xs">
                {amenity}
              </Badge>
            ))}
            {property.amenities.length > 3 && (
              <Badge variant="outline" className="font-normal text-xs">
                +{property.amenities.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter className={cn("p-4 pt-0 flex justify-between items-center", variant === 'compact' && "py-3")}>
        {/* السعر */}
        {showPrice && (
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="font-bold text-lg">{formatCurrency(property.price)}</span>
              {property.priceUnit && (
                <span className="text-sm text-muted-foreground">/ {property.priceUnit}</span>
              )}
            </div>
            {property.discount && property.discount > 0 && (
              <span className="text-sm line-through text-muted-foreground">
                {formatCurrency(property.price * (1 + property.discount / 100))}
              </span>
            )}
          </div>
        )}
        
        {/* زر عرض التفاصيل */}
        <Link href={`/property/${property.id}`}>
          <Button size="sm" className="gap-1">
            عرض التفاصيل
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
});

OptimizedPropertyCard.displayName = 'OptimizedPropertyCard';
export default OptimizedPropertyCard;