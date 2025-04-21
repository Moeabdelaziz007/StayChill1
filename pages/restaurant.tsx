import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Restaurant as RestaurantType, RestaurantReview } from "@shared/schema";

// Define the Restaurant interface with all required properties to avoid type errors
interface Restaurant extends RestaurantType {
  // Ensure all properties used in the component are defined
  cuisineType: string;
  reviewsCount: number;
  images: string[];
  openingTime: string;
  closingTime: string;
  address: string;
  website?: string;
  contactEmail?: string;
}
import { useTranslation } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

import { RestaurantReservationForm } from "@/components/restaurants/RestaurantReservationForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { MapPin, Clock, Phone, Mail, Globe, Star, CalendarRange } from "lucide-react";
import { Loader2 } from "lucide-react";

interface RestaurantPageProps {
  id: number;
}

const RestaurantPage = ({ id }: RestaurantPageProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [showReservationForm, setShowReservationForm] = useState(false);
  
  // جلب معلومات المطعم
  const { data: restaurant, isLoading: isLoadingRestaurant, error } = useQuery<Restaurant>({
    queryKey: [`/api/restaurants/${id}`],
    queryFn: async () => {
      const response = await fetch(`/api/restaurants/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch restaurant");
      }
      return response.json();
    },
  });
  
  // جلب تقييمات المطعم
  const { data: reviews, isLoading: isLoadingReviews } = useQuery<RestaurantReview[]>({
    queryKey: [`/api/restaurants/${id}/reviews`],
    queryFn: async () => {
      const response = await fetch(`/api/restaurants/${id}/reviews`);
      if (!response.ok) {
        throw new Error("Failed to fetch restaurant reviews");
      }
      return response.json();
    },
    enabled: !!restaurant,
  });
  
  // أنشئ رابط من الساعات
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    return `${hour % 12 || 12}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
  };
  
  const openingHours = restaurant ? `${formatTime(restaurant.openingTime)} - ${formatTime(restaurant.closingTime)}` : '';
  
  // تنسيق نطاق السعر ($, $$, $$$)
  const getPriceLabel = (priceRange: string) => {
    switch (priceRange) {
      case '$': return t('restaurants.priceRanges.budget');
      case '$$': return t('restaurants.priceRanges.moderate');
      case '$$$': return t('restaurants.priceRanges.expensive');
      default: return priceRange;
    }
  };
  
  // معالج إغلاق نموذج الحجز
  const handleReservationClose = () => {
    setShowReservationForm(false);
  };
  
  // معالج نجاح الحجز
  const handleReservationSuccess = () => {
    setShowReservationForm(false);
  };
  
  // حساب متوسط تقييم المطعم
  const averageRating = restaurant?.rating || 0;
  
  // عرض حالة التحميل
  if (isLoadingRestaurant) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-xl font-medium">{t('restaurants.loading')}</p>
      </div>
    );
  }
  
  // عرض رسالة الخطأ
  if (error || !restaurant) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
        <p className="text-xl font-medium text-destructive mb-4">{t('restaurants.error')}</p>
        <p className="text-muted-foreground max-w-md">
          {t('restaurants.errorDescription')}
        </p>
        <Button 
          className="mt-4" 
          onClick={() => window.location.reload()}
        >
          {t('common.tryAgain')}
        </Button>
      </div>
    );
  }
  
  return (
    <div className="container py-8">
      {/* رأس الصفحة */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">{restaurant.name}</h1>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Badge variant="outline">{restaurant.cuisineType}</Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {restaurant.location}
          </Badge>
          <Badge variant="outline">{getPriceLabel(restaurant.priceRange)}</Badge>
          {restaurant.featured && (
            <Badge variant="secondary" className="bg-primary text-primary-foreground">
              {t('restaurants.featured')}
            </Badge>
          )}
          {averageRating > 0 && (
            <div className="flex items-center gap-1">
              <Star className="fill-green-500 h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">{averageRating.toFixed(1)}</span>
              <span className="text-muted-foreground text-sm">
                ({restaurant.reviewsCount} {t('restaurants.reviews')})
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* صور المطعم */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="md:col-span-2 aspect-video rounded-lg overflow-hidden">
          <OptimizedImage 
            src={restaurant.images?.[0] || '/placeholder-restaurant.jpg'} 
            alt={restaurant.name}
            width={800}
            height={450}
            className="object-cover w-full h-full"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          {restaurant.images?.slice(1, 5).map((image, index) => (
            <div key={index} className="aspect-square rounded-lg overflow-hidden">
              <OptimizedImage 
                src={image} 
                alt={`${restaurant.name} ${index + 1}`}
                width={200}
                height={200}
                className="object-cover w-full h-full"
              />
            </div>
          ))}
        </div>
      </div>
      
      {/* معلومات المطعم والحجز */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2">
          <Tabs defaultValue="details">
            <TabsList className="mb-4">
              <TabsTrigger value="details">{t('restaurants.details')}</TabsTrigger>
              <TabsTrigger value="reviews">{t('restaurants.reviews')}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">{t('restaurants.description')}</h2>
                <p className="text-muted-foreground whitespace-pre-line">
                  {restaurant.description}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-medium">{t('restaurants.location')}</h3>
                        <p className="text-sm text-muted-foreground">{restaurant.address}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-medium">{t('restaurants.openingHours')}</h3>
                        <p className="text-sm text-muted-foreground">{openingHours}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-medium">{t('restaurants.phone')}</h3>
                        <p className="text-sm text-muted-foreground">{restaurant.contactPhone}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {restaurant.contactEmail && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Mail className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                        <div>
                          <h3 className="font-medium">{t('restaurants.email')}</h3>
                          <p className="text-sm text-muted-foreground">{restaurant.contactEmail}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {restaurant.website && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Globe className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                        <div>
                          <h3 className="font-medium">{t('restaurants.website')}</h3>
                          <a 
                            href={restaurant.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            {restaurant.website}
                          </a>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="reviews">
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-4">{t('restaurants.customerReviews')}</h2>
                
                {isLoadingReviews ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : reviews && reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <Card key={review.id} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <Avatar>
                              <AvatarImage src={review.userAvatar || undefined} />
                              <AvatarFallback>
                                {review.username?.charAt(0).toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <div className="font-medium">{review.username}</div>
                                <div className="flex items-center gap-1 text-green-500">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star 
                                      key={i} 
                                      className={`h-4 w-4 ${i < review.rating ? 'fill-green-500' : 'text-gray-300'}`} 
                                    />
                                  ))}
                                </div>
                              </div>
                              <div className="text-sm text-muted-foreground mb-2">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </div>
                              <p className="text-sm">{review.comment}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border rounded-lg">
                    <p className="text-muted-foreground">
                      {t('restaurants.noReviews')}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* بطاقة الحجز */}
        <div>
          <Card className="sticky top-20">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">{t('restaurants.makeReservation')}</h2>
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-2">
                  <CalendarRange className="h-5 w-5 text-primary" />
                  <span className="text-muted-foreground">
                    {t('restaurants.availableForReservation')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary" />
                  <span className="text-muted-foreground">
                    {t('restaurants.earnPoints')}
                  </span>
                </div>
              </div>
              <Button 
                className="w-full" 
                size="lg"
                onClick={() => setShowReservationForm(true)}
              >
                {t('restaurants.reserveNow')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* نموذج الحجز في حوار منبثق */}
      <Dialog open={showReservationForm} onOpenChange={setShowReservationForm}>
        <DialogContent className="sm:max-w-xl">
          <RestaurantReservationForm
            restaurant={restaurant}
            onSuccess={handleReservationSuccess}
            onCancel={handleReservationClose}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RestaurantPage;