import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export interface PropertyAnalytics {
  propertyId: number;
  propertyTitle: string;
  dateRange: {
    startDate: string | Date;
    endDate: string | Date;
  };
  overview: {
    totalBookings: number;
    totalRevenue: number;
    avgBookingValue: number;
    occupancyRate: number;
    reviewsCount: number;
    avgRating: number;
  };
  bookings: {
    id: number;
    startDate: string | Date;
    endDate: string | Date;
    guestCount: number;
    totalPrice: number;
    status: string;
    pointsEarned: number | null;
  }[];
  reviews: {
    id: number;
    rating: number;
    comment: string | null;
    createdAt: string | Date;
  }[];
}

export const usePropertyAnalytics = () => {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(new Date().setDate(new Date().getDate() - 30))
  );
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());

  const fetchPropertyAnalytics = async (propertyId: number, start?: Date, end?: Date): Promise<PropertyAnalytics> => {
    if (!propertyId || propertyId <= 0) {
      throw new Error('Invalid property ID');
    }

    try {
      let url = `/api/properties/${propertyId}/analytics`;
      const params = new URLSearchParams();
      
      if (start) {
        params.append('startDate', start.toISOString());
      }
      
      if (end) {
        params.append('endDate', end.toISOString());
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await apiRequest('GET', url);
      
      // Always check response even though apiRequest already does error handling
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch property analytics (Status: ${response.status})`);
      }
      
      const data = await response.json();
      
      // Validate response structure to prevent runtime errors
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format from analytics API');
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching property analytics:', error);
      throw error;
    }
  };

  const getPropertyAnalytics = (propertyId: number) => {
    return useQuery({
      queryKey: ['/api/properties', propertyId, 'analytics', startDate?.toISOString(), endDate?.toISOString()],
      queryFn: () => fetchPropertyAnalytics(propertyId, startDate, endDate),
      onError: (error: Error) => {
        console.error('Property analytics query error:', error);
        toast({
          title: 'Error',
          description: `Failed to load property analytics: ${error.message}`,
          variant: 'destructive',
        });
      },
      enabled: Boolean(propertyId) && propertyId > 0,
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      // Return a default empty structure instead of null to prevent UI errors
      placeholderData: propertyId ? {
        propertyId: propertyId,
        propertyTitle: 'Loading...',
        dateRange: {
          startDate: startDate || new Date(),
          endDate: endDate || new Date()
        },
        overview: {
          totalBookings: 0,
          totalRevenue: 0,
          avgBookingValue: 0,
          occupancyRate: 0,
          reviewsCount: 0,
          avgRating: 0
        },
        bookings: [],
        reviews: []
      } : undefined
    });
  };

  return {
    getPropertyAnalytics,
    setDateRange: (start: Date | undefined, end: Date | undefined) => {
      setStartDate(start);
      setEndDate(end);
    },
    startDate,
    endDate,
  };
};