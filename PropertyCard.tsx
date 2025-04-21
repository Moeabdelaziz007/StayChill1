import React, { useState } from 'react';
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BlurImage } from "@/components/ui/blur-image";
import { GlassCard } from "@/components/ui/glass-card";
import { Heart, MapPin, Star, BedDouble, Bath, ArrowRight, Users, Share2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { DirectionalIcon } from "@/components/ui/directional-icon";
import { useMobile } from "@/hooks/use-mobile";

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

interface PropertyCardProps {
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
}

/**
 * مكون PropertyCard المحسن لعرض تفاصيل العقار
 * يدعم التحميل البطيء للصور وأنماط عرض متعددة
 */
export function PropertyCard({
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
}: PropertyCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const { locale } = useTranslation();
  const isMobile = useMobile();
  
  // تحضير بعض المتغيرات للعرض
  const isFeatured = variant === 'featured' || property.featured;
  const thumbnailImage = property.thumbnailImage || property.images[0];
  const displayImage = isFeatured && property.images.length > 1 
    ? property.images[0] 
    : thumbnailImage;
  
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
  
  // عرض هيكل التحميل إذا كانت البيانات قيد التحميل
  if (isLoading) {
    return (
      <Card className={cn("overflow-hidden h-full transition-all duration-300 hover:shadow-lg", className)}>
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
  
  // Mobile enhanced version with GlassCard for a modern look on mobile devices
  if (isMobile) {
    return (
      <div className={cn("relative h-full", className)}>
        <Link href={`/property/${property.id}`}>
          <div className="relative rounded-lg overflow-hidden">
            <BlurImage
              src={displayImage}
              alt={property.title}
              className="w-full object-cover"
              containerClassName="cursor-pointer"
              style={{ aspectRatio: "16/9" }}
            />
            
            {/* Price Tag overlay */}
            {showPrice && (
              <GlassCard 
                className="absolute bottom-3 left-3 p-2 z-10"
                variant="premium"
                shadow="glow"
              >
                <span className="font-bold text-white">{formatCurrency(property.price)}</span>
                {property.priceUnit && (
                  <span className="text-xs text-white/80">/{property.priceUnit}</span>
                )}
              </GlassCard>
            )}
            
            {/* Feature badges */}
            <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
              {enableFavorite && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full bg-black/40 hover:bg-black/60 border border-white/10"
                  onClick={handleFavoriteClick}
                >
                  <Heart className={cn("h-4 w-4", isFavorite ? "fill-red-500 text-red-500" : "text-white")} />
                </Button>
              )}
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full bg-black/40 hover:bg-black/60 border border-white/10"
                onClick={(e) => e.preventDefault()}
              >
                <Share2 className="h-4 w-4 text-white" />
              </Button>
            </div>
            
            {/* Feature badges */}
            {isFeatured && (
              <Badge className="absolute top-3 left-3 z-10 bg-primary text-black font-medium">
                Featured
              </Badge>
            )}
            
            {property.discount && property.discount > 0 && (
              <Badge className="absolute bottom-14 left-3 z-10 bg-green-600 text-white font-medium">
                {property.discount}% OFF
              </Badge>
            )}
          </div>
        </Link>
        
        <div className="mt-3 space-y-2">
          {/* Rating */}
          {showRating && property.rating && (
            <div className="flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{property.rating.toFixed(1)}</span>
              {property.reviewCount && (
                <span className="text-sm text-muted-foreground">({property.reviewCount} reviews)</span>
              )}
            </div>
          )}
          
          {/* Title */}
          <h3 className="font-bold text-xl line-clamp-1">
            <Link href={`/property/${property.id}`} className="hover:text-primary transition-colors">
              {property.title}
            </Link>
          </h3>
          
          {/* Location */}
          {showLocation && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{property.location}</span>
            </div>
          )}
          
          {/* Features */}
          <div className="flex flex-wrap gap-3 text-sm py-1">
            {property.bedrooms && (
              <div className="flex items-center gap-1.5">
                <BedDouble className="h-4 w-4 text-primary" />
                <span>{property.bedrooms}</span>
              </div>
            )}
            
            {property.bathrooms && (
              <div className="flex items-center gap-1.5">
                <Bath className="h-4 w-4 text-primary" />
                <span>{property.bathrooms}</span>
              </div>
            )}
            
            {property.capacity && (
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-primary" />
                <span>{property.capacity}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  // Desktop version
  return (
    <Card 
      className={cn(
        "overflow-hidden h-full transition-all duration-300 hover:shadow-lg",
        isFeatured && "border-primary/30",
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
          />
        </Link>
        
        {/* زر المفضلة */}
        {enableFavorite && (
          <Button 
            variant="ghost" 
            size="icon" 
            className={`absolute top-2 ${locale === 'ar' ? 'left-2' : 'right-2'} rounded-full bg-background/80 hover:bg-background transition-colors z-10`}
            onClick={handleFavoriteClick}
            aria-label={isFavorite ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
          >
            <Heart className={cn("h-5 w-5", isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground")} />
          </Button>
        )}
        
        {/* علامة "مميز" إذا كان العقار مميزًا */}
        {isFeatured && (
          <Badge className={`absolute top-2 ${locale === 'ar' ? 'right-2' : 'left-2'} z-10 bg-primary text-xs font-medium`}>
            {locale === 'ar' ? 'عقار مميز' : 'Featured'}
          </Badge>
        )}
        
        {/* عرض الخصم إذا كان متاحًا */}
        {property.discount && property.discount > 0 && (
          <Badge className={`absolute bottom-2 ${locale === 'ar' ? 'right-2' : 'left-2'} z-10 bg-green-600 text-xs font-medium`}>
            {locale === 'ar' ? `خصم ${property.discount}%` : `${property.discount}% OFF`}
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
              <span>{property.bedrooms} {locale === 'ar' ? 'غرفة نوم' : 'Bedrooms'}</span>
            </div>
          )}
          
          {property.bathrooms && (
            <div className="flex items-center gap-1.5">
              <Bath className="h-4 w-4 text-muted-foreground" />
              <span>{property.bathrooms} {locale === 'ar' ? 'حمام' : 'Bathrooms'}</span>
            </div>
          )}
          
          {property.capacity && (
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{property.capacity} {locale === 'ar' ? 'شخص' : 'Guests'}</span>
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
            {locale === 'ar' ? 'عرض التفاصيل' : 'View Details'}
            <DirectionalIcon
              icon={ArrowRight}
              flipInRtl={true}
              className="h-4 w-4"
            />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

export default PropertyCard;