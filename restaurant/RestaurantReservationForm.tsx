import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { insertRestaurantReservationSchema } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { logger } from "@/lib/logger";
import { BookingFormSkeleton, PageTransition } from "@/components/ui/loading-skeleton";

interface RestaurantReservationFormProps {
  restaurantId: number;
  onSuccess?: () => void;
}

const formSchema = insertRestaurantReservationSchema.extend({
  reservationDate: z.date({
    required_error: "Please select a date",
  }),
  reservationTime: z.string({
    required_error: "Please select a time",
  }),
  partySize: z.coerce.number().min(1, "Party size must be at least 1").max(20, "Party size can't exceed 20"),
  specialRequests: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function RestaurantReservationForm({ restaurantId, onSuccess }: RestaurantReservationFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      restaurantId,
      partySize: 2,
      specialRequests: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      logger.debug("RestaurantReservationForm", "Creating reservation", values);
      
      // Format time for API
      const formattedValues = {
        ...values,
        userId: user?.id,
        restaurantId: restaurantId,
      };
      
      const response = await apiRequest("POST", "/api/restaurant-reservations", formattedValues);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Reservation Successful!",
        description: "Your restaurant reservation has been confirmed. You've earned 100 reward points!",
      });
      
      // Reset form
      form.reset();
      setSelectedDate(undefined);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["/api/user/restaurant-reservations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants/reservations", restaurantId] });
      
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      logger.error("RestaurantReservationForm", "Error creating reservation", error);
      toast({
        title: "Reservation Failed",
        description: "There was an error creating your reservation. Please try again.",
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: FormValues) {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to make a reservation",
        variant: "destructive",
      });
      return;
    }
    
    mutation.mutate(values);
  }

  // Generate time slots from 9 AM to 10 PM in 30-minute intervals
  const timeSlots: string[] = [];
  for (let hour = 9; hour <= 22; hour++) {
    for (let minute of [0, 30]) {
      const formattedHour = hour.toString().padStart(2, "0");
      const formattedMinute = minute.toString().padStart(2, "0");
      timeSlots.push(`${formattedHour}:${formattedMinute}`);
    }
  }

  // If the form is loading (showing a skeleton while user data is being loaded)
  if (!user && mutation.isPending) {
    return <BookingFormSkeleton />;
  }

  return (
    <PageTransition>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="reservationDate"
            render={({ field }) => (
              <FormItem className="flex flex-col animate-fadeIn" style={{ animationDelay: "0.1s" }}>
                <FormLabel>Reservation Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Select a date</span>
                        )}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        field.onChange(date);
                        setSelectedDate(date);
                      }}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

        <FormField
          control={form.control}
          name="reservationTime"
          render={({ field }) => (
            <FormItem className="animate-fadeIn" style={{ animationDelay: "0.2s" }}>
              <FormLabel>Time</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
                disabled={!selectedDate}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a time" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="partySize"
          render={({ field }) => (
            <FormItem className="animate-fadeIn" style={{ animationDelay: "0.3s" }}>
              <FormLabel>Number of Guests</FormLabel>
              <FormControl>
                <Input type="number" min={1} max={20} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="specialRequests"
          render={({ field }) => (
            <FormItem className="animate-fadeIn" style={{ animationDelay: "0.4s" }}>
              <FormLabel>Special Requests (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Any dietary restrictions or special occasions?" 
                  className="resize-none" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="animate-scaleIn" style={{ animationDelay: "0.5s" }}>
          <Button 
            type="submit" 
            className="w-full bg-brand hover:bg-brand/90" 
            disabled={mutation.isPending || !user}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              "Reserve Now"
            )}
          </Button>
          
          {!user && (
            <p className="text-sm text-center text-muted-foreground mt-2">
              Please log in to make a reservation
            </p>
          )}
          
          <p className="text-xs text-center text-muted-foreground mt-2 animate-pulse">
            You'll earn 100 reward points for each restaurant reservation!
          </p>
        </div>
      </form>
    </Form>
  </PageTransition>
  );
}