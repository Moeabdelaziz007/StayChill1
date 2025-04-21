import { useState, useEffect } from "react";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useProperties } from "@/hooks/useProperties";
import { useBookings } from "@/hooks/useBookings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CreditCard, Banknote } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

// Load Stripe outside of component to avoid recreating it on every render
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || "");

interface CheckoutProps {
  propertyId: number;
}

const Checkout = ({ propertyId }: CheckoutProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { getProperty } = useProperties();
  const { createBooking } = useBookings();
  const [, navigate] = useLocation();
  const [property, setProperty] = useState<any>(null);
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [clientSecret, setClientSecret] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "cash_on_arrival">("stripe");
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Check if user is logged in
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to proceed with checkout",
        variant: "destructive",
      });
      navigate("/");
      return;
    }
    
    // Get booking details from sessionStorage
    const storedDetails = sessionStorage.getItem("booking_details");
    if (!storedDetails) {
      toast({
        title: "Booking information missing",
        description: "Please try booking again",
        variant: "destructive",
      });
      navigate(`/property/${propertyId}`);
      return;
    }
    
    const details = JSON.parse(storedDetails);
    setBookingDetails(details);
    setClientSecret(details.clientSecret);
    
    // Fetch property details
    const loadProperty = async () => {
      try {
        const propertyData = await getProperty(propertyId);
        setProperty(propertyData);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load property details",
          variant: "destructive",
        });
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProperty();
  }, [propertyId, user, navigate, getProperty, toast]);
  
  if (isLoading || !property || !bookingDetails) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin w-10 h-10 border-4 border-brand border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-8">Complete your booking</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Booking Summary</CardTitle>
              <CardDescription>Review your booking details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-24 h-24 rounded-md overflow-hidden flex-shrink-0">
                  <img 
                    src={property.images[0]} 
                    alt={property.title} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-semibold">{property.title}</h3>
                  <p className="text-sm text-gray-500">{property.location}</p>
                </div>
              </div>
              
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Check-in</span>
                  <span className="font-medium">{format(new Date(bookingDetails.startDate), "EEE, MMM d, yyyy")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Check-out</span>
                  <span className="font-medium">{format(new Date(bookingDetails.endDate), "EEE, MMM d, yyyy")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Guests</span>
                  <span className="font-medium">{bookingDetails.guestCount}</span>
                </div>
                
                {bookingDetails.specialRequests && (
                  <div className="pt-2">
                    <p className="text-sm font-medium">Special requests:</p>
                    <p className="text-sm text-gray-600">{bookingDetails.specialRequests}</p>
                  </div>
                )}
              </div>
              
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Price ({property.price} × nights)</span>
                  <span>${property.price * ((new Date(bookingDetails.endDate).getTime() - new Date(bookingDetails.startDate).getTime()) / (1000 * 60 * 60 * 24))}</span>
                </div>
                <div className="flex justify-between">
                  <span>Service fee</span>
                  <span>${bookingDetails.totalPrice - (property.price * ((new Date(bookingDetails.endDate).getTime() - new Date(bookingDetails.startDate).getTime()) / (1000 * 60 * 60 * 24)))}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>${bookingDetails.totalPrice}</span>
                </div>
              </div>
              
              <div className="bg-brand-orange bg-opacity-10 p-3 rounded-md flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-brand-orange mr-2">
                  <path d="M9.375 3a1.875 1.875 0 000 3.75h1.875v4.5H3.375A1.875 1.875 0 011.5 9.375v-.75c0-1.036.84-1.875 1.875-1.875h3.193A3.375 3.375 0 0112 2.753a3.375 3.375 0 015.432 3.997h3.943c1.035 0 1.875.84 1.875 1.875v.75c0 1.036-.84 1.875-1.875 1.875H12.75v-4.5h1.875a1.875 1.875 0 10-1.875-1.875V6.75h-1.5V4.875C11.25 3.839 10.41 3 9.375 3zM11.25 12.75H3v6.75a2.25 2.25 0 002.25 2.25h6v-9zM12.75 12.75v9h6.75a2.25 2.25 0 002.25-2.25v-6.75h-9z" />
                </svg>
                <span className="text-sm text-brand-orange">
                  You'll earn {Math.floor(bookingDetails.totalPrice * 2)} reward points with this booking
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
              <CardDescription>Select your payment method</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs
                value={paymentMethod}
                onValueChange={(value) => setPaymentMethod(value as "stripe" | "cash_on_arrival")}
                className="mb-6"
              >
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="stripe" className="flex items-center justify-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    <span>بطاقة إئتمان</span>
                  </TabsTrigger>
                  <TabsTrigger value="cash_on_arrival" className="flex items-center justify-center gap-2">
                    <Banknote className="h-4 w-4" />
                    <span>كاش عند الوصول</span>
                  </TabsTrigger>
                </TabsList>
                
                <div className="p-2 bg-muted rounded-lg mb-4">
                  {paymentMethod === "stripe" ? (
                    <div className="bg-white p-3 rounded border text-sm text-center">
                      <p className="font-semibold mb-2">دفع آمن بالبطاقة</p>
                      <p className="text-gray-500">سيتم تأكيد الحجز فوراً بعد إتمام عملية الدفع</p>
                    </div>
                  ) : (
                    <div className="bg-white p-3 rounded border text-sm text-center">
                      <p className="font-semibold mb-2">دفع كاش عند الوصول</p>
                      <p className="text-gray-500">يتطلب موافقة المالك وسيتم إبلاغك خلال 24 ساعة</p>
                    </div>
                  )}
                </div>
              </Tabs>
              
              {paymentMethod === "stripe" ? (
                clientSecret ? (
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <CheckoutForm 
                      bookingDetails={bookingDetails}
                      propertyId={propertyId}
                      createBooking={createBooking}
                      paymentMethod={paymentMethod}
                    />
                  </Elements>
                ) : (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin w-6 h-6 border-2 border-brand border-t-transparent rounded-full"></div>
                  </div>
                )
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                    <h3 className="font-medium text-yellow-800 mb-2 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                      </svg>
                      معلومات عن الدفع عند الوصول
                    </h3>
                    <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                      <li>يجب عليك دفع كامل المبلغ نقداً عند تسجيل الوصول</li>
                      <li>يرجى التأكد من إحضار المبلغ المطلوب بالكامل</li>
                      <li>لا يمكن تأكيد الحجز إلا بعد موافقة المالك</li>
                    </ul>
                  </div>
                  
                  <CashOnArrivalForm
                    bookingDetails={bookingDetails}
                    propertyId={propertyId}
                    createBooking={createBooking}
                    paymentMethod={paymentMethod}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

interface CheckoutFormProps {
  bookingDetails: any;
  propertyId: number;
  createBooking: (data: any) => void;
  paymentMethod: "stripe" | "cash_on_arrival";
}

// Cash on Arrival payment form
interface CashOnArrivalFormProps {
  bookingDetails: any;
  propertyId: number;
  createBooking: (data: any) => void;
  paymentMethod: "stripe" | "cash_on_arrival";
}

const CashOnArrivalForm = ({ bookingDetails, propertyId, createBooking, paymentMethod }: CashOnArrivalFormProps) => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [agreed, setAgreed] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agreed) {
      toast({
        title: "Please agree to the terms",
        description: "You must agree to the terms and conditions to proceed",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Create the booking in our system with cash payment method
      createBooking({
        propertyId,
        startDate: bookingDetails.startDate,
        endDate: bookingDetails.endDate,
        guestCount: bookingDetails.guestCount,
        totalPrice: bookingDetails.totalPrice,
        paymentMethod: "cash_on_arrival",
        paymentStatus: "pending",
        specialRequests: bookingDetails.specialRequests,
      });
      
      // Clear booking details from session storage
      sessionStorage.removeItem("booking_details");
      
      // Show success message and redirect to bookings page
      toast({
        title: "Booking request submitted!",
        description: "Your booking is pending confirmation from the property owner",
      });
      
      navigate("/bookings");
    } catch (error: any) {
      toast({
        title: "Booking failed",
        description: error.message || "There was an error processing your booking",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="terms"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="h-4 w-4 border-gray-300 rounded text-brand focus:ring-brand"
        />
        <label htmlFor="terms" className="text-sm text-gray-500">
          أوافق على شروط الحجز وأتعهد بدفع المبلغ كاملاً عند الوصول
        </label>
      </div>
      
      <Button
        type="submit"
        className="w-full bg-yellow-500 hover:bg-yellow-600"
        disabled={isProcessing}
      >
        {isProcessing ? "جاري الإرسال..." : `تأكيد الحجز - $${bookingDetails.totalPrice}`}
      </Button>
      
      <p className="text-xs text-center text-gray-500">
        سيتم تأكيد الحجز بعد موافقة المالك. سنرسل إليك إشعاراً بالموافقة أو الرفض.
      </p>
    </form>
  );
};

const CheckoutForm = ({ bookingDetails, propertyId, createBooking, paymentMethod }: CheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Confirm the payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + "/bookings",
        },
        redirect: "if_required",
      });
      
      if (stripeError) {
        throw new Error(stripeError.message);
      }
      
      if (paymentIntent && paymentIntent.status === "succeeded") {
        // Create the booking in our system
        createBooking({
          propertyId,
          startDate: bookingDetails.startDate,
          endDate: bookingDetails.endDate,
          guestCount: bookingDetails.guestCount,
          totalPrice: bookingDetails.totalPrice,
          paymentMethod: "stripe",
          paymentStatus: "paid",
          stripePaymentId: paymentIntent.id,
          specialRequests: bookingDetails.specialRequests,
        });
        
        // Clear booking details from session storage
        sessionStorage.removeItem("booking_details");
        
        // Show success message and redirect to bookings page
        toast({
          title: "Booking confirmed!",
          description: "Your payment was successful and your booking is confirmed",
        });
        
        navigate("/bookings");
      }
    } catch (error: any) {
      toast({
        title: "Payment failed",
        description: error.message || "There was an error processing your payment",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement className="mb-6" />
      
      <div className="text-sm text-center text-gray-500 mb-6">
        <p>بالضغط على زر الدفع، أنت توافق على شروط وأحكام الحجز</p>
      </div>
      
      <Button 
        type="submit" 
        className="w-full bg-green-600 hover:bg-green-700"
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? "جاري إتمام الدفع..." : `الدفع - $${bookingDetails.totalPrice}`}
      </Button>
    </form>
  );
};

export default Checkout;
