import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format, isAfter, isBefore, addMinutes, parse, set } from "date-fns";
import { ar } from "date-fns/locale";

import { InsertRestaurantReservation, Restaurant as RestaurantType } from "@shared/schema";

// Use the same extended Restaurant interface as in the restaurant page
interface Restaurant extends RestaurantType {
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

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, Utensils } from "lucide-react";
import { cn } from "@/lib/utils";

interface RestaurantReservationFormProps {
  restaurant: Restaurant;
  onSuccess?: (data: any) => void;
  onCancel?: () => void;
}

export const RestaurantReservationForm = ({
  restaurant,
  onSuccess,
  onCancel
}: RestaurantReservationFormProps) => {
  const { t, locale } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // تحويل ساعات المطعم إلى كائنات Date للمقارنة
  const parseTimeToDate = (timeString: string) => {
    return parse(timeString, "HH:mm:ss", new Date());
  };
  
  const formatTimeForDisplay = (timeString: string) => {
    const date = parseTimeToDate(timeString);
    return format(date, "h:mm a");
  };

  const openingTime = parseTimeToDate(restaurant.openingTime);
  const closingTime = parseTimeToDate(restaurant.closingTime);
  
  // جلب جميع الساعات المتاحة بفاصل 30 دقيقة بين الساعات
  const getAvailableTimeSlots = () => {
    const slots = [];
    let currentTime = openingTime;
    
    // إضافة 30 دقيقة قبل وقت الإغلاق لضمان أن آخر حجز يكون قبل الإغلاق بـ 30 دقيقة على الأقل
    const lastSlot = addMinutes(closingTime, -30);
    
    while (isBefore(currentTime, lastSlot) || currentTime.getTime() === lastSlot.getTime()) {
      slots.push(format(currentTime, "HH:mm:ss"));
      currentTime = addMinutes(currentTime, 30);
    }
    
    return slots;
  };
  
  const availableTimeSlots = getAvailableTimeSlots();
  
  // جلب الأحجام المتاحة للحجز
  const partySizes = Array.from({ length: 20 }, (_, i) => i + 1);
  
  // إنشاء مخطط التحقق من صحة نموذج الحجز
  const formSchema = z.object({
    restaurantId: z.number(),
    userId: z.number(),
    reservationDate: z.date({
      required_error: t('restaurants.reservationForm.dateRequired'),
    }).refine(date => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return isAfter(date, today) || date.getTime() === today.getTime();
    }, {
      message: t('restaurants.reservationForm.dateInPast'),
    }),
    reservationTime: z.string({
      required_error: t('restaurants.reservationForm.timeRequired'),
    }),
    partySize: z.number({
      required_error: t('restaurants.reservationForm.partySizeRequired'),
    }).min(1, {
      message: t('restaurants.reservationForm.partySizeMin'),
    }).max(20, {
      message: t('restaurants.reservationForm.partySizeMax'),
    }),
    specialRequests: z.string().optional(),
  });

  // تهيئة نموذج React Hook Form مع التحقق من صحة Zod
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      restaurantId: restaurant.id,
      userId: user?.id,
      specialRequests: "",
      partySize: 2,
    },
  });

  // معالج تقديم النموذج
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      toast({
        title: t('common.error'),
        description: t('restaurants.reservationForm.loginRequired'),
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // إنشاء كائن الحجز
      const reservation: InsertRestaurantReservation = {
        restaurantId: values.restaurantId,
        userId: values.userId!,
        reservationDate: values.reservationDate,
        reservationTime: values.reservationTime,
        partySize: values.partySize,
        specialRequests: values.specialRequests || null,
        status: "pending",
        pointsEarned: 100, // 100 نقطة لكل حجز مطعم
      };
      
      // إرسال بيانات الحجز للخادم
      const response = await fetch("/api/restaurant-reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reservation),
      });
      
      if (!response.ok) {
        throw new Error(t('restaurants.reservationForm.failedToSubmit'));
      }
      
      const data = await response.json();
      
      toast({
        title: t('restaurants.reservationForm.success'),
        description: t('restaurants.reservationForm.successDescription'),
      });
      
      // استدعاء معالج النجاح إذا تم تقديمه
      if (onSuccess) {
        onSuccess(data);
      }
    } catch (error) {
      console.error("Error submitting reservation:", error);
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('restaurants.reservationForm.unknownError'),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Utensils className="h-5 w-5" />
          {t('restaurants.reservationForm.title')}
        </CardTitle>
        <CardDescription>
          {t('restaurants.reservationForm.subtitle', { restaurant: restaurant.name })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form id="reservation-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground border border-border rounded-md p-3">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                <span>{t('restaurants.openingHours')}</span>
              </div>
              <div>
                {formatTimeForDisplay(restaurant.openingTime)} - {formatTimeForDisplay(restaurant.closingTime)}
              </div>
            </div>
            
            <FormField
              control={form.control}
              name="reservationDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>{t('restaurants.reservationForm.date')}</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="me-2 h-4 w-4" />
                          {field.value ? (
                            format(field.value, "PPP", { locale: locale === 'ar' ? ar : undefined })
                          ) : (
                            <span>{t('restaurants.reservationForm.selectDate')}</span>
                          )}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          return isBefore(date, today);
                        }}
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
                <FormItem>
                  <FormLabel>{t('restaurants.reservationForm.time')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('restaurants.reservationForm.selectTime')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableTimeSlots.map((time) => (
                        <SelectItem key={time} value={time}>
                          {formatTimeForDisplay(time)}
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
                <FormItem>
                  <FormLabel>{t('restaurants.reservationForm.partySize')}</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value, 10))}
                    defaultValue={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('restaurants.reservationForm.selectPartySize')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {partySizes.map((size) => (
                        <SelectItem key={size} value={size.toString()}>
                          {size} {size === 1 ? t('restaurants.reservationForm.person') : t('restaurants.reservationForm.people')}
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
              name="specialRequests"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('restaurants.reservationForm.specialRequests')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('restaurants.reservationForm.specialRequestsPlaceholder')}
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button 
          type="submit" 
          form="reservation-form" 
          disabled={isSubmitting}
        >
          {isSubmitting ? t('common.processing') : t('restaurants.reservationForm.submit')}
        </Button>
      </CardFooter>
    </Card>
  );
};