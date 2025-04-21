import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import DateRangePicker from "./DateRangePicker";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PaymentElement, useStripe, useElements, Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { differenceInDays, addDays, format } from "date-fns";
import type { Property } from "@/hooks/useProperties";
import { useLocation } from "wouter";
import { CreditCard, Banknote, CheckCircle2, Gift, Calendar, User, Info, Smartphone, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useBookings } from "@/hooks/useBookings";
import { Textarea } from "@/components/ui/textarea";
import BookingSuccessModal from "./BookingSuccessModal";

// لواجهة stripe للدفع بالبطاقة
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || "");

const formSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
  guestCount: z.number().min(1).max(20),
  specialRequests: z.string().optional(),
  fullName: z.string().min(3, "يرجى إدخال الاسم الكامل"),
  email: z.string().email("يرجى إدخال بريد إلكتروني صالح"),
  phone: z.string().min(8, "يرجى إدخال رقم هاتف صالح"),
  paymentMethod: z.enum(["stripe", "cash_on_arrival"]),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: "يجب الموافقة على الشروط والأحكام"
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface BookingFormProps {
  property: Property;
}

function BookingFormStripeWrapper({ property, clientSecret }: { property: Property, clientSecret?: string | null }) {
  return clientSecret ? (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <BookingFormContent property={property} clientSecret={clientSecret} />
    </Elements>
  ) : (
    <BookingFormContent property={property} />
  );
}

const BookingFormContent = ({ property, clientSecret }: { property: Property, clientSecret?: string | null }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaymentReady, setIsPaymentReady] = useState(false);
  const [localClientSecret, setClientSecret] = useState<string | null>(clientSecret || null);
  const stripe = useStripe();
  const elements = useElements();
  const { createBooking } = useBookings();
  
  // إضافة استشعار حجم الشاشة لإنشاء تجربة متجاوبة
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    // وظيفة للتحقق من حجم الشاشة الحالي
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // تعيين القيمة الأولية
    checkIfMobile();
    
    // إضافة مستمع لتغيير حجم الشاشة
    window.addEventListener('resize', checkIfMobile);
    
    // تنظيف عند إلغاء التثبيت
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);
  
  const today = new Date();
  const tomorrow = addDays(today, 1);
  const dayAfterTomorrow = addDays(today, 2);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      startDate: tomorrow,
      endDate: dayAfterTomorrow,
      guestCount: 1,
      specialRequests: "",
      fullName: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.username || "",
      email: user?.email || "",
      phone: "",
      paymentMethod: "stripe",
      acceptTerms: false,
    },
  });
  
  const { watch, setValue } = form;
  const { startDate, endDate, guestCount, paymentMethod } = watch();
  
  // حساب التكاليف
  const nightsCount = startDate && endDate ? differenceInDays(endDate, startDate) : 1;
  const subtotal = property.price * nightsCount;
  const serviceFee = Math.round(subtotal * 0.12);
  const total = subtotal + serviceFee;
  const pointsEarnable = Math.floor(total * 2); // 2 points per $1
  
  // تحميل معلومات المستخدم عند أول تحميل
  useEffect(() => {
    if (user) {
      setValue("fullName", user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username || "");
      setValue("email", user.email || "");
    }
  }, [user, setValue]);
  
  // استعداد للدفع عند اختيار طريقة الدفع بالبطاقة
  useEffect(() => {
    if (paymentMethod === "stripe" && !localClientSecret) {
      const createIntent = async () => {
        try {
          const response = await apiRequest("POST", "/api/create-payment-intent", {
            amount: total,
            propertyId: property.id,
            guestEmail: form.getValues("email")
          });
          
          const data = await response.json();
          if (data.clientSecret) {
            setClientSecret(data.clientSecret);
            setIsPaymentReady(true);
          }
        } catch (error) {
          console.error("Error creating payment intent:", error);
        }
      };
      
      if (user) {
        createIntent();
      }
    }
  }, [paymentMethod, total, user, localClientSecret, property.id, form]);
  
  // وظيفة للدفع السريع
  const handleQuickPay = useCallback(async () => {
    if (!form.formState.isValid) {
      await form.trigger();
      if (!form.formState.isValid) return;
    }
    
    try {
      setIsSubmitting(true);
      const values = form.getValues();
      
      // استخدام بطاقة العميل المحفوظة سابقًا للدفع السريع
      const response = await apiRequest("POST", "/api/quick-payment", {
        propertyId: property.id,
        startDate: values.startDate.toISOString(),
        endDate: values.endDate.toISOString(),
        guestCount: values.guestCount,
        totalPrice: total,
        specialRequests: values.specialRequests,
        guestName: values.fullName,
        guestEmail: values.email,
        guestPhone: values.phone
      });
      
      const result = await response.json();
      
      toast({
        title: "تم تأكيد الحجز!",
        description: "تم الدفع باستخدام بطاقتك المحفوظة وتأكيد حجزك",
      });
      
      navigate("/my-bookings");
    } catch (error: any) {
      toast({
        title: "فشل الدفع السريع",
        description: error.message || "حدث خطأ أثناء معالجة الدفع. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [form, navigate, property.id, toast, total]);
  
  // إضافة حالة موديل النجاح
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<{
    id: number | string;
    pointsEarned: number;
  } | null>(null);
  
  const onSubmit = async (data: FormValues) => {
    if (!user) {
      toast({
        title: "يجب تسجيل الدخول",
        description: "يرجى تسجيل الدخول لإكمال الحجز",
        variant: "destructive",
      });
      return;
    }
    
    // تأثير بصري على الزر قبل بدء العملية
    setIsSubmitting(true);
    
    // إضافة تأخير صغير جدًا لإظهار تأثير الزر
    await new Promise(resolve => setTimeout(resolve, 300));
    
    try {
      if (data.paymentMethod === "stripe") {
        // تأكيد الدفع بالبطاقة
        if (!stripe || !elements) {
          toast({
            title: "خطأ في معالجة الدفع",
            description: "لم يتم تحميل نظام الدفع بشكل صحيح. يرجى المحاولة مرة أخرى.",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
        
        const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: window.location.origin + "/my-bookings",
          },
          redirect: "if_required",
        });
        
        if (stripeError) {
          throw new Error(stripeError.message);
        }
        
        if (paymentIntent && paymentIntent.status === "succeeded") {
          // إنشاء الحجز في النظام - ملاحظة: تم استبدال المصفوفة بكائن
          const newBooking = await createBooking({
            propertyId: property.id,
            startDate: data.startDate.toISOString(),
            endDate: data.endDate.toISOString(),
            guestCount: data.guestCount,
            totalPrice: total,
            paymentMethod: "stripe",
            paymentStatus: "paid",
            stripePaymentId: paymentIntent.id,
            specialRequests: data.specialRequests,
            guestName: data.fullName,
            guestEmail: data.email,
            guestPhone: data.phone
          });
          
          // حساب النقاط المكتسبة (2 نقطة لكل دولار)
          const pointsEarned = Math.floor(total * 2);
          
          // تخزين معلومات الحجز لعرضها في موديل النجاح
          setBookingDetails({
            id: newBooking.id || `${Date.now()}`,
            pointsEarned
          });
          
          // إظهار موديل النجاح بدلاً من التوست البسيط
          setSuccessModalOpen(true);
        }
      } else {
        // إضافة تأثير للانتظار - حالة طريقة الدفع عند الوصول
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // إنشاء الحجز بطريقة الدفع عند الوصول
        const newBooking = await createBooking({
          propertyId: property.id,
          startDate: data.startDate.toISOString(),
          endDate: data.endDate.toISOString(),
          guestCount: data.guestCount,
          totalPrice: total,
          paymentMethod: "cash_on_arrival",
          paymentStatus: "pending",
          specialRequests: data.specialRequests,
          guestName: data.fullName,
          guestEmail: data.email,
          guestPhone: data.phone
        });
        
        // حساب النقاط المكتسبة (2 نقطة لكل دولار) - يمكن أن تكون أقل لطريقة الدفع عند الوصول
        const pointsEarned = Math.floor(total);
        
        // تخزين معلومات الحجز لعرضها في موديل النجاح
        setBookingDetails({
          id: newBooking.id || `${Date.now()}`,
          pointsEarned
        });
        
        // إظهار موديل النجاح
        setSuccessModalOpen(true);
      }
    } catch (error: any) {
      console.error("Error in booking:", error);
      
      // تأثير بصري عند حدوث خطأ - اهتزاز خفيف (يمكن إضافته عبر CSS)
      const formElement = document.querySelector('form');
      if (formElement) {
        formElement.classList.add('shake-animation');
        setTimeout(() => {
          formElement.classList.remove('shake-animation');
        }, 500);
      }
      
      toast({
        title: "فشل في الحجز",
        description: error.message || "حدثت مشكلة أثناء معالجة حجزك. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!user) {
    return (
      <Card className="sticky top-24 w-full max-w-md shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">
            <span className="font-bold">${property.price}</span>
            <span className="text-medium-gray font-normal"> / ليلة</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <h3 className="text-lg font-bold mb-2">جاهز للحجز؟</h3>
          <p className="text-medium-gray mb-4">قم بتسجيل الدخول لإكمال الحجز</p>
          <Button className="w-full mb-3" onClick={() => navigate("/login")}>تسجيل الدخول للحجز</Button>
          <p className="text-xs text-medium-gray">
            لن يتم محاسبتك حتى تكمل الحجز
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <>
      <Card className={`sticky top-24 w-full ${isMobile ? 'max-w-full mx-0' : 'max-w-md'} shadow-lg border border-gray-200 ${isMobile ? 'rounded-none border-x-0' : 'rounded-lg'}`}>
        <CardHeader className={`pb-2 ${isMobile ? 'px-4' : 'px-6'}`}>
          <div className="flex justify-between items-baseline">
            <CardTitle className={`${isMobile ? 'text-xl' : 'text-lg'}`}>
              <span className="font-bold">${property.price}</span>
              <span className="text-medium-gray font-normal"> / ليلة</span>
            </CardTitle>
            {property.rating && (
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-yellow-500">
                  <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                </svg>
                <span className="ml-1 text-dark-gray text-sm">{property.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className={isMobile ? 'px-4' : 'px-6'}>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <Accordion type="single" collapsible defaultValue="dates">
                {/* قسم التواريخ وعدد الضيوف */}
                <AccordionItem value="dates" className="border-none">
                  <AccordionTrigger className="py-2 text-base font-semibold flex items-center">
                    <span className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4" />
                      التواريخ وعدد الضيوف
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    {/* محتوى قسم التواريخ... */}
                    <div className="space-y-4 py-2">
                      <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>تاريخ الوصول</FormLabel>
                            <FormControl>
                              <Input 
                                type="date" 
                                value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : ''}
                                onChange={e => field.onChange(new Date(e.target.value))} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>تاريخ المغادرة</FormLabel>
                            <FormControl>
                              <Input 
                                type="date" 
                                value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : ''}
                                onChange={e => field.onChange(new Date(e.target.value))} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="guestCount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>عدد الضيوف</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="1" 
                                max="20"
                                {...field}
                                onChange={e => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* قسم معلومات الاتصال */}
                <AccordionItem value="contact" className="border-none">
                  <AccordionTrigger className="py-2 text-base font-semibold">
                    <span className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      معلومات الاتصال
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 py-2">
                      <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الاسم الكامل</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>البريد الإلكتروني</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>رقم الهاتف</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                {/* قسم طريقة الدفع */}
                <AccordionItem value="payment" className="border-none">
                  <AccordionTrigger className="py-2 text-base font-semibold">
                    <span className="flex items-center">
                      <CreditCard className="mr-2 h-4 w-4" />
                      طريقة الدفع
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <FormField
                      control={form.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex flex-col space-y-1"
                            >
                              <div className="flex items-center space-x-2 space-x-reverse rtl:space-x-reverse">
                                <RadioGroupItem value="stripe" id="stripe" />
                                <Label
                                  htmlFor="stripe"
                                  className="flex items-center cursor-pointer p-2 rounded-md hover:bg-slate-50 w-full"
                                >
                                  <CreditCard className="ml-2 h-5 w-5 text-blue-500" />
                                  <div>
                                    <p className="font-medium">بطاقة إئتمان</p>
                                    <p className="text-xs text-gray-500">دفع آمن وسريع</p>
                                  </div>
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2 space-x-reverse rtl:space-x-reverse">
                                <RadioGroupItem value="cash_on_arrival" id="cash" />
                                <Label
                                  htmlFor="cash"
                                  className="flex items-center cursor-pointer p-2 rounded-md hover:bg-slate-50 w-full"
                                >
                                  <Banknote className="ml-2 h-5 w-5 text-green-500" />
                                  <div>
                                    <p className="font-medium">كاش عند الوصول</p>
                                    <p className="text-xs text-gray-500">تتطلب موافقة المالك</p>
                                  </div>
                                </Label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* عرض نموذج دفع Stripe عند اختيار الدفع بالبطاقة */}
                    {paymentMethod === "stripe" && (
                      <div className="mt-4 rounded-md p-4 border border-slate-200 bg-slate-50">
                        {localClientSecret ? (
                          <PaymentElement />
                        ) : (
                          <div className="flex items-center justify-center py-4">
                            <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                            <span className="mr-2 text-sm text-gray-600">جاري تحميل نموذج الدفع...</span>
                          </div>
                        )}
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
                
                {/* قسم طلبات خاصة */}
                <AccordionItem value="requests" className="border-none">
                  <AccordionTrigger className="py-2 text-base font-semibold">
                    <span className="flex items-center">
                      <Info className="mr-2 h-4 w-4" />
                      طلبات خاصة (اختياري)
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <FormField
                      control={form.control}
                      name="specialRequests"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              placeholder="أي تفاصيل أو طلبات خاصة بالإقامة..."
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              
              {/* الموافقة على الشروط والأحكام */}
              <FormField
                control={form.control}
                name="acceptTerms"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-x-reverse rtl:space-x-reverse">
                    <FormControl>
                      <Checkbox 
                        checked={field.value} 
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="text-xs text-gray-600 cursor-pointer">
                      أوافق على الشروط والأحكام ومعايير الإلغاء
                    </FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* زر التأكيد - محسّن للجوال */}
              <Button 
                type="submit" 
                className={`w-full ${isMobile ? 'text-base py-6 rounded-full' : 'py-4 rounded-md'}`}
                disabled={isSubmitting || (paymentMethod === "stripe" && (!isPaymentReady || !stripe || !elements))}
              >
                {isSubmitting 
                  ? "جارٍ المعالجة..." 
                  : paymentMethod === "stripe" 
                    ? `تأكيد الحجز والدفع - $${total}` 
                    : `تأكيد الحجز - $${total}`
                }
              </Button>
              
              <p className="text-center text-xs text-gray-500 mt-2">
                {paymentMethod === "stripe" 
                  ? "لن يتم محاسبتك حتى تؤكد الدفع أعلاه" 
                  : "لن يتم تأكيد الحجز حتى يتم الموافقة عليه من قبل المالك"
                }
              </p>
            </form>
          </Form>
        </CardContent>
        
        {/* تم إضافة CSS للتأثيرات البصرية في index.css بدلاً من هنا */}
      </Card>
      
      {/* موديل تأكيد الحجز */}
      {bookingDetails && successModalOpen && (
        <BookingSuccessModal 
          isOpen={true}
          onClose={() => {
            setSuccessModalOpen(false);
            navigate("/my-bookings");
          }}
          bookingId={bookingDetails.id}
          pointsEarned={bookingDetails.pointsEarned}
          propertyTitle={property.title}
        />
      )}
    </>
  );
};

const BookingForm = (props: BookingFormProps) => {
  return <BookingFormStripeWrapper {...props} />;
};

export default BookingForm;