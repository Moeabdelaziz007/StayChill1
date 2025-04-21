import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { CalendarIcon, Clock, Users, AlertCircle, Info } from "lucide-react";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// تعريف نموذج البيانات للنادي الليلي
interface NightclubProps {
  id: number;
  name: string;
  description?: string;
  location: string;
  address: string;
  serviceType: string;
  image?: string;
  nightclubType?: string;
  priceRange: string;
  openingTime?: string;
  closingTime?: string;
  coverCharge?: number;
  events?: string[];
  reservationFee?: number;
}

// خصائص مكون نموذج الحجز
interface NightclubReservationFormProps {
  nightclub: NightclubProps;
  onSuccess: () => void;
  onCancel: () => void;
  reservationFee: number;
}

// مخطط التحقق من صحة نموذج الحجز
const reservationSchema = z.object({
  reservationDate: z.date({
    required_error: "يرجى اختيار تاريخ الحجز",
  }),
  reservationTime: z.string({
    required_error: "يرجى اختيار وقت الحجز",
  }),
  partySize: z.string().transform((val) => parseInt(val, 10)),
  specialRequests: z.string().optional(),
  fullName: z.string().min(3, {
    message: "يجب أن يحتوي الاسم على الأقل 3 أحرف",
  }),
  phone: z.string().min(10, {
    message: "يرجى إدخال رقم هاتف صحيح",
  }),
  email: z.string().email({
    message: "يرجى إدخال بريد إلكتروني صحيح",
  }),
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: "يجب الموافقة على الشروط والأحكام",
  }),
});

type ReservationFormData = z.infer<typeof reservationSchema>;

// أوقات التحفظ المتاحة (ستكون ديناميكية في التطبيق الفعلي)
const AVAILABLE_TIMES = [
  "21:00", "21:30", "22:00", "22:30", "23:00", "23:30", 
  "00:00", "00:30", "01:00", "01:30", "02:00"
];

export function NightclubReservationForm({ 
  nightclub, 
  onSuccess, 
  onCancel,
  reservationFee
}: NightclubReservationFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isPaymentAccepted, setIsPaymentAccepted] = useState(false);

  // تهيئة النموذج
  const form = useForm<ReservationFormData>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      reservationDate: new Date(),
      reservationTime: "",
      partySize: "4",
      specialRequests: "",
      fullName: user?.firstName && user?.lastName 
        ? `${user.firstName} ${user.lastName}` 
        : "",
      phone: "",
      email: user?.email || "",
      agreeToTerms: false,
    },
  });

  // إنشاء طلب الحجز
  const createReservation = useMutation({
    mutationFn: async (data: ReservationFormData) => {
      const response = await apiRequest("POST", `/api/nightclubs/${nightclub.id}/reservation`, {
        ...data,
        userId: user?.id,
        nightclubId: nightclub.id,
        reservationDateTime: `${format(data.reservationDate, 'yyyy-MM-dd')}T${data.reservationTime}`,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "حدث خطأ أثناء إنشاء الحجز");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/nightclub-reservations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/nightclubs", nightclub.id, "reservations"] });
      onSuccess();
      toast({
        title: "تم الحجز بنجاح",
        description: "سيتم خصم رسوم الحجز $15 من رصيدك",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "فشل في إنشاء الحجز",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // إرسال النموذج
  const onSubmit = (data: ReservationFormData) => {
    if (!isPaymentAccepted) {
      toast({
        title: "يرجى الموافقة على شروط الحجز",
        description: "يجب الموافقة على دفع رسوم الحجز للمتابعة",
        variant: "destructive",
      });
      return;
    }
    
    createReservation.mutate(data);
  };

  // تنسيق وعرض التاريخ
  const formatDate = (date: Date) => {
    return format(date, "yyyy-MM-dd");
  };

  return (
    <div className="p-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">{nightclub.name}</h2>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{nightclub.location}</Badge>
          {nightclub.nightclubType && (
            <Badge variant="outline">{nightclub.nightclubType}</Badge>
          )}
        </div>
      </div>
      
      <Alert className="mb-6 bg-green-50 border-green-200">
        <AlertCircle className="h-4 w-4 text-green-500" />
        <AlertTitle className="text-green-800">رسوم الحجز</AlertTitle>
        <AlertDescription className="text-green-700">
          يتم تطبيق رسوم قدرها ${reservationFee} على حجز النادي الليلي. سيتم خصمها من رصيدك عند تأكيد الحجز.
        </AlertDescription>
      </Alert>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* تاريخ الحجز */}
            <FormField
              control={form.control}
              name="reservationDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>تاريخ الزيارة</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={`w-full pl-3 text-right font-normal ${
                            !field.value ? "text-muted-foreground" : ""
                          }`}
                        >
                          {field.value ? (
                            format(field.value, "yyyy/MM/dd")
                          ) : (
                            <span>اختر تاريخ</span>
                          )}
                          <CalendarIcon className="mr-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                        disabled={(date) => 
                          date < new Date(new Date().setHours(0, 0, 0, 0))
                        }
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* وقت الحجز */}
            <FormField
              control={form.control}
              name="reservationTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>وقت الزيارة</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر وقت" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {AVAILABLE_TIMES.map((time) => (
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

            {/* عدد الأشخاص */}
            <FormField
              control={form.control}
              name="partySize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>عدد الأشخاص</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="عدد الأشخاص" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((size) => (
                        <SelectItem key={size} value={size.toString()}>
                          {size} {size === 1 ? "شخص" : "أشخاص"}
                        </SelectItem>
                      ))}
                      <SelectItem value="15">15 شخص (حجز خاص)</SelectItem>
                      <SelectItem value="20">20 شخص (حجز خاص)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* الاسم الكامل */}
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الاسم الكامل</FormLabel>
                  <FormControl>
                    <Input placeholder="أدخل اسمك الكامل" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* رقم الهاتف */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>رقم الهاتف</FormLabel>
                  <FormControl>
                    <Input placeholder="+20xx xxxx xxxx" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* البريد الإلكتروني */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>البريد الإلكتروني</FormLabel>
                  <FormControl>
                    <Input placeholder="example@mail.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* طلبات خاصة */}
          <FormField
            control={form.control}
            name="specialRequests"
            render={({ field }) => (
              <FormItem>
                <FormLabel>طلبات خاصة (اختياري)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="أي طلبات خاصة أو تعليمات إضافية..."
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* معلومات النادي الليلي */}
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">معلومات النادي الليلي</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>ساعات العمل: {nightclub.openingTime} - {nightclub.closingTime}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>رسوم الدخول: {nightclub.coverCharge ? `$${nightclub.coverCharge}` : 'مجاناً'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* شروط الحجز والرسوم */}
          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="agreeToFee"
              className="mt-1"
              checked={isPaymentAccepted}
              onChange={(e) => setIsPaymentAccepted(e.target.checked)}
            />
            <label htmlFor="agreeToFee" className="text-sm text-muted-foreground">
              أوافق على دفع رسوم الحجز البالغة ${reservationFee} والتي سيتم خصمها من رصيدي عند تأكيد الحجز. في حالة عدم الحضور سيتم خصم الرسوم بالكامل.
            </label>
          </div>

          {/* الموافقة على الشروط والأحكام */}
          <FormField
            control={form.control}
            name="agreeToTerms"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                <FormControl>
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none mr-2">
                  <FormLabel>
                    أوافق على شروط وأحكام الاستخدام وسياسة الخصوصية
                  </FormLabel>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          {/* أزرار الإرسال والإلغاء */}
          <div className="flex flex-col md:flex-row gap-3 pt-3">
            <Button 
              type="submit" 
              className="flex-1"
              disabled={createReservation.isPending}
            >
              {createReservation.isPending ? (
                <>جاري الحجز...</>
              ) : (
                <>تأكيد الحجز</>
              )}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1"
              onClick={onCancel}
            >
              إلغاء
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}