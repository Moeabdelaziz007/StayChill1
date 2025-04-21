import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export interface Booking {
  id: number;
  userId: number;
  propertyId: number;
  startDate: string | Date;
  endDate: string | Date;
  guestCount: number;
  totalPrice: number;
  status: string;
  paymentMethod: 'stripe' | 'cash_on_arrival';
  paymentStatus: 'pending' | 'paid' | 'failed';
  stripePaymentId?: string;
  pointsEarned?: number;
  specialRequests?: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  createdAt: string | Date;
  property?: {
    title: string;
    location: string;
    images: string[];
  };
}

export interface CreateBookingData {
  propertyId: number;
  startDate: string;
  endDate: string;
  guestCount: number;
  totalPrice: number;
  paymentMethod?: 'stripe' | 'cash_on_arrival';
  paymentStatus?: 'pending' | 'paid' | 'failed';
  stripePaymentId?: string;
  specialRequests?: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
}

export const useBookings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get user bookings
  const getUserBookings = () => {
    return useQuery<Booking[]>({
      queryKey: ["/api/bookings"],
    });
  };
  
  // Get a specific booking by ID
  const getBooking = (id: number) => {
    return useQuery<Booking>({
      queryKey: [`/api/bookings/${id}`],
      enabled: !!id,
    });
  };
  
  // Create a new booking
  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: CreateBookingData) => {
      const response = await apiRequest("POST", "/api/bookings", bookingData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({
        title: "تم تأكيد الحجز",
        description: "تم تأكيد الحجز بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "فشل في الحجز",
        description: `حدث خطأ أثناء إنشاء الحجز: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Update a booking status
  const updateBookingStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest("PATCH", `/api/bookings/${id}`, { status });
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: [`/api/bookings/${variables.id}`] });
      toast({
        title: "تم تحديث الحجز",
        description: `تم تحديث حالة الحجز إلى ${variables.status}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "فشل التحديث",
        description: `فشل تحديث الحجز: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Cancel a booking
  const cancelBookingMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("PATCH", `/api/bookings/${id}`, { status: "cancelled" });
      return response.json();
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: [`/api/bookings/${id}`] });
      toast({
        title: "تم إلغاء الحجز",
        description: "تم إلغاء الحجز بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "فشل الإلغاء",
        description: `فشل إلغاء الحجز: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // تعديل وظيفة إنشاء الحجز لتعيد قيمة
  const createBooking = async (bookingData: CreateBookingData): Promise<Booking> => {
    return await createBookingMutation.mutateAsync(bookingData);
  };

  return {
    getUserBookings,
    getBooking,
    createBooking,
    updateBookingStatus: updateBookingStatusMutation.mutate,
    cancelBooking: cancelBookingMutation.mutate,
    isCreatingBooking: createBookingMutation.isPending,
    isUpdatingBooking: updateBookingStatusMutation.isPending,
    isCancellingBooking: cancelBookingMutation.isPending,
  };
};
