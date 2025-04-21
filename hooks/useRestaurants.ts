import { useQuery } from "@tanstack/react-query";
import { type Restaurant, type RestaurantReservation } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { logger } from "@/lib/logger";

export const useRestaurants = (limit = 20, offset = 0) => {
  return useQuery<Restaurant[]>({
    queryKey: ["/api/restaurants", limit, offset],
    queryFn: async () => {
      const response = await apiRequest(
        "GET", 
        `/api/restaurants?limit=${limit}&offset=${offset}`
      );
      return response.json();
    },
  });
};

export const useFeaturedRestaurants = (limit = 6) => {
  return useQuery<Restaurant[]>({
    queryKey: ["/api/restaurants/featured", limit],
    queryFn: async () => {
      const response = await apiRequest(
        "GET", 
        `/api/restaurants/featured?limit=${limit}`
      );
      return response.json();
    },
  });
};

export const useRestaurantsByLocation = (location: string, limit = 20) => {
  return useQuery<Restaurant[]>({
    queryKey: ["/api/restaurants/location", location, limit],
    queryFn: async () => {
      const response = await apiRequest(
        "GET", 
        `/api/restaurants/location/${location}?limit=${limit}`
      );
      return response.json();
    },
    enabled: !!location,
  });
};

export const useRestaurant = (id?: number) => {
  return useQuery<Restaurant>({
    queryKey: ["/api/restaurants", id],
    queryFn: async () => {
      try {
        logger.debug("useRestaurant", `Fetching restaurant with id ${id}`);
        const response = await apiRequest("GET", `/api/restaurants/${id}`);
        const data = await response.json();
        logger.debug("useRestaurant", `Fetched restaurant data`, data);
        return data;
      } catch (error) {
        logger.error("useRestaurant", `Error fetching restaurant with id ${id}`, error);
        throw error;
      }
    },
    enabled: !!id,
  });
};

export const useRestaurantReservations = (userId?: number) => {
  return useQuery<RestaurantReservation[]>({
    queryKey: ["/api/user/restaurant-reservations", userId],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/user/restaurant-reservations");
      return response.json();
    },
    enabled: !!userId,
  });
};

export const useRestaurantReservationsByRestaurant = (restaurantId?: number) => {
  return useQuery<RestaurantReservation[]>({
    queryKey: ["/api/restaurants/reservations", restaurantId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/restaurants/${restaurantId}/reservations`);
      return response.json();
    },
    enabled: !!restaurantId,
  });
};