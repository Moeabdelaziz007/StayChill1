import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { PropertyFilters, type PropertyFilterValues } from "@/components/properties/PropertyFilters";
import PropertyCard from "@/components/properties/PropertyCard";
import { PropertySkeleton } from "@/components/ui/skeletons/PropertySkeleton";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FilterIcon, SortDesc } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

type Property = {
  id: number;
  title: string;
  description: string;
  location: string;
  address: string;
  price: number;
  beds: number;
  baths: number;
  guests: number;
  images: string[];
  amenities: string[] | null;
  rating: number;
  reviewsCount: number;
  active: boolean | null;
  featured: boolean | null;
  userId: number;
};

type SortOption = {
  label: string;
  value: string;
  sortFn: (a: Property, b: Property) => number;
};

const sortOptions: SortOption[] = [
  {
    label: "الأقل سعرًا",
    value: "price_asc",
    sortFn: (a, b) => a.price - b.price,
  },
  {
    label: "الأعلى سعرًا",
    value: "price_desc",
    sortFn: (a, b) => b.price - a.price,
  },
  {
    label: "الأعلى تقييمًا",
    value: "rating_desc",
    sortFn: (a, b) => b.rating - a.rating,
  },
  {
    label: "الأكثر مراجعات",
    value: "reviews_desc",
    sortFn: (a, b) => b.reviewsCount - a.reviewsCount,
  },
];

export default function SearchPage() {
  const [, setLocation] = useLocation();
  const [filters, setFilters] = useState<PropertyFilterValues>({
    location: '',
    priceRange: [0, 5000],
    bedrooms: null,
    guests: null,
    amenities: [],
  });
  
  const [sortBy, setSortBy] = useState<SortOption>(sortOptions[0]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  // Fetch all properties
  const { 
    data: properties = [], 
    isLoading,
    error
  } = useQuery<Property[]>({
    queryKey: ['/api/properties', { limit: 50 }],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/properties?limit=50');
      return response.json();
    },
  });
  
  // Apply filters and sorting
  const filteredProperties = properties.filter(property => {
    // Filter by location
    if (filters.location && !property.location.toLowerCase().includes(filters.location.toLowerCase())) {
      return false;
    }
    
    // Filter by price range
    if (property.price < filters.priceRange[0] || property.price > filters.priceRange[1]) {
      return false;
    }
    
    // Filter by bedrooms
    if (filters.bedrooms !== null && property.beds < filters.bedrooms) {
      return false;
    }
    
    // Filter by guests
    if (filters.guests !== null && property.guests < filters.guests) {
      return false;
    }
    
    // Filter by amenities
    if (filters.amenities.length > 0) {
      if (!property.amenities) return false;
      
      const hasAllAmenities = filters.amenities.every(amenity => 
        property.amenities?.includes(amenity)
      );
      
      if (!hasAllAmenities) return false;
    }
    
    return true;
  }).sort(sortBy.sortFn);
  
  // Effect to handle query params and deep linking (placeholder for now)
  useEffect(() => {
    // Later: handle query params from URL for deep linking
  }, []);
  
  const handleFilterChange = (newFilters: PropertyFilterValues) => {
    setFilters(newFilters);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap justify-between items-center">
        <div className="mb-4 md:mb-0">
          <h1 className="text-3xl font-bold mb-1">البحث عن العقارات</h1>
          <p className="text-gray-600">
            {filteredProperties.length} عقار متاح
            {filters.location ? ` في ${filters.location}` : ''}
          </p>
        </div>
        
        <div className="flex space-x-2 items-center rtl:space-x-reverse">
          <Button
            variant="outline"
            className="md:hidden flex items-center"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
          >
            <FilterIcon className="h-4 w-4 mr-2" />
            الفلاتر
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center">
                <SortDesc className="h-4 w-4 mr-2" />
                <span>الترتيب: {sortBy.label}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {sortOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => setSortBy(option)}
                  className={sortBy.value === option.value ? 'bg-gray-100' : ''}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button
            variant="ghost"
            onClick={() => setLocation('/')}
            className="hidden md:flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            العودة للصفحة الرئيسية
          </Button>
        </div>
      </div>
      
      {/* Mobile Filters (shows/hides based on state) */}
      <div className={`md:hidden mb-6 ${showMobileFilters ? 'block' : 'hidden'}`}>
        <PropertyFilters
          onChange={handleFilterChange}
          defaultValues={filters}
        />
      </div>
      
      {/* Main Content */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Filters - desktop only */}
        <div className="hidden md:block w-full md:w-72 flex-shrink-0">
          <div className="sticky top-24">
            <PropertyFilters
              onChange={handleFilterChange}
              defaultValues={filters}
            />
          </div>
        </div>
        
        {/* Properties Grid */}
        <div className="flex-1">
          {isLoading ? (
            <PropertySkeleton count={8} layout="grid" />
          ) : error ? (
            <div className="text-center p-8 bg-red-50 rounded-lg">
              <p className="text-red-500">حدث خطأ في جلب العقارات</p>
              <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                إعادة المحاولة
              </Button>
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="text-center p-12 bg-gray-50 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">لا توجد عقارات تطابق الفلاتر المحددة</h3>
              <p className="text-gray-500 mb-6">حاول تغيير الفلاتر للحصول على نتائج أكثر</p>
              <Button onClick={() => setFilters({
                location: '',
                priceRange: [0, 5000],
                bedrooms: null,
                guests: null,
                amenities: [],
              })}>
                إعادة تعيين الفلاتر
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}