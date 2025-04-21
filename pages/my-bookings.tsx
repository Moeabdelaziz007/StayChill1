import { useState } from "react";
import { useBookings, Booking } from "@/hooks/useBookings";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  BookingListSkeleton, 
  PageTransition, 
  FullPageLoadingSkeleton 
} from "@/components/ui/loading-skeleton";

const MyBookings = () => {
  const { user } = useAuth();
  const { getUserBookings, cancelBooking, isCancellingBooking } = useBookings();
  const { data: bookings = [], isLoading } = getUserBookings();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  
  if (!user) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p>Please log in to view your bookings.</p>
      </div>
    );
  }
  
  const handleCancelBooking = async () => {
    if (!selectedBooking) return;
    
    try {
      await cancelBooking(selectedBooking.id);
      setCancelDialogOpen(false);
    } catch (error) {
      console.error("Error cancelling booking:", error);
    }
  };
  
  const openCancelDialog = (booking: Booking) => {
    setSelectedBooking(booking);
    setCancelDialogOpen(true);
  };
  
  // Split bookings by status
  const upcomingBookings = bookings.filter(
    (booking) => 
      (booking.status === "confirmed" || booking.status === "pending_approval") && 
      new Date(booking.startDate) > new Date()
  );
  
  const pastBookings = bookings.filter(
    (booking) => new Date(booking.endDate) < new Date() || booking.status === "completed"
  );
  
  const pendingBookings = bookings.filter(
    (booking) => booking.status === "pending" || booking.status === "pending_approval"
  );
  
  const cancelledBookings = bookings.filter(
    (booking) => booking.status === "cancelled"
  );
  
  const renderBookingCard = (booking: Booking) => {
    const startDate = new Date(booking.startDate);
    const endDate = new Date(booking.endDate);
    const nights = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const isPast = new Date(booking.endDate) < new Date();
    const isCancelled = booking.status === "cancelled";
    
    return (
      <Card key={booking.id} className={`${isCancelled ? 'bg-gray-50' : ''}`}>
        <CardHeader className="pb-2">
          <div className="flex justify-between">
            <div>
              <CardTitle className="text-lg">{booking.property?.title || "عقار"}</CardTitle>
              <CardDescription>{booking.property?.location || "الموقع"}</CardDescription>
            </div>
            {renderStatusBadge(booking.status)}
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/3">
              <div className="aspect-w-16 aspect-h-9 rounded-md overflow-hidden">
                <img 
                  src={booking.property?.images?.[0] || "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80"} 
                  alt={booking.property?.title || "Property"} 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="w-full md:w-2/3 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">تسجيل الوصول</p>
                  <p className="font-medium">{format(startDate, "MMM d, yyyy")}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">تسجيل المغادرة</p>
                  <p className="font-medium">{format(endDate, "MMM d, yyyy")}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">عدد الضيوف</p>
                  <p className="font-medium">{booking.guestCount}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">عدد الليالي</p>
                  <p className="font-medium">{nights}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">السعر الإجمالي</p>
                  <p className="font-medium text-lg">${booking.totalPrice}</p>
                  {booking.paymentMethod && (
                    <div className="mt-1">
                      <Badge variant={booking.paymentMethod === "stripe" ? "default" : "outline"} className="mr-1">
                        {booking.paymentMethod === "stripe" ? "دفع إلكتروني" : "دفع عند الوصول"}
                      </Badge>
                      {booking.paymentStatus && (
                        <Badge variant={booking.paymentStatus === "paid" ? "default" : "outline"} className={
                          booking.paymentStatus === "paid" ? "bg-green-500" : 
                          booking.paymentStatus === "pending" ? "bg-yellow-500" : "bg-red-500"
                        }>
                          {booking.paymentStatus === "paid" ? "مدفوع" : 
                           booking.paymentStatus === "pending" ? "قيد الانتظار" : "فشل الدفع"}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                {booking.pointsEarned && (
                  <div className="bg-brand-orange bg-opacity-10 px-3 py-1 rounded-full flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-brand-orange mr-1">
                      <path d="M9.375 3a1.875 1.875 0 000 3.75h1.875v4.5H3.375A1.875 1.875 0 011.5 9.375v-.75c0-1.036.84-1.875 1.875-1.875h3.193A3.375 3.375 0 0112 2.753a3.375 3.375 0 015.432 3.997h3.943c1.035 0 1.875.84 1.875 1.875v.75c0 1.036-.84 1.875-1.875 1.875H12.75v-4.5h1.875a1.875 1.875 0 10-1.875-1.875V6.75h-1.5V4.875C11.25 3.839 10.41 3 9.375 3zM11.25 12.75H3v6.75a2.25 2.25 0 002.25 2.25h6v-9zM12.75 12.75v9h6.75a2.25 2.25 0 002.25-2.25v-6.75h-9z" />
                    </svg>
                    <span className="text-xs text-brand-orange font-medium">
                      {isCancelled ? "لن تحصل على نقاط" : isPast ? "تم الحصول على" : "ستحصل على"} {booking.pointsEarned} نقطة
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Link to={`/property/${booking.propertyId}`}>
            <Button variant="outline" size="sm">عرض العقار</Button>
          </Link>
          
          {booking.status === "confirmed" && new Date(booking.startDate) > new Date() && (
            <Button 
              onClick={() => openCancelDialog(booking)} 
              variant="destructive" 
              size="sm"
            >
              إلغاء الحجز
            </Button>
          )}
          
          {isPast && booking.status !== "cancelled" && (
            <Link to={`/review/${booking.id}`}>
              <Button variant="outline" size="sm">كتابة تقييم</Button>
            </Link>
          )}
        </CardFooter>
      </Card>
    );
  };
  
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-500">تم التأكيد</Badge>;
      case "pending":
        return <Badge variant="outline">قيد الانتظار</Badge>;
      case "pending_approval":
        return <Badge className="bg-yellow-500">بانتظار الموافقة</Badge>;
      case "cancelled":
        return <Badge variant="destructive">ملغي</Badge>;
      case "completed":
        return <Badge className="bg-blue-500">مكتمل</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6 animate-fadeIn">حجوزاتي</h1>
        <BookingListSkeleton count={3} />
      </div>
    );
  }
  
  return (
    <PageTransition className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6 animate-slideIn">حجوزاتي</h1>
      
      {bookings.length === 0 ? (
        <Card className="animate-scaleIn">
          <CardContent className="flex flex-col items-center py-8">
            <div className="rounded-full bg-gray-100 p-4 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium mb-2">لا يوجد حجوزات بعد</h3>
            <p className="text-gray-500 text-center mb-4">لم تقم بأي حجوزات حتى الآن. ابدأ باستكشاف العقارات للعثور على إقامتك المثالية!</p>
            <Link to="/search">
              <Button className="animate-pulse">ابحث عن عقارات</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="animate-slideUp">
          <Tabs defaultValue="upcoming" className="space-y-6">
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="upcoming">
                القادمة ({upcomingBookings.length})
              </TabsTrigger>
              <TabsTrigger value="pending">
                قيد الانتظار ({pendingBookings.length})
              </TabsTrigger>
              <TabsTrigger value="past">
                السابقة ({pastBookings.length})
              </TabsTrigger>
              <TabsTrigger value="cancelled">
                الملغاة ({cancelledBookings.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="upcoming" className="space-y-4">
              {upcomingBookings.length === 0 ? (
                <p className="text-center py-8 text-gray-500 animate-fadeIn">لا يوجد لديك حجوزات قادمة</p>
              ) : (
                upcomingBookings.map((booking, index) => (
                  <div 
                    key={booking.id} 
                    className="animate-slideUp" 
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {renderBookingCard(booking)}
                  </div>
                ))
              )}
            </TabsContent>
            
            <TabsContent value="pending" className="space-y-4">
              {pendingBookings.length === 0 ? (
                <p className="text-center py-8 text-gray-500 animate-fadeIn">لا يوجد لديك حجوزات قيد الانتظار</p>
              ) : (
                pendingBookings.map((booking, index) => (
                  <div 
                    key={booking.id} 
                    className="animate-slideUp" 
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {renderBookingCard(booking)}
                  </div>
                ))
              )}
            </TabsContent>
            
            <TabsContent value="past" className="space-y-4">
              {pastBookings.length === 0 ? (
                <p className="text-center py-8 text-gray-500 animate-fadeIn">لا يوجد لديك حجوزات سابقة</p>
              ) : (
                pastBookings.map((booking, index) => (
                  <div 
                    key={booking.id} 
                    className="animate-slideUp" 
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {renderBookingCard(booking)}
                  </div>
                ))
              )}
            </TabsContent>
            
            <TabsContent value="cancelled" className="space-y-4">
              {cancelledBookings.length === 0 ? (
                <p className="text-center py-8 text-gray-500 animate-fadeIn">لا يوجد لديك حجوزات ملغاة</p>
              ) : (
                cancelledBookings.map((booking, index) => (
                  <div 
                    key={booking.id} 
                    className="animate-slideUp" 
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {renderBookingCard(booking)}
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
      
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إلغاء الحجز</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من رغبتك في إلغاء الحجز؟ لا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="py-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-md overflow-hidden">
                  <img 
                    src={selectedBooking.property?.images?.[0] || "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80"} 
                    alt={selectedBooking.property?.title || "Property"} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="font-medium">{selectedBooking.property?.title || "Property"}</p>
                  <p className="text-sm text-gray-500">
                    {format(new Date(selectedBooking.startDate), "MMM d")} - {format(new Date(selectedBooking.endDate), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
              
              <p className="text-sm text-gray-500 mb-2">سياسة الإلغاء:</p>
              <p className="text-sm mb-4">سيتم رد المبلغ كاملاً إذا قمت بالإلغاء قبل 48 ساعة على الأقل من موعد تسجيل الوصول.</p>
              
              {selectedBooking.paymentMethod === "cash_on_arrival" ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 my-2">
                  <p className="text-sm text-yellow-700">
                    لقد اخترت الدفع عند الوصول، يمكنك إلغاء الحجز دون أي رسوم.
                  </p>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-md p-3 my-2">
                  <p className="text-sm text-green-700">
                    تم الدفع بالفعل باستخدام البطاقة، وسيتم رد المبلغ خلال 5-7 أيام عمل.
                  </p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              احتفظ بالحجز
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleCancelBooking}
              disabled={isCancellingBooking}
            >
              {isCancellingBooking ? "جاري الإلغاء..." : "تأكيد الإلغاء"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
};

export default MyBookings;
