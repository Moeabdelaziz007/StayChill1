import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Restaurant } from "@shared/schema";
import { useTranslation } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

import { RestaurantCard } from "@/components/restaurants/RestaurantCard";
import { RestaurantReservationForm } from "@/components/restaurants/RestaurantReservationForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Search, MapPin } from "lucide-react";

// قائمة المواقع المتاحة
const LOCATIONS = ["الساحل الشمالي", "رأس الحكمة", "مارينا", "شرم الشيخ", "مرسى مطروح"];
// قائمة أنواع المطابخ
const CUISINE_TYPES = [
  "مأكولات بحرية", 
  "مأكولات مصرية", 
  "مأكولات عربية", 
  "مأكولات إيطالية", 
  "مأكولات آسيوية", 
  "وجبات سريعة"
];

export default function RestaurantsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [selectedCuisine, setSelectedCuisine] = useState<string>("");
  const [selectedTab, setSelectedTab] = useState<string>("all");
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);

  // جلب بيانات المطاعم
  const { data: restaurants, isLoading, error } = useQuery<Restaurant[]>({
    queryKey: ["/api/restaurants"],
    queryFn: async () => {
      const response = await fetch("/api/restaurants");
      if (!response.ok) {
        throw new Error("Failed to fetch restaurants");
      }
      return response.json();
    },
  });

  // جلب المطاعم المميزة
  const { data: featuredRestaurants, isLoading: isLoadingFeatured } = useQuery<Restaurant[]>({
    queryKey: ["/api/restaurants/featured"],
    queryFn: async () => {
      const response = await fetch("/api/restaurants/featured");
      if (!response.ok) {
        throw new Error("Failed to fetch featured restaurants");
      }
      return response.json();
    },
  });

  // تصفية المطاعم حسب المواقع وأنواع المطابخ والبحث
  const filteredRestaurants = restaurants
    ? restaurants.filter((restaurant) => {
        const matchesSearch = searchQuery
          ? restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            restaurant.description.toLowerCase().includes(searchQuery.toLowerCase())
          : true;
        
        const matchesLocation = selectedLocation
          ? restaurant.location === selectedLocation
          : true;
        
        const matchesCuisine = selectedCuisine
          ? restaurant.cuisineType === selectedCuisine
          : true;

        const matchesTab = selectedTab === "all" || 
          (selectedTab === "featured" && restaurant.featured);
        
        return matchesSearch && matchesLocation && matchesCuisine && matchesTab;
      })
    : [];

  // معالج الضغط على زر الحجز
  const handleReserveClick = (restaurant: Restaurant) => {
    // التحقق إذا كان المستخدم مسجل الدخول
    if (!user) {
      toast({
        title: t('common.loginRequired'),
        description: t('restaurants.loginToReserve'),
        variant: "destructive",
      });
      // يمكن توجيه المستخدم لصفحة تسجيل الدخول
      // window.location.href = "/login";
      return;
    }
    setSelectedRestaurant(restaurant);
  };

  // معالج إغلاق نموذج الحجز
  const handleReservationClose = () => {
    setSelectedRestaurant(null);
  };

  // معالج نجاح الحجز
  const handleReservationSuccess = () => {
    setSelectedRestaurant(null);
  };
  
  // قم بتحميل الشكل المناسب عند تحميل البيانات
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-xl font-medium">{t('restaurants.loading')}</p>
      </div>
    );
  }

  // عرض رسالة خطأ إذا فشل تحميل البيانات
  if (error) {
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
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold mb-3">{t('restaurants.title')}</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {t('restaurants.subtitle')}
        </p>
      </div>

      {/* فلاتر البحث */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('restaurants.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={selectedLocation}
          onValueChange={setSelectedLocation}
        >
          <SelectTrigger>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <SelectValue placeholder={t('restaurants.selectLocation')} />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-locations">{t('restaurants.allLocations')}</SelectItem>
            {LOCATIONS.map((location) => (
              <SelectItem key={location} value={location}>
                {location}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={selectedCuisine}
          onValueChange={setSelectedCuisine}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('restaurants.selectCuisine')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-cuisines">{t('restaurants.allCuisines')}</SelectItem>
            {CUISINE_TYPES.map((cuisine) => (
              <SelectItem key={cuisine} value={cuisine}>
                {cuisine}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* التبويبات للتصفية */}
      <Tabs 
        defaultValue="all" 
        value={selectedTab}
        onValueChange={setSelectedTab}
        className="mb-8"
      >
        <TabsList className="grid w-full md:w-auto grid-cols-2">
          <TabsTrigger value="all">{t('restaurants.allRestaurants')}</TabsTrigger>
          <TabsTrigger value="featured">{t('restaurants.featuredRestaurants')}</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* قائمة المطاعم */}
      {filteredRestaurants.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl font-medium mb-2">{t('restaurants.noResultsFound')}</p>
          <p className="text-muted-foreground max-w-md mx-auto">
            {t('restaurants.tryAdjustingFilters')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRestaurants.map((restaurant) => (
            <RestaurantCard
              key={restaurant.id}
              restaurant={restaurant}
              onReserveClick={handleReserveClick}
            />
          ))}
        </div>
      )}

      {/* نموذج الحجز في حوار منبثق */}
      <Dialog open={!!selectedRestaurant} onOpenChange={(open) => !open && setSelectedRestaurant(null)}>
        <DialogContent className="sm:max-w-xl">
          {selectedRestaurant && (
            <RestaurantReservationForm
              restaurant={selectedRestaurant}
              onSuccess={handleReservationSuccess}
              onCancel={handleReservationClose}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}