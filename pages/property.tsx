import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useProperties } from "@/hooks/useProperties";
import { useAuth } from "@/hooks/useAuth";
import PropertyGallery from "@/components/properties/PropertyGallery";
import BookingForm from "@/components/bookings/BookingForm";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import LoginModal from "@/components/auth/LoginModal";
import VirtualTour from "@/components/property/VirtualTour";
import AreaGuide from "@/components/property/AreaGuide";
import AIPropertyRecommendations from "@/components/property/AIPropertyRecommendations";
import { PropertyDetailSkeleton } from "@/components/ui/advanced-skeleton";
import { VacationRentalJsonLd, BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import type { Property } from "@shared/schema";

// Ensure we handle dates properly when they come from the API
const processProperty = (propertyData: any): Property => {
  return {
    ...propertyData,
    // Convert string dates to Date objects if needed
    createdAt: propertyData.createdAt instanceof Date 
      ? propertyData.createdAt 
      : new Date(propertyData.createdAt),
    // Ensure amenities is never null
    amenities: propertyData.amenities || []
  };
};

interface PropertyDetailsProps {
  id: number;
}

interface AmenityInfo {
  label: string;
  icon: string;
}

const PropertyDetails = ({ id }: PropertyDetailsProps) => {
  const [, navigate] = useLocation();
  const { getProperty } = useProperties();
  const { user } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  
  useEffect(() => {
    const loadProperty = async () => {
      setIsLoading(true);
      try {
        const data = await getProperty(id);
        // Process property data to ensure type compatibility
        setProperty(processProperty(data));
      } catch (error) {
        console.error("Error loading property:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProperty();
  }, [id, getProperty]);
  
  const handleShare = () => {
    if (!property) return;
    
    if (navigator.share) {
      navigator.share({
        title: property.title,
        text: `Check out this property on StayChill: ${property.title}`,
        url: window.location.href,
      });
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };
  
  if (isLoading) {
    return <PropertyDetailSkeleton className="py-10" />;
  }
  
  if (!property) {
    return (
      <div className="py-10 text-center">
        <h2 className="text-2xl font-bold text-dark-gray mb-4">Property Not Found</h2>
        <p className="text-medium-gray mb-6">The property you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => navigate("/")}>Back to Home</Button>
      </div>
    );
  }
  
  const formatAmenities = (amenities: string[] | null | undefined): AmenityInfo[] => {
    if (!amenities || amenities.length === 0) return [];
    
    const amenityMap: Record<string, AmenityInfo> = {
      wifi: { label: "WiFi", icon: "wifi" },
      air_conditioning: { label: "Air Conditioning", icon: "thermometer" },
      kitchen: { label: "Kitchen", icon: "utensils" },
      pool: { label: "Pool", icon: "droplet" },
      parking: { label: "Free Parking", icon: "car" },
      tv: { label: "TV", icon: "tv" },
      washer: { label: "Washer", icon: "wind" },
      beachfront: { label: "Beachfront", icon: "umbrella-beach" },
      waterfront: { label: "Waterfront", icon: "water" },
      amazing_views: { label: "Amazing Views", icon: "mountain" }
    };
    
    return amenities.map((amenity: string) => amenityMap[amenity] || { label: amenity, icon: "check" });
  };
  
  const formattedAmenities = formatAmenities(property.amenities);
  
  // تكوين البيانات المنظمة (structured data) لفتات التنقل للمستخدم (breadcrumbs)
  const breadcrumbItems = [
    { name: "الرئيسية", url: `${window.location.origin}/` },
    { name: property.location, url: `${window.location.origin}/search?location=${encodeURIComponent(property.location)}` },
    { name: property.title, url: window.location.href }
  ];

  return (
    <div className="py-6">
      {/* إضافة بيانات Schema.org لتحسين SEO */}
      <VacationRentalJsonLd property={property} />
      <BreadcrumbJsonLd items={breadcrumbItems} />
      
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-dark-gray mb-2">{property.title}</h1>
        <div className="flex flex-wrap justify-between items-center">
          <div className="flex items-center gap-2">
            {property.rating && (
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-yellow-500">
                  <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                </svg>
                <span className="ml-1 font-medium">{property.rating.toFixed(1)}</span>
              </div>
            )}
            <span className="text-medium-gray">•</span>
            <span className="text-medium-gray">{property.location}</span>
          </div>
          <div className="flex space-x-2 mt-2 sm:mt-0">
            <Button variant="outline" size="sm" className="flex items-center" onClick={handleShare}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
              </svg>
              Share
            </Button>
            <Button variant="outline" size="sm" className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
              Save
            </Button>
          </div>
        </div>
      </div>
      
      <PropertyGallery images={property.images} title={property.title} />
      
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="col-span-2">
          <div className="pb-6 border-b">
            <div className="flex justify-between">
              <div>
                <h2 className="text-xl font-bold text-dark-gray">
                  {property.beds > 1 ? `${property.beds} bedrooms` : '1 bedroom'} • {property.baths > 1 ? `${property.baths} bathrooms` : '1 bathroom'}
                </h2>
                <p className="text-medium-gray">Up to {property.guests} guests</p>
              </div>
              <div>
                <Avatar className="h-12 w-12">
                  <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="Host" />
                  <AvatarFallback>HC</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
          
          <div className="py-6 border-b">
            <div className="prose max-w-none text-dark-gray">
              <p>{property.description}</p>
            </div>
          </div>
          
          {formattedAmenities.length > 0 && (
            <div className="py-6 border-b">
              <h2 className="text-xl font-bold text-dark-gray mb-4">Amenities</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formattedAmenities.map((amenity, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                      <i className={`fas fa-${amenity.icon} text-medium-gray`}></i>
                    </div>
                    <span>{amenity.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {property.reviewsCount && property.reviewsCount > 0 && (
            <div className="py-6 border-b">
              <h2 className="text-xl font-bold text-dark-gray mb-4">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-yellow-500 mr-1">
                    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                  </svg>
                  <span>{property.rating ? property.rating.toFixed(1) : '0'} · {property.reviewsCount} reviews</span>
                </div>
              </h2>
              {/* Reviews would be displayed here */}
              <Button variant="outline" className="mt-4">Show all reviews</Button>
            </div>
          )}
          
          <div className="py-6 border-b">
            <h2 className="text-xl font-bold text-dark-gray mb-4">Location</h2>
            <p className="text-medium-gray mb-4">{property.address}</p>
            <div className="aspect-w-16 aspect-h-9 bg-gray-200 rounded-lg">
              <div className="flex items-center justify-center h-full">
                <p className="text-medium-gray">Map View</p>
              </div>
            </div>
          </div>
          
          {/* Virtual Tour Experience */}
          <div className="py-6 border-b">
            <VirtualTour propertyId={property.id} propertyTitle={property.title} />
          </div>
          
          {/* Area Guide */}
          <div className="py-6 border-b">
            <AreaGuide propertyId={property.id} propertyLocation={property.location} />
          </div>
          
          {/* AI Property Recommendations */}
          <div className="py-6">
            <AIPropertyRecommendations currentProperty={property} />
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            {user ? (
              <BookingForm property={property} />
            ) : (
              <div className="border rounded-xl p-6 text-center">
                <h3 className="text-lg font-bold mb-2">Ready to book this property?</h3>
                <p className="text-medium-gray mb-4">Sign in to make a reservation</p>
                <Button className="w-full mb-3" onClick={() => setIsLoginModalOpen(true)}>Sign in to book</Button>
                <p className="text-xs text-medium-gray">
                  You won't be charged until you complete your booking
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
        onRegisterClick={() => {
          setIsLoginModalOpen(false);
          // Would open register modal here
        }}
      />
    </div>
  );
};

export default PropertyDetails;
