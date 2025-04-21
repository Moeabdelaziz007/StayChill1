import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import LocationFilter from "@/components/properties/LocationFilter";
import PropertyCard from "@/components/properties/PropertyCard";
import { useProperties, type Property } from "@/hooks/useProperties";
import { useAuth } from "@/hooks/useAuth";
import { getPropertyRecommendations } from "@/lib/gemini";
import { apiRequest } from "@/lib/queryClient";
import { PropertySkeleton } from "@/components/ui/skeletons/PropertySkeleton";
import AdvancedSkeleton from "@/components/ui/advanced-skeleton";
import { OrganizationJsonLd } from "@/components/seo/JsonLd";

const Home = () => {
  const { user } = useAuth();
  const { getProperties } = useProperties();
  const [error, setError] = useState<string | null>(null);

  // Using React Query for featured properties
  const { 
    data: featuredProperties = [], 
    isLoading: isLoadingFeatured,
    error: featuredError
  } = useQuery({
    queryKey: ['/api/properties/featured'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/properties/featured?limit=6');
      return response.json();
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    staleTime: 300000, // 5 minutes
  });

  // Using React Query for regular properties
  const { 
    data: regularProperties = [], 
    isLoading: isLoadingRegular
  } = useQuery({
    queryKey: ['/api/properties', { limit: 4 }],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/properties?limit=4');
      return response.json();
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    staleTime: 300000, // 5 minutes
  });

  // Using React Query for recommended properties (only if user is logged in)
  const {
    data: recommendedProperties = [],
    isLoading: isLoadingRecommended
  } = useQuery({
    queryKey: ['/api/recommendations', user?.id],
    queryFn: async () => {
      if (!user) return regularProperties;
      
      try {
        // Try to get AI recommendations first
        const recommendations = await getPropertyRecommendations({
          location: "",
          guests: 2,
        });
        
        if (Array.isArray(recommendations) && recommendations.length > 0) {
          return recommendations;
        }
        
        // Fall back to regular properties if needed
        return regularProperties;
      } catch (error) {
        // Only log errors in development
        if (import.meta.env.DEV) {
          console.error("Error loading recommendations:", error);
        }
        return regularProperties;
      }
    },
    enabled: !!user, // Only run this query if user exists
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    staleTime: 300000, // 5 minutes
  });

  const renderPropertySkeleton = () => (
    <div className="w-full">
      <PropertySkeleton 
        count={4} 
        layout="grid"
        compact={false}
      />
    </div>
  );

  return (
    <div className="space-y-10 pb-10">
      {/* إضافة بيانات منظمة Schema.org لمؤسسة StayChill */}
      <OrganizationJsonLd />
      
      {/* Hero Section - Luxury Egyptian Beach Vacation */}
      <section className="relative overflow-hidden min-h-[750px] mb-8">
        {/* High-quality beach background image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=2000&q=80" 
            alt="شاطئ مصري" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#00182A]/90 via-[#00182A]/70 to-transparent"></div>
        </div>
        
        {/* Animated wave overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-40 z-0 opacity-60">
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-[#fff] opacity-20 rounded-t-[100%] animate-wave"></div>
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-[#fff] opacity-30 rounded-t-[100%] animate-wave-slow"></div>
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-[#fff] opacity-40 rounded-t-[100%] animate-wave-slower"></div>
        </div>
        
        {/* Egyptian decorative elements */}
        <div className="absolute top-[10%] right-[5%] animate-float-slow opacity-20 z-0 hidden lg:block">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-64 h-64 text-brand-light" fill="currentColor">
            <path d="M361.5 1.2c5 2.1 8.6 6.6 9.6 11.9L391 121l107.9 19.8c5.3 1 9.8 4.6 11.9 9.6s1.5 10.7-1.6 15.2L446.9 256l62.3 90.3c3.1 4.5 3.7 10.2 1.6 15.2s-6.6 8.6-11.9 9.6L391 391 371.1 498.9c-1 5.3-4.6 9.8-9.6 11.9s-10.7 1.5-15.2-1.6L256 446.9l-90.3 62.3c-4.5 3.1-10.2 3.7-15.2 1.6s-8.6-6.6-9.6-11.9L121 391 13.1 371.1c-5.3-1-9.8-4.6-11.9-9.6s-1.5-10.7 1.6-15.2L65.1 256 2.8 165.7c-3.1-4.5-3.7-10.2-1.6-15.2s6.6-8.6 11.9-9.6L121 121 140.9 13.1c1-5.3 4.6-9.8 9.6-11.9s10.7-1.5 15.2 1.6L256 65.1 346.3 2.8c4.5-3.1 10.2-3.7 15.2-1.6zM160 256a96 96 0 1 1 192 0 96 96 0 1 1 -192 0zm224 0a128 128 0 1 0 -256 0 128 128 0 1 0 256 0z" />
          </svg>
        </div>
        
        <div className="absolute bottom-[15%] left-[3%] animate-float opacity-30 z-0 hidden lg:block">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" className="w-32 h-32 text-[#00e1ff]" fill="currentColor">
            <path d="M413.5 237.5c-28.2 4.8-58.2-3.6-80-25.4l-38.1-38.1C280.4 159 272 139.8 272 120c0-48.6 39.4-88 88-88s88 39.4 88 88c0 45.1-33.8 82.1-77.5 87.5l42 42c17.1 17.1 43.7 19.3 63.2 5.4l3.2-2.3c2.4-1.7 5.7-1.1 7.4 1.3l11.8 16.7c1.7 2.4 1.1 5.7-1.3 7.4l-3.2 2.3c-30.9 22.1-72.1 18.4-99-8.4l-41.1-41.1-41.1 41.1c-26.9 26.9-68.1 30.6-99 8.4l-3.2-2.3c-2.4-1.7-3-5-1.3-7.4l11.8-16.7c1.7-2.4 5-3 7.4-1.3l3.2 2.3c19.4 13.9 46.1 11.7 63.2-5.4l42-42C232.1 202.1 198.4 165.1 198.4 120c0-48.6 39.4-88 88-88s88 39.4 88 88c0 19.8-8.4 39-23.4 53.9l-38.1 38.1c12.2 12.2 29.2 17.8 45.6 15l7.1-1.2c3-0.5 5.7 1.5 6.2 4.4l3.4 20.1c0.5 3-1.5 5.7-4.4 6.2l-7.3 1.2z" />
          </svg>
        </div>
        
        <div className="container mx-auto px-6 relative z-10 h-full flex items-center">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-20 md:py-28">
            {/* Left content - Heading and CTA */}
            <div className="lg:col-span-6 lg:pr-8">
              <div className="flex justify-between items-center mb-6">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-[#FFD700]/20 backdrop-blur-sm border border-[#FFD700]/30">
                  <div className="h-2 w-2 bg-[#FFD700] rounded-full animate-pulse mr-2"></div>
                  <span className="text-white font-medium text-sm">إجازة مثالية على شواطئ مصر</span>
                </div>
                
                {/* Admin Login Button */}
                <Link to="/admin-login">
                  <Button 
                    variant="ghost" 
                    className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    دخول المشرفين
                  </Button>
                </Link>
              </div>
              
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                <span className="block mb-2">استرخاء لا مثيل له</span>
                <span className="text-green-500">لسنا الوحيدون ولكننا الأفضل ✌🏼</span>
              </h1>
              
              <p className="text-white/90 text-lg md:text-xl mb-8 max-w-xl leading-relaxed">
                استمتع بإجازة لا تُنسى على أجمل شواطئ مصر الساحرة. تمتع بالراحة والرفاهية في أفخم المنتجعات والشاليهات على البحر مباشرة
              </p>
              
              {/* Advanced Search Bar - شريط البحث المتقدم */}
              <div className="mb-10 w-full max-w-2xl mx-auto lg:mx-0">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-1.5 shadow-xl border border-white/20 transform transition-all hover:scale-[1.02] duration-300">
                  <div className="flex flex-col md:flex-row items-stretch w-full">
                    <div className="flex-1 relative bg-white/5 rounded-xl overflow-hidden p-3 transition-all hover:bg-white/10 duration-200">
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                          <circle cx="11" cy="11" r="8"></circle>
                          <path d="m21 21-4.3-4.3"></path>
                        </svg>
                      </div>
                      <input 
                        type="text" 
                        className="w-full bg-transparent text-white/90 pr-10 pl-3 py-2 border-0 outline-none focus:ring-0 placeholder:text-white/50" 
                        placeholder="ابحث عن وجهتك..." 
                        dir="rtl"
                      />
                    </div>
                    
                    <div className="h-px md:w-px bg-white/10 my-2 md:my-0 md:mx-2"></div>
                    
                    <div className="flex-shrink-0 flex flex-col md:flex-row gap-2">
                      <div className="bg-white/5 rounded-xl px-4 py-3 transition-all hover:bg-white/10 duration-200 cursor-pointer flex justify-between items-center text-white/90 min-w-[150px]">
                        <span className="text-sm">الوجهة</span>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                          <path d="m6 9 6 6 6-6"></path>
                        </svg>
                      </div>
                      
                      <div className="bg-white/5 rounded-xl px-4 py-3 transition-all hover:bg-white/10 duration-200 cursor-pointer flex justify-between items-center text-white/90 min-w-[150px]">
                        <span className="text-sm">الضيوف</span>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                          <path d="m6 9 6 6 6-6"></path>
                        </svg>
                      </div>
                      
                      <Button className="bg-green-500 hover:bg-green-600 text-[#00182A] font-bold rounded-xl">
                        <svg className="w-5 h-5 mr-1 rtl:ml-1 rtl:mr-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        بحث
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-5 mb-10">
                <Button className="bg-green-500 hover:bg-green-600 text-[#00182A] font-bold text-lg px-8 py-6 shadow-xl rounded-xl group transition-all duration-300 border-2 border-green-500">
                  <span className="mr-2 group-hover:mr-5 transition-all duration-300">احجز إجازتك الآن</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 rtl:rotate-180 transition-transform group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-2 border-white/50 text-white hover:bg-white/10 font-medium text-lg shadow-lg rounded-xl"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  استكشاف جولة افتراضية
                </Button>
              </div>
              
              <div className="flex items-center space-x-8 rtl:space-x-reverse">
                <div className="flex -space-x-4 rtl:space-x-reverse">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-12 h-12 rounded-full border-2 border-green-500 overflow-hidden">
                      <img 
                        src={`https://randomuser.me/api/portraits/men/${20 + i}.jpg`}
                        alt="Guest" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                  <div className="w-12 h-12 rounded-full flex items-center justify-center bg-green-500/20 backdrop-blur-sm border-2 border-green-500 text-white font-bold">+99</div>
                </div>
                <div>
                  <div className="flex items-center text-white mb-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    <span className="ml-2">4.9/5</span>
                  </div>
                  <div className="text-white/70 text-sm">أكثر من 2,500 تقييم ممتاز</div>
                </div>
              </div>
            </div>
            
            {/* Right Content - Featured Properties Showcase */}
            <div className="lg:col-span-6 hidden lg:block relative">
              <div className="absolute inset-0 bg-[#00182A]/20 backdrop-blur-sm rounded-3xl transform rotate-3"></div>
              
              <div className="relative z-10 bg-white/10 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-white/20 overflow-hidden transform -rotate-2 transition-transform hover:rotate-0 duration-700">
                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-white/10 to-transparent"></div>
                <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-white/10 to-transparent"></div>
                
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center">
                    <div className="bg-green-500 h-12 w-12 rounded-xl flex items-center justify-center mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#00182A]" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-white text-xl font-bold">وجهات ساحلية مميزة</h3>
                      <p className="text-white/70 text-sm">اختر من بين أفضل الوجهات المصرية</p>
                    </div>
                  </div>
                  <div className="bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm flex items-center">
                    <span className="text-white mr-2">مصر</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div className="group relative rounded-2xl overflow-hidden shadow-lg h-56">
                      <img 
                        src="https://images.unsplash.com/photo-1600520611035-84157ad4084d?auto=format&fit=crop&w=800&q=80" 
                        alt="شرم الشيخ" 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="text-white font-bold text-lg">شرم الشيخ</h4>
                            <div className="flex items-center text-white/80">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                              </svg>
                              <span className="text-sm">أفضل شواطئ الغوص</span>
                            </div>
                          </div>
                          <div className="bg-white/20 px-2 py-1 rounded-lg backdrop-blur-sm">
                            <span className="text-white text-sm font-bold">$120</span>
                            <span className="text-white/70 text-xs">/ليلة</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="group relative rounded-2xl overflow-hidden shadow-lg h-40">
                      <img 
                        src="https://images.unsplash.com/photo-1603466184840-95c3f6b75e6f?auto=format&fit=crop&w=800&q=80" 
                        alt="مارينا" 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="text-white font-bold text-lg">مارينا</h4>
                            <div className="flex items-center text-white/80">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M6 3a1 1 0 011-1h.01a1 1 0 010 2H7a1 1 0 01-1-1zm2 3a1 1 0 00-2 0v1H5a1 1 0 000 2h1v1a1 1 0 002 0V9h1a1 1 0 000-2H8V6zm4 0a1 1 0 011-1h.01a1 1 0 110 2H13a1 1 0 01-1-1zm2 3a1 1 0 00-2 0v1h-1a1 1 0 000 2h1v1a1 1 0 002 0v-1h1a1 1 0 000-2h-1V9z" />
                              </svg>
                              <span className="text-sm">مطاعم فاخرة</span>
                            </div>
                          </div>
                          <div className="bg-white/20 px-2 py-1 rounded-lg backdrop-blur-sm">
                            <span className="text-white text-sm font-bold">$89</span>
                            <span className="text-white/70 text-xs">/ليلة</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="group relative rounded-2xl overflow-hidden shadow-lg h-40">
                      <img 
                        src="https://images.unsplash.com/photo-1566991205780-a6a55bcfd422?auto=format&fit=crop&w=800&q=80" 
                        alt="الساحل الشمالي" 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="text-white font-bold text-lg">الساحل الشمالي</h4>
                            <div className="flex items-center text-white/80">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#FFD700] mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" />
                              </svg>
                              <span className="text-sm">منتجعات فخمة</span>
                            </div>
                          </div>
                          <div className="bg-white/20 px-2 py-1 rounded-lg backdrop-blur-sm">
                            <span className="text-white text-sm font-bold">$150</span>
                            <span className="text-white/70 text-xs">/ليلة</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="group relative rounded-2xl overflow-hidden shadow-lg h-56">
                      <img 
                        src="https://images.unsplash.com/photo-1523592121529-f6dde35f079e?auto=format&fit=crop&w=800&q=80" 
                        alt="رأس الحكمة" 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="text-white font-bold text-lg">رأس الحكمة</h4>
                            <div className="flex items-center text-white/80">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#FFD700] mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z" />
                                <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z" />
                                <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z" />
                              </svg>
                              <span className="text-sm">شواطئ خاصة</span>
                            </div>
                          </div>
                          <div className="bg-[#FFD700]/20 px-2 py-1 rounded-lg backdrop-blur-sm border border-[#FFD700]/30">
                            <span className="text-white text-sm font-bold">$199</span>
                            <span className="text-white/70 text-xs">/ليلة</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-between border border-white/20">
                  <div className="flex items-center">
                    <div className="bg-[#FFD700] h-10 w-10 rounded-md flex items-center justify-center mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#00182A]" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-white text-sm font-semibold">احصل على خصم 20% على الإقامات الطويلة</div>
                      <div className="text-white/70 text-xs">لإقامات أكثر من 7 ليالي</div>
                    </div>
                  </div>
                  <div>
                    <Button size="sm" className="bg-green-500 hover:bg-green-600 text-[#00182A] font-bold">
                      اكتشف
                    </Button>
                  </div>
                </div>
                
                <div className="absolute -bottom-6 -right-6 z-0">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-32 h-32 text-[#FFD700] opacity-20" fill="currentColor">
                    <path d="M320 96H192L144.6 24.9C137.5 14.2 145.1 0 157.9 0H354.1c12.8 0 20.4 14.2 13.3 24.9L320 96zM192 128H320c3.8 2.5 8.1 5.3 13 8.4C389.7 172.7 512 250.9 512 416c0 53-43 96-96 96H96c-53 0-96-43-96-96C0 250.9 122.3 172.7 179 136.4l0 0 0 0c4.8-3.1 9.2-5.9 13-8.4zm84 88c0-11-9-20-20-20s-20 9-20 20v14c-7.6 1.7-15.2 4.4-22.2 8.5c-13.9 8.3-25.9 22.8-25.8 43.9c.1 20.3 12 33.1 24.7 40.7c11 6.6 24.7 10.8 35.6 14l1.7 .5c12.6 3.8 21.8 6.8 28 10.7c5.1 3.2 5.8 5.4 5.9 8.2c.1 5-1.8 8-5.9 10.5c-5 3.1-12.9 5-21.4 4.7c-11.1-.4-21.5-3.9-35.1-8.5c-2.3-.8-4.7-1.6-7.2-2.4c-10.5-3.5-21.8 2.2-25.3 12.6s2.2 21.8 12.6 25.3c1.9 .6 4 1.3 6.1 2.1l0 0 0 0c8.3 2.9 17.9 6.2 28.2 8.4V424c0 11 9 20 20 20s20-9 20-20V410.2c8-1.7 16-4.5 23.2-9c14.3-8.9 25.1-24.1 24.8-45c-.3-20.3-11.7-33.4-24.6-41.6c-11.5-7.2-25.9-11.6-37.1-15l0 0-.7-.2c-12.8-3.9-21.9-6.7-28.3-10.5c-5.2-3.1-5.3-4.9-5.4-6.7c-.1-3.5 1.3-6.1 4.9-8.2c3.9-2.3 9.8-3.8 16.5-4.2c6.8-.4 14.4 .3 22.5 2.1c7.3 1.6 14.5 3.7 21.8 4.9c10.8 1.8 21.1-5.5 22.9-16.3s-5.5-21.1-16.3-22.9c-5.6-.9-11.1-2.3-16.7-3.5l0 0c-2.7-.6-5.5-1.2-8.3-1.7V216z" />
                  </svg>
                </div>
              </div>
              
              {/* Decorative element */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[#FFD700]/10 rounded-full blur-3xl -z-10"></div>
            </div>
          </div>
        </div>
        
        {/* Mobile decoration */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center lg:hidden">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-20 h-20 text-[#FFD700] opacity-30 animate-float" fill="currentColor">
            <path d="M176 56c0-13.3 10.7-24 24-24h16c13.3 0 24 10.7 24 24s-10.7 24-24 24H200c-13.3 0-24-10.7-24-24zm24 48h16c13.3 0 24 10.7 24 24s-10.7 24-24 24H200c-13.3 0-24-10.7-24-24s10.7-24 24-24zM56 176H72c13.3 0 24 10.7 24 24s-10.7 24-24 24H56c-13.3 0-24-10.7-24-24s10.7-24 24-24zM0 283.4C0 268.3 12.3 256 27.4 256H484.6c15.1 0 27.4 12.3 27.4 27.4c0 70.5-44.4 130.7-106.7 154.1L403.5 452c-2 16-15.6 28-31.8 28H140.2c-16.1 0-29.8-12-31.8-28l-1.8-14.4C44.4 414.1 0 353.9 0 283.4zM224 200c0-13.3 10.7-24 24-24h16c13.3 0 24 10.7 24 24s-10.7 24-24 24H248c-13.3 0-24-10.7-24-24zm-96 0c0-13.3 10.7-24 24-24h16c13.3 0 24 10.7 24 24s-10.7 24-24 24H152c-13.3 0-24-10.7-24-24zm-24-96h16c13.3 0 24 10.7 24 24s-10.7 24-24 24H104c-13.3 0-24-10.7-24-24s10.7-24 24-24zm216 96c0-13.3 10.7-24 24-24h16c13.3 0 24 10.7 24 24s-10.7 24-24 24H344c-13.3 0-24-10.7-24-24zm-24-96h16c13.3 0 24 10.7 24 24s-10.7 24-24 24H296c-13.3 0-24-10.7-24-24s10.7-24 24-24zm120 96c0-13.3 10.7-24 24-24h16c13.3 0 24 10.7 24 24s-10.7 24-24 24H440c-13.3 0-24-10.7-24-24zm-24-96h16c13.3 0 24 10.7 24 24s-10.7 24-24 24H392c-13.3 0-24-10.7-24-24s10.7-24 24-24zM296 56c0-13.3 10.7-24 24-24h16c13.3 0 24 10.7 24 24s-10.7 24-24 24H320c-13.3 0-24-10.7-24-24z" />
          </svg>
        </div>
      </section>
      
      {/* Location filters */}
      <LocationFilter />

      {/* Featured Beach Getaways Section */}
      <section className="relative pt-20 pb-16">
        {/* Decorative beach elements */}
        <div className="absolute top-0 left-0 right-0 h-24 overflow-hidden z-0">
          <div className="absolute inset-0 bg-[#e2c790]/20 rounded-b-[100%]"></div>
        </div>
        
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-40 h-6 text-[#1a82c7]/10" viewBox="0 0 1200 30" preserveAspectRatio="none">
            <path d="M0,30 C100,10 200,20 300,5 C400,12 500,15 600,10 C700,5 800,15 900,20 C1000,18 1100,5 1200,10 L1200,30 Z" fill="currentColor" />
          </svg>
        </div>
        
        <div className="absolute top-10 right-10 animate-float-slow hidden lg:block">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-[#f0e5ca]/30" viewBox="0 0 512 512" fill="currentColor">
            <path d="M80 352c-8.8 0-16-7.2-16-16s7.2-16 16-16 16 7.2 16 16-7.2 16-16 16zm112-16c0 8.8 7.2 16 16 16s16-7.2 16-16-7.2-16-16-16-16 7.2-16 16zm-170.7-4.7c-17.7 2.7-30.7 18.9-30.1 36.9.6 18.7 16.7 33.2 35.5 31.7 19.5-1.6 33.4-20.3 29.5-39.3-3.6-18.9-22.2-31.2-40.8-23.9 2-2.5 4.3-4.6 6.8-6.2 14.1-9.5 32.9-9 46.5 1 13.4 9.9 19.1 26.2 14.5 41.8-4.3 14.9-18.2 26.2-34.1 28.2-16.4 2.1-31.9-6.5-38.9-21.3-6.7 3.8-15 4.6-22.6 1.9 5 20.3 23.3 35.4 45.2 35.4 25.6 0 46.3-20.7 46.3-46.3S105.7 288 80 288c-2.3 0-4.5.2-6.7.5zm228.8-24.2c-19.3 2.2-34.4 18.3-34.4 38 0 21.2 17.2 38.3 38.3 38.3 19.3 0 35.6-14.5 38-33.5-21.8 2.8-34.9-12.6-34.9-23.1 0-7.6 2.1-14.5 6.3-20.5 7.2-10.3 13.8-19.9 24.1-19.9 14.1 0 22.5 7.5 30.5 14.6 8.9 7.9 17.3 15.4 30.3 15.4 23 0 41.3-10.3 63.2-21 1.8-.9 3.5-1.7 5.3-2.5-19.8-18.1-48.5-23.2-72.9-13-13.1 5.5-25.2 13.4-38.7 16-14.8 2.9-36.8 2.7-55.1 1.2z"/>
          </svg>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-[#1a82c7]/10 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#1a82c7] mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
              </svg>
              <span className="text-[#1a82c7] font-medium text-sm">اكتشف وجهاتنا المميزة</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold text-dark-gray mb-4">
              أفضل العقارات <span className="text-[#1a82c7]">للإسترخاء والإجازات</span>
            </h2>
            
            <p className="text-medium-gray text-lg max-w-xl mx-auto mb-8">
              اختر من بين مجموعة فاخرة من الشاليهات والفيلات المطلة على أجمل شواطئ مصر لقضاء عطلة لا تُنسى بعيدًا عن ضغوط الحياة اليومية
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
              <p>{error}</p>
              <Button 
                variant="outline" 
                className="mt-2 text-sm" 
                onClick={() => window.location.reload()}
              >
                حاول مرة أخرى
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* العقارات المميزة - قسم بتصميم فخم وعصري */}
            <section className="pt-12 pb-24 overflow-hidden">
              <div className="container mx-auto px-4 sm:px-6">
                
                {/* عنوان القسم مع خط مزخرف */}
                <div className="flex items-center mb-8 md:mb-12">
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#00182A] ml-4 rtl:mr-4 rtl:ml-0">العقارات المميزة</h2>
                  <div className="flex-grow h-0.5 bg-gradient-to-r from-[#FFD700] to-transparent"></div>
                  <div className="bg-[#FFD700] h-8 w-8 rounded-full flex items-center justify-center shadow-lg ml-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#00182A]" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                </div>
                
                {isLoadingFeatured
                  ? renderPropertySkeleton()
                  : featuredProperties.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8 mb-12 rtl:text-right">
                      {featuredProperties.map((property: Property) => (
                        <div 
                          key={property.id} 
                          className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2"
                        >
                          {/* صورة العقار مع وسم "مميز" */}
                          <div className="relative h-56 md:h-64 overflow-hidden">
                            <img 
                              src={property.images?.[0] || "https://images.unsplash.com/photo-1600520611035-84157ad4084d?auto=format&fit=crop&w=800&q=80"} 
                              alt={property.title} 
                              className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                            />
                            <div className="absolute top-4 right-4 z-10">
                              <div className="bg-[#FFD700] text-[#00182A] py-1 px-3 rounded-full text-xs font-bold shadow-lg">
                                مميز
                              </div>
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-60 group-hover:opacity-70 transition-opacity"></div>
                            <div className="absolute bottom-0 right-0 left-0 p-4 transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                              <Link href={`/property/${property.id}`}>
                                <Button className="w-full bg-[#FFD700] hover:bg-[#e5c100] text-[#00182A] rounded-xl font-bold transition-all duration-300">
                                  عرض التفاصيل
                                </Button>
                              </Link>
                            </div>
                          </div>
                          
                          {/* تفاصيل العقار */}
                          <div className="p-4 md:p-5">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h3 className="font-bold text-lg md:text-xl text-[#00182A] mb-1">{property.title}</h3>
                                <div className="flex items-center text-gray-500 text-sm">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#FFD700] ml-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                  </svg>
                                  <span>{property.location}</span>
                                </div>
                              </div>
                              <div className="text-right rtl:text-left">
                                <div className="text-[#00182A] font-bold text-xl">${property.price || '120'}</div>
                                <div className="text-gray-500 text-xs">/ ليلة</div>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                              <div className="flex items-center text-sm text-gray-500">
                                <div className="flex items-center mr-3 rtl:ml-3 rtl:mr-0">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#FFD700] ml-1 rtl:mr-1 rtl:ml-0" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                                  </svg>
                                  <span>{property.guests || '4'} ضيوف</span>
                                </div>
                                <div className="flex items-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#FFD700] ml-1 rtl:mr-1 rtl:ml-0" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                                  </svg>
                                  <span>{property.beds || '2'} غرف</span>
                                </div>
                              </div>
                              <div className="flex items-center">
                                {Array.from({ length: Math.round(property.rating || 4.5) }).map((_, i) => (
                                  <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#FFD700]" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                ))}
                                <span className="text-sm text-gray-500 mr-1 rtl:ml-1 rtl:mr-0">
                                  ({property.reviewsCount || '18'})
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-10 bg-gray-50 rounded-lg mb-8">
                      <p className="text-gray-500">لم يتم العثور على عقارات مميزة</p>
                    </div>
                  )
                }
                
                {/* زر المزيد من العقارات المميزة */}
                <div className="text-center mt-8">
                  <Link href="/search">
                    <Button className="bg-[#00182A] hover:bg-[#002D4A] text-white px-8 py-6 shadow-lg border-b-4 border-[#FFD700] group transition-all duration-300">
                      <span className="mr-2 group-hover:mr-4 transition-all duration-300">استكشف جميع العقارات للإجازة المثالية</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 rtl:rotate-180" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </Button>
                  </Link>
                </div>
              </div>
            </section>
            
            {/* القسم الأصلي تم استبداله بالقسم الجديد أعلاه */}
          </div>
          
          <div className="mt-10 text-center">
            <Link href="/search">
              <Button className="bg-[#00426e] hover:bg-[#00426e]/90 px-8 py-6 shadow-lg group transition-all duration-300">
                <span className="mr-2 group-hover:mr-4 transition-all duration-300">استكشف جميع العقارات للإجازة المثالية</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 rtl:rotate-180" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Coming Soon Services Announcement */}
      <section className="relative rounded-2xl overflow-hidden my-12 border-2 border-[#FFD700]/30">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#00182A] to-[#001E36] z-0"></div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFD700]/10 blur-3xl rounded-full -mr-32 -mt-32 z-0"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#FFD700]/10 blur-3xl rounded-full -ml-32 -mb-32 z-0"></div>
        
        <div className="relative z-10 p-6 md:p-10">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Icon and visual section */}
            <div className="md:w-1/3 flex flex-col items-center">
              <div className="relative">
                <div className="absolute inset-0 bg-[#FFD700]/20 blur-xl rounded-full"></div>
                <div className="bg-gradient-to-br from-[#FFD700] to-[#FFC000] h-32 w-32 md:h-40 md:w-40 rounded-2xl flex items-center justify-center shadow-xl relative z-10 transform transition-transform duration-500 hover:scale-105">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-[#00182A]" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 5a3 3 0 015-2.236A3 3 0 0114.83 6H16a2 2 0 110 4h-5V9a1 1 0 10-2 0v1H4a2 2 0 110-4h1.17C5.06 5.687 5 5.35 5 5zm4 1V5a1 1 0 10-1 1h1zm3 0a1 1 0 10-1-1v1h1z" />
                    <path d="M9 11H3v5a2 2 0 002 2h4v-7zM11 18h4a2 2 0 002-2v-5h-6v7z" />
                  </svg>
                </div>
              </div>
              
              <div className="mt-8 bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 max-w-xs">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="h-2 w-2 bg-[#FFD700] rounded-full animate-pulse"></div>
                  <span className="text-[#FFD700] font-bold">قريبًا على ستاي تشيل</span>
                  <div className="h-2 w-2 bg-[#FFD700] rounded-full animate-pulse"></div>
                </div>
                <div className="text-center text-white/80 text-sm">
                  احصل على تنبيه فوري عند إطلاق الخدمات الجديدة
                </div>
              </div>
            </div>
            
            {/* Content section */}
            <div className="md:w-2/3 text-center md:text-right">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                <span className="block mb-2">خدمات <span className="text-[#FFD700]">التنظيف والتوصيل</span></span>
                <span className="text-[#FFD700]/80 text-2xl md:text-3xl">قريبًا لراحتك التامة</span>
              </h2>
              
              <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto md:mr-0 md:ml-auto mb-8 leading-relaxed">
                استعد لتجربة إقامة متكاملة مع خدمات التنظيف والتوصيل القادمة قريباً. نهدف لتوفير كل ما تحتاجه لقضاء عطلة مثالية بدون أي عناء.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 hover:bg-white/15 transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="bg-[#FFD700] h-10 w-10 rounded-lg flex items-center justify-center mt-1 flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#00182A]" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">خدمة التنظيف</h3>
                      <p className="text-white/70">تنظيف احترافي للشاليهات والوحدات بمعايير فندقية عالية الجودة لإقامة نظيفة ومريحة</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 hover:bg-white/15 transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="bg-[#FFD700] h-10 w-10 rounded-lg flex items-center justify-center mt-1 flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#00182A]" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">خدمة التوصيل</h3>
                      <p className="text-white/70">توصيل المشتريات والطلبات من المتاجر والمطاعم مباشرة إلى باب وحدتك</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                <Button variant="outline" className="bg-transparent border-2 border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700]/10 font-bold text-lg px-8 py-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
                  </svg>
                  اطلب تنبيهًا
                </Button>
                <Button className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white border border-white/20 font-medium text-lg px-8 py-3">
                  معرفة المزيد
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Free Restaurant Reservations Section - Optimized for Mobile and Desktop */}
      <section className="relative rounded-2xl overflow-hidden my-12">
        {/* Beach-themed background */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#00182A] to-[#003156] z-0 opacity-95"></div>
        
        {/* Decorative elements - Better positioned for different viewports */}
        <div className="absolute top-0 right-0 w-40 md:w-64 h-40 md:h-64 bg-[#FFD700]/5 rounded-full -translate-y-1/3 translate-x-1/3 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-40 md:w-96 h-40 md:h-96 bg-[#FFD700]/5 rounded-full translate-y-1/2 -translate-x-1/3 blur-3xl"></div>
        
        {/* Food decorative elements - Responsive positioning */}
        <div className="absolute top-10 right-10 md:top-20 md:right-20 hidden sm:block z-0 opacity-10">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className="h-20 w-20 md:h-32 md:w-32 text-white" fill="currentColor">
            <path d="M416 0C400 0 288 32 288 176V288c0 35.3 28.7 64 64 64h32V480c0 17.7 14.3 32 32 32s32-14.3 32-32V352 240 32c0-17.7-14.3-32-32-32zM64 16C64 7.8 57.9 1 49.7.1S34.2 4.6 32.4 12.5L2.1 148.8C.7 155.1 0 161.5 0 167.9c0 45.9 35.1 83.6 80 87.7V480c0 17.7 14.3 32 32 32s32-14.3 32-32V255.6c44.9-4.1 80-41.8 80-87.7c0-6.4-.7-12.8-2.1-19.1L191.6 12.5c-1.8-8-9.3-13.3-17.4-12.4S160 7.8 160 16V150.2c0 5.4-4.4 9.8-9.8 9.8c-5.1 0-9.3-3.9-9.8-9L127.9 14.6C127.2 6.3 120.3 0 112 0s-15.2 6.3-15.9 14.6L83.7 151c-.5 5.1-4.7 9-9.8 9c-5.4 0-9.8-4.4-9.8-9.8V16zm48.3 152l-.3 0-.3 0 .3-.7 .3 .7z" />
          </svg>
        </div>
        
        <div className="absolute -bottom-4 left-4 md:bottom-10 md:left-10 hidden sm:block z-0 opacity-20 animate-float-slow">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="h-20 w-20 md:h-40 md:w-40 text-white" fill="currentColor">
            <path d="M0 192c0-35.3 28.7-64 64-64c.5 0 1.1 0 1.6 0C73 91.5 105.3 64 144 64c15 0 29 4.1 40.9 11.2C198.2 49.6 225.1 32 256 32s57.8 17.6 71.1 43.2C339 68.1 353 64 368 64c38.7 0 71 27.5 78.4 64c.5 0 1.1 0 1.6 0c35.3 0 64 28.7 64 64c0 11.7-3.1 22.6-8.6 32H8.6C3.1 214.6 0 203.7 0 192zm0 91.4C0 268.3 12.3 256 27.4 256H484.6c15.1 0 27.4 12.3 27.4 27.4c0 70.5-44.4 130.7-106.7 154.1L403.5 452c-2 16-15.6 28-31.8 28H140.2c-16.1 0-29.8-12-31.8-28l-1.8-14.4C44.4 414.1 0 353.9 0 283.4z" />
          </svg>
        </div>
        
        <div className="relative z-10 p-5 md:p-12">
          <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-16">
            {/* Left content - More readable on mobile */}
            <div className="w-full lg:w-5/12 order-2 lg:order-1">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-[#FFD700]/20 backdrop-blur-sm mb-4 border border-[#FFD700]/30">
                <div className="h-3 w-3 bg-[#FFD700] rounded-full animate-pulse mr-2"></div>
                <span className="text-white text-sm font-medium">حجوزات مطاعم مجانية</span>
              </div>
            
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-5">
                احجز مطعمك المفضل <span className="text-[#FFD700]">بدون رسوم</span>
              </h2>
              
              <p className="text-white/80 mb-6 text-base md:text-lg leading-relaxed max-w-xl">
                خدمة حجز المطاعم المجانية من ستاي تشيل توفر لك إمكانية حجز طاولة في أفضل المطاعم في الساحل والساحل الشمالي ورأس الحكمة بدون أي رسوم إضافية.
              </p>
              
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 gap-3 md:gap-4 mb-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 hover:bg-white/15 transition-all duration-300 group border border-white/5">
                  <div className="flex items-center">
                    <div className="bg-[#FFD700] h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center mr-2 md:mr-3 group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5 text-[#00182A]" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="text-white">
                      <div className="font-semibold text-sm md:text-base">حجز فوري</div>
                      <div className="text-xs md:text-sm text-white/70">تأكيد خلال دقائق</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 hover:bg-white/15 transition-all duration-300 group border border-white/5">
                  <div className="flex items-center">
                    <div className="bg-[#FFD700] h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center mr-2 md:mr-3 group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5 text-[#00182A]" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M11.933 10.07A2 2 0 1014 11.999V12a2.97 2.97 0 01-.933 2.167A2.969 2.969 0 0111 15v-1.998A2.969 2.969 0 018.935 14.1a2.969 2.969 0 01-1.935-.501 2.971 2.971 0 011.934-5.307c.312 0 .615.073.891.213a2.97 2.97 0 012.109 1.565z" />
                        <path d="M2 4.75C2 3.784 2.784 3 3.75 3h3.5c.966 0 1.75.784 1.75 1.75v3.5A1.75 1.75 0 017.25 10h-3.5A1.75 1.75 0 012 8.25v-3.5zm9 0C11 3.784 11.784 3 12.75 3h3.5c.966 0 1.75.784 1.75 1.75v3.5A1.75 1.75 0 0116.25 10h-3.5A1.75 1.75 0 0111 8.25v-3.5zm-9 9C2 12.784 2.784 12 3.75 12h3.5c.966 0 1.75.784 1.75 1.75v3.5A1.75 1.75 0 017.25 19h-3.5A1.75 1.75 0 012 17.25v-3.5z" />
                      </svg>
                    </div>
                    <div className="text-white">
                      <div className="font-semibold text-sm md:text-base">خدمات قريبًا</div>
                      <div className="text-xs md:text-sm text-white/70">تنظيف وتوصيل قريبًا</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 hover:bg-white/15 transition-all duration-300 group border border-white/5">
                  <div className="flex items-center">
                    <div className="bg-[#FFD700] h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center mr-2 md:mr-3 group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5 text-[#00182A]" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="text-white">
                      <div className="font-semibold text-sm md:text-base">طلبات خاصة</div>
                      <div className="text-xs md:text-sm text-white/70">ملاحظات للمطعم</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 hover:bg-white/15 transition-all duration-300 group border border-white/5">
                  <div className="flex items-center">
                    <div className="bg-[#FFD700] h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center mr-2 md:mr-3 group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5 text-[#00182A]" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="text-white">
                      <div className="font-semibold text-sm md:text-base">اكسب 100 نقطة</div>
                      <div className="text-xs md:text-sm text-white/70">مع كل حجز مجاني</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <Link href="/restaurants">
                <Button className="bg-[#FFD700] hover:bg-[#e5c100] text-[#00182A] w-full sm:w-auto font-bold text-lg px-6 py-4 md:px-8 md:py-6 shadow-xl rounded-xl group transition-all duration-300 border-2 border-[#FFD700]">
                  <span className="mr-2 group-hover:mr-4 transition-all duration-300">احجز طاولتك الآن</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6 rtl:rotate-180 transition-transform group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </Button>
              </Link>
              
              {/* Mobile restaurant counter */}
              <div className="mt-6 block lg:hidden text-center">
                <div className="inline-block bg-[#FFD700] text-[#00182A] font-bold text-sm py-2 px-4 rounded-full">
                  +45 مطعم متاح للحجز المجاني
                </div>
              </div>
            </div>
            
            {/* Right content - Optimized card layout */}
            <div className="w-full lg:w-7/12 order-1 lg:order-2 overflow-hidden">
              {/* Restaurant showcase - better mobile experience */}
              <div className="relative">
                <div className="absolute -top-8 -right-8 md:-top-16 md:-right-16 w-32 h-32 md:w-56 md:h-56 bg-[#FFD700]/10 rounded-full blur-xl"></div>
                
                {/* Restaurant Card - Horizontal on mobile, Staggered on desktop */}
                <div className="rounded-2xl overflow-hidden bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl mb-4 lg:mb-6 hover:shadow-2xl hover:translate-y-[-5px] transition-all duration-500">
                  <div className="flex flex-col sm:flex-row">
                    <div className="w-full sm:w-1/3 h-40 sm:h-auto">
                      <img 
                        src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80" 
                        alt="مطعم البحر المتوسط" 
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="w-full sm:w-2/3 p-4 md:p-5">
                      <div className="flex justify-between items-start flex-wrap">
                        <div>
                          <h3 className="font-bold text-lg md:text-xl text-white">مطعم البحر المتوسط</h3>
                          <div className="flex items-center mt-1 mb-2">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <svg key={i} xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 md:h-4 md:w-4 ${i < 5 ? 'text-[#FFD700]' : 'text-gray-400'}`} viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                            <span className="ml-2 text-white/70 text-xs md:text-sm">4.8 (120+)</span>
                          </div>
                        </div>
                        <div className="bg-[#FFD700]/30 px-2 py-1 rounded-lg text-white text-xs">المطبخ البحري</div>
                      </div>
                      
                      <div className="flex items-center text-white/70 text-xs md:text-sm mb-2 md:mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 md:h-4 md:w-4 mr-1 text-[#FFD700]" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        <span>الساحل الشمالي، كم 120</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-1 md:gap-2 mb-3 md:mb-4">
                        <span className="bg-white/10 text-white/80 text-[10px] md:text-xs px-2 py-0.5 rounded">إطلالة على البحر</span>
                        <span className="bg-white/10 text-white/80 text-[10px] md:text-xs px-2 py-0.5 rounded">مناسب للعائلات</span>
                        <span className="bg-white/10 text-white/80 text-[10px] md:text-xs px-2 py-0.5 rounded">مأكولات طازجة</span>
                      </div>
                      
                      <div className="flex justify-between items-center mt-2">
                        <div className="text-[#FFD700] flex items-center text-xs md:text-sm">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 md:h-4 md:w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          <span>متاح اليوم</span>
                        </div>
                        <Button size="sm" className="bg-[#FFD700] hover:bg-[#e5c100] text-[#00182A] font-bold text-xs md:text-sm py-1">
                          احجز الآن
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Restaurant Card 2 - Modified for better mobile display */}
                <div className="rounded-2xl overflow-hidden bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl ml-0 md:ml-8 lg:ml-12 transform translate-y-0 -translate-x-0 sm:translate-y-[-20px] sm:translate-x-[20px] hover:shadow-2xl hover:translate-y-[-25px] transition-all duration-500">
                  <div className="flex flex-col sm:flex-row">
                    <div className="w-full sm:w-1/3 h-40 sm:h-auto">
                      <img 
                        src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80" 
                        alt="مطعم شاطئ النخيل" 
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="w-full sm:w-2/3 p-4 md:p-5">
                      <div className="flex justify-between items-start flex-wrap">
                        <div>
                          <h3 className="font-bold text-lg md:text-xl text-white">مطعم شاطئ النخيل</h3>
                          <div className="flex items-center mt-1 mb-2">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <svg key={i} xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 md:h-4 md:w-4 ${i <= 4 ? 'text-[#FFD700]' : 'text-gray-400'}`} viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                            <span className="ml-2 text-white/70 text-xs md:text-sm">4.2 (86+)</span>
                          </div>
                        </div>
                        <div className="bg-[#FFD700]/30 px-2 py-1 rounded-lg text-white text-xs">المطبخ الإيطالي</div>
                      </div>
                      
                      <div className="flex items-center text-white/70 text-xs md:text-sm mb-2 md:mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 md:h-4 md:w-4 mr-1 text-[#FFD700]" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        <span>رأس الحكمة، كم 80</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-1 md:gap-2 mb-3 md:mb-4">
                        <span className="bg-white/10 text-white/80 text-[10px] md:text-xs px-2 py-0.5 rounded">بيتزا إيطالية</span>
                        <span className="bg-white/10 text-white/80 text-[10px] md:text-xs px-2 py-0.5 rounded">معجنات طازجة</span>
                        <span className="bg-white/10 text-white/80 text-[10px] md:text-xs px-2 py-0.5 rounded">جلسة خارجية</span>
                      </div>
                      
                      <div className="flex justify-between items-center mt-2">
                        <div className="text-[#FFD700] flex items-center text-xs md:text-sm">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 md:h-4 md:w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          <span>عروض للمجموعات</span>
                        </div>
                        <Button size="sm" className="bg-[#FFD700] hover:bg-[#e5c100] text-[#00182A] font-bold text-xs md:text-sm py-1">
                          احجز الآن
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Desktop restaurant counter */}
                <div className="absolute bottom-6 right-6 hidden lg:block bg-[#FFD700] text-[#00182A] font-bold text-sm py-2 px-4 rounded-full z-20">
                  +45 مطعم متاح للحجز المجاني
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recommended For You */}
      {user && (
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-dark-gray">Recommended For You</h2>
            <Link href="/search">
              <Button variant="link" className="text-brand hidden sm:flex">
                View all
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoadingRecommended ? (
              renderPropertySkeleton()
            ) : recommendedProperties.length > 0 ? (
              recommendedProperties.map((property: Property) => (
                <PropertyCard
                  key={property.id}
                  id={property.id}
                  title={property.title}
                  location={property.location}
                  description={property.description}
                  price={property.price}
                  images={property.images}
                  rating={property.rating}
                  pointsEarnable={Math.floor(property.price * 2)}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-10">
                <p className="text-gray-500">No personalized recommendations available yet. Continue browsing to help us suggest properties you might like.</p>
              </div>
            )}
          </div>
          
          <div className="mt-4 flex justify-center sm:hidden">
            <Link href="/search">
              <Button variant="outline" className="w-full">
                View all properties
              </Button>
            </Link>
          </div>
        </section>
      )}

      {/* Featured Destinations */}
      <section>
        <div className="flex flex-wrap justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-dark-gray">Discover Our Featured Destinations</h2>
          <Link href="/search" className="text-sm text-brand mt-2 sm:mt-0">
            View all destinations
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <Link href="/search?location=Sharm El Sheikh">
            <div className="rounded-xl overflow-hidden shadow-sm hover:shadow-md transition duration-200 cursor-pointer h-full">
              <div className="relative h-full">
                <div className="aspect-w-16 aspect-h-9 sm:aspect-h-10">
                  <img 
                    src="https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=800&q=80" 
                    alt="Sharm El Sheikh" 
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <h3 className="text-xl font-bold mb-1">Sharm El Sheikh</h3>
                  <p className="text-sm opacity-90">Dive into crystal clear waters</p>
                  <div className="mt-3 flex justify-between items-center">
                    <span className="text-sm">120+ properties</span>
                    <Button variant="default" size="sm" className="bg-white text-dark-gray hover:bg-gray-100">
                      Explore
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/search?location=El Sahel">
            <div className="rounded-xl overflow-hidden shadow-sm hover:shadow-md transition duration-200 cursor-pointer h-full">
              <div className="relative h-full">
                <div className="aspect-w-16 aspect-h-9 sm:aspect-h-10">
                  <img 
                    src="https://images.unsplash.com/photo-1537549392612-0cbf7ce6745a?auto=format&fit=crop&w=800&q=80" 
                    alt="El Sahel" 
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <h3 className="text-xl font-bold mb-1">El Sahel</h3>
                  <p className="text-sm opacity-90">Mediterranean beachfront retreats</p>
                  <div className="mt-3 flex justify-between items-center">
                    <span className="text-sm">85+ properties</span>
                    <Button variant="default" size="sm" className="bg-white text-dark-gray hover:bg-gray-100">
                      Explore
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/search?location=Marina">
            <div className="rounded-xl overflow-hidden shadow-sm hover:shadow-md transition duration-200 cursor-pointer h-full">
              <div className="relative h-full">
                <div className="aspect-w-16 aspect-h-9 sm:aspect-h-10">
                  <img 
                    src="https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80" 
                    alt="Marina" 
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <h3 className="text-xl font-bold mb-1">Marina</h3>
                  <p className="text-sm opacity-90">Luxurious waterfront living</p>
                  <div className="mt-3 flex justify-between items-center">
                    <span className="text-sm">64+ properties</span>
                    <Button variant="default" size="sm" className="bg-white text-dark-gray hover:bg-gray-100">
                      Explore
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>
        
        <div className="mt-6 text-center md:hidden">
          <Link href="/search">
            <Button variant="outline">
              Browse All Destinations
            </Button>
          </Link>
        </div>
      </section>

      {/* App Download Section */}
      <section className="bg-gradient-to-r from-brand-teal to-brand-teal/80 rounded-xl p-6 md:p-8 text-white shadow-md overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/3 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-orange/10 rounded-full translate-y-1/3 -translate-x-1/3 blur-xl"></div>
        
        <div className="flex flex-col md:flex-row items-center relative z-10">
          <div className="md:w-2/3 mb-6 md:mb-0 md:pr-8">
            <div className="inline-block mb-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
              <div className="flex items-center gap-2">
                <span className="animate-pulse relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-orange opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-orange"></span>
                </span>
                <span className="text-xs font-medium">StayChill mobile experience</span>
              </div>
            </div>
            
            <h2 className="text-2xl md:text-4xl font-bold mb-2">Discover <span className="text-brand-orange">StayChill App</span></h2>
            <div className="flex items-center gap-2 mb-3 md:mb-4">
              <span className="bg-brand-orange text-white text-xs font-bold px-3 py-1 rounded-full uppercase animate-pulse">Coming Soon</span>
              <span className="text-white/80 text-sm">Be the first to know</span>
            </div>
            <p className="opacity-90 mb-4 md:mb-6 text-sm md:text-base">
              Get exclusive app-only deals, manage your bookings on the go, and track your rewards with our mobile app. Experience seamless travel planning and booking!
            </p>
            
            {/* Features list - visible on all screens */}
            <div className="mb-5 grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 transition-transform hover:scale-105">
                <svg className="h-4 w-4 text-brand-orange mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm">Book properties instantly</span>
              </div>
              <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 transition-transform hover:scale-105">
                <svg className="h-4 w-4 text-brand-orange mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm">Track your rewards</span>
              </div>
              <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 transition-transform hover:scale-105">
                <svg className="h-4 w-4 text-brand-orange mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm">Get exclusive deals</span>
              </div>
              <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 transition-transform hover:scale-105">
                <svg className="h-4 w-4 text-brand-orange mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm">Personalized recommendations</span>
              </div>
            </div>
            
            <div className="flex flex-row flex-wrap justify-center md:justify-start gap-3 md:gap-4">
              <div className="relative transition-transform hover:scale-105">
                <Button variant="outline" size="sm" className="bg-black/90 text-white/90 border-black hover:bg-black min-w-[160px] sm:min-w-0 cursor-not-allowed" disabled>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.566 12.01c-.06-5.55 4.781-8.229 5-8.32-2.718-3.928-6.951-4.467-8.458-4.531-3.605-.36-7.033 2.106-8.864 2.106-1.818 0-4.636-2.049-7.618-1.994-3.923.05-7.538 2.25-9.563 5.715-4.075 7.015-.905 17.426 2.928 23.13 1.938 2.792 4.267 5.923 7.305 5.81 2.932-.118 4.04-1.881 7.585-1.881 3.543 0 4.546 1.881 7.658 1.824 3.16-.061 5.164-2.852 7.099-5.66 2.235-3.245 3.155-6.386 3.208-6.545-.07-.03-6.165-2.343-6.22-9.291"></path>
                    <path d="M14.517 3.624C16.127.93 18.457-.173 18.57-.211c-2.006 2.893-2.7 6.202-.9 9.806 1.596 3.6 4.566 5.931 4.706 6.01-2.19 3.6-4.566.301-8.37.15"></path>
                  </svg>
                  <div className="text-left">
                    <div className="text-[10px] md:text-xs">Download on the</div>
                    <div className="font-medium text-xs md:text-sm">App Store</div>
                  </div>
                </Button>
                <span className="absolute -top-2 -right-2 bg-brand-orange text-white text-[10px] px-2 py-0.5 rounded-full">Soon</span>
              </div>
              <div className="relative transition-transform hover:scale-105">
                <Button variant="outline" size="sm" className="bg-black/90 text-white/90 border-black hover:bg-black min-w-[160px] sm:min-w-0 cursor-not-allowed" disabled>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.609 1.814L13.792 12 3.609 22.186c-.181.181-.29.423-.29.683V1.131c0 .26.109.502.29.683zm10.831 10.836l-2.388 2.389L5.237 8.223l6.815-6.815 2.388 2.388c.363.363.363.954 0 1.318l-2.389 2.389c-.181.181-.29.423-.29.683 0 .261.109.503.29.684l2.389 2.39c.363.363.363.953 0 1.317zm-3.942 3.942l-6.815 6.815 6.815-6.815zm0-15.559l6.815 6.815-6.815-6.815z"/>
                  </svg>
                  <div className="text-left">
                    <div className="text-[10px] md:text-xs">Get it on</div>
                    <div className="font-medium text-xs md:text-sm">Google Play</div>
                  </div>
                </Button>
                <span className="absolute -top-2 -right-2 bg-brand-orange text-white text-[10px] px-2 py-0.5 rounded-full">Soon</span>
              </div>
            </div>
          </div>
          
          <div className="md:w-1/3 flex justify-center">
            <div className="relative">
              {/* Mock mobile app screen */}
              <div className="w-[180px] md:w-[220px] h-[320px] md:h-[400px] bg-gray-800 rounded-[2rem] p-2 shadow-2xl relative overflow-hidden border-4 border-gray-700">
                <div className="absolute top-0 left-0 right-0 h-16 bg-brand-teal rounded-t-[1.5rem] z-10 flex flex-col justify-end pb-2">
                  <div className="text-center text-white text-sm font-bold">StayChill</div>
                </div>
                
                <div className="w-24 h-24 absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/20 z-0"></div>
                
                <div className="mt-14 h-[calc(100%-3.5rem)] rounded-[1.2rem] bg-gray-100 overflow-hidden">
                  <div className="h-24 bg-gradient-to-r from-brand-teal to-brand-orange"></div>
                  <div className="p-2">
                    <div className="bg-white rounded-lg shadow-sm p-2 mb-2">
                      <div className="h-2 w-1/2 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 w-5/6 bg-gray-300 rounded"></div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-2 mb-2">
                      <div className="h-2 w-2/3 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 w-3/4 bg-gray-300 rounded"></div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-2 mb-2">
                      <div className="h-2 w-1/3 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 w-full bg-gray-300 rounded"></div>
                    </div>
                    <div className="flex justify-center mt-3">
                      <div className="h-8 w-24 bg-brand-orange rounded-full"></div>
                    </div>
                  </div>
                </div>
                
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-16 h-1 bg-gray-700 rounded-full"></div>
              </div>
              

            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
