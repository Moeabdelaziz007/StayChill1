import { useQuery } from "@tanstack/react-query";
import { ServiceType } from "@/components/services/ServiceCard";

// الخطاف لجلب كل الخدمات
export function useServices() {
  return useQuery({
    queryKey: ["/api/services"],
    staleTime: 1000 * 60 * 5, // 5 دقائق
  });
}

// الخطاف لجلب الخدمات المميزة
export function useFeaturedServices() {
  return useQuery({
    queryKey: ["/api/services/featured"],
    staleTime: 1000 * 60 * 5, // 5 دقائق
  });
}

// الخطاف لجلب الخدمات حسب الموقع
export function useServicesByLocation(location: string) {
  return useQuery({
    queryKey: ["/api/services", { location }],
    queryFn: async ({ queryKey }) => {
      const response = await fetch(
        `/api/services?location=${encodeURIComponent(location)}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch services by location");
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 دقائق
    enabled: !!location
  });
}

// الخطاف لجلب الخدمات حسب النوع
export function useServicesByType(serviceType: ServiceType) {
  return useQuery({
    queryKey: ["/api/services", { type: serviceType }],
    queryFn: async ({ queryKey }) => {
      const response = await fetch(
        `/api/services?type=${encodeURIComponent(serviceType)}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch services by type");
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 دقائق
    enabled: !!serviceType
  });
}

// الخطاف لجلب خدمة بواسطة المعرف
export function useService(id: number) {
  return useQuery({
    queryKey: ["/api/services", id],
    queryFn: async ({ queryKey }) => {
      const response = await fetch(`/api/services/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch service");
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 دقائق
    enabled: !!id
  });
}

// الخطاف لجلب الخدمات القادمة قريبًا
export function useComingSoonServices() {
  return useQuery({
    queryKey: ["/api/services/coming-soon"],
    staleTime: 1000 * 60 * 5, // 5 دقائق
  });
}