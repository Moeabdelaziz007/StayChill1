import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Pencil, Trash2, Eye, AlertCircle, LineChart, CalendarRange, Star, Home, Settings, ChevronRight } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";

// نوع البيانات للعقار
type Property = {
  id: number;
  title: string;
  description: string;
  location: string;
  address: string;
  price: number;
  beds: number;
  baths: number;
  guests: number;
  images: string[];
  rating: number | null;
  reviewsCount: number | null;
  featured: boolean | null;
  userId: number;
  active: boolean | null;
  createdAt: Date;
};

// نوع البيانات للحجز
type Booking = {
  id: number;
  propertyId: number;
  userId: number;
  startDate: Date;
  endDate: Date;
  guestCount: number;
  totalPrice: number;
  status: string;
  createdAt: Date;
};

// نوع البيانات للإحصائيات
type Analytics = {
  totalProperties: number;
  totalBookings: number;
  occupancyRate: number;
  totalRevenue: number;
  averageRating: number;
  propertiesWithBookings: {
    id: number;
    title: string;
    bookingsCount: number;
    revenue: number;
    rating: number;
  }[];
};

// مكون لعرض حالة الحجز بألوان مختلفة
const BookingStatusBadge = ({ status }: { status: string }) => {
  const getVariant = () => {
    switch (status) {
      case "confirmed":
        return "success";
      case "pending":
        return "warning";
      case "cancelled":
        return "destructive";
      case "completed":
        return "default";
      default:
        return "secondary";
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "confirmed":
        return "مؤكد";
      case "pending":
        return "قيد الانتظار";
      case "cancelled":
        return "ملغي";
      case "completed":
        return "مكتمل";
      default:
        return status;
    }
  };

  return (
    <Badge variant={getVariant() as any}>{getStatusText()}</Badge>
  );
};

// مكون لعرض معلومات البطاقة
const StatCard = ({ title, value, icon, description }: { title: string; value: string | number; icon: React.ReactNode; description?: string }) => {
  return (
    <Card className="border-muted-foreground/20">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium text-right">{title}</CardTitle>
          <div className="p-2 bg-primary/10 rounded-full">{icon}</div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <CardDescription>{description}</CardDescription>}
      </CardContent>
    </Card>
  );
};

// اسكيلتون للتحميل
const PropertyDashboardSkeleton = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-muted-foreground/20">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-10 rounded-full" />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Tabs defaultValue="properties">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="properties">العقارات</TabsTrigger>
          <TabsTrigger value="bookings">الحجوزات</TabsTrigger>
          <TabsTrigger value="analytics">التحليلات</TabsTrigger>
        </TabsList>
        
        <TabsContent value="properties" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>قائمة العقارات</CardTitle>
                <Skeleton className="h-10 w-32" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex justify-between items-center p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-16 w-16 rounded" />
                      <div>
                        <Skeleton className="h-5 w-40 mb-2" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                    <div>
                      <Skeleton className="h-9 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// المكون الرئيسي للوحة التحكم
const PropertyDashboard = () => {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("properties");

  // التحقق من تسجيل الدخول والصلاحيات
  useEffect(() => {
    if (!user) {
      setLocation("/login");
      return;
    }

    if (user.role !== 'Property_admin' && user.role !== 'super_admin') {
      setLocation("/");
      toast({
        title: "غير مصرح",
        description: "ليس لديك صلاحية الوصول إلى لوحة تحكم مالك العقار",
        variant: "destructive",
      });
    }
  }, [user, setLocation, toast]);

  // جلب العقارات
  const { 
    data: properties,
    isLoading: isLoadingProperties,
    error: propertiesError,
  } = useQuery({
    queryKey: ['/api/property-admin/properties'],
    retry: 1,
  });

  // جلب الحجوزات
  const { 
    data: bookings,
    isLoading: isLoadingBookings,
    error: bookingsError,
  } = useQuery({
    queryKey: ['/api/property-admin/bookings'],
    retry: 1,
  });

  // جلب الإحصائيات
  const { 
    data: analytics,
    isLoading: isLoadingAnalytics,
    error: analyticsError,
  } = useQuery({
    queryKey: ['/api/property-admin/analytics'],
    retry: 1,
  });

  // Mutation لتحديث حالة الحجز
  const updateBookingStatusMutation = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: number, status: string }) => {
      const res = await apiRequest('PATCH', `/api/property-admin/bookings/${bookingId}`, { status });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "تم تحديث الحجز",
        description: "تم تحديث حالة الحجز بنجاح",
      });
      // إعادة جلب بيانات الحجوزات والإحصائيات
      queryClient.invalidateQueries({ queryKey: ['/api/property-admin/bookings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/property-admin/analytics'] });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث حالة الحجز",
        variant: "destructive",
      });
    },
  });

  // Mutation لحذف عقار
  const deletePropertyMutation = useMutation({
    mutationFn: async (propertyId: number) => {
      const res = await apiRequest('DELETE', `/api/property-admin/properties/${propertyId}`, {});
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "تم الحذف",
        description: "تم حذف العقار بنجاح",
      });
      // إعادة جلب بيانات العقارات والإحصائيات
      queryClient.invalidateQueries({ queryKey: ['/api/property-admin/properties'] });
      queryClient.invalidateQueries({ queryKey: ['/api/property-admin/analytics'] });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف العقار",
        variant: "destructive",
      });
    },
  });

  // التعامل مع حذف عقار
  const handleDeleteProperty = (propertyId: number) => {
    if (window.confirm("هل أنت متأكد من حذف هذا العقار؟")) {
      deletePropertyMutation.mutate(propertyId);
    }
  };

  // التعامل مع تغيير حالة الحجز
  const handleBookingStatusChange = (bookingId: number, status: string) => {
    updateBookingStatusMutation.mutate({ bookingId, status });
  };

  // عرض رسالة خطأ إذا فشل جلب البيانات
  if (propertiesError || bookingsError || analyticsError) {
    return (
      <div className="container py-8">
        <div className="bg-destructive/10 p-4 rounded-lg flex items-center gap-3 mb-6">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <p className="text-destructive">حدث خطأ أثناء جلب البيانات. يرجى المحاولة مرة أخرى لاحقًا.</p>
        </div>
        <Button onClick={() => window.location.reload()}>إعادة المحاولة</Button>
      </div>
    );
  }

  // عرض هيكل التحميل أثناء جلب البيانات
  if (isLoadingProperties || isLoadingBookings || isLoadingAnalytics) {
    return (
      <div className="container py-8">
        <PropertyDashboardSkeleton />
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* عنوان اللوحة */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">لوحة تحكم مالك العقار</h1>
          <p className="text-muted-foreground">إدارة عقاراتك وحجوزاتك ومشاهدة الإحصائيات</p>
        </div>
        <Button onClick={() => setLocation("/admin/property/new")} className="mt-4 md:mt-0">
          <PlusCircle className="h-4 w-4 ml-2" />
          إضافة عقار جديد
        </Button>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard 
          title="العقارات" 
          value={analytics?.totalProperties || 0} 
          icon={<Home className="h-5 w-5 text-primary" />} 
          description="إجمالي العقارات المسجلة"
        />
        <StatCard 
          title="الحجوزات" 
          value={analytics?.totalBookings || 0} 
          icon={<CalendarRange className="h-5 w-5 text-primary" />} 
          description="إجمالي الحجوزات"
        />
        <StatCard 
          title="معدل التقييم" 
          value={analytics?.averageRating ? analytics.averageRating.toFixed(1) : "0.0"} 
          icon={<Star className="h-5 w-5 text-primary" />} 
          description="متوسط تقييم العقارات"
        />
        <StatCard 
          title="الإيرادات" 
          value={`$${analytics?.totalRevenue?.toLocaleString() || "0"}`} 
          icon={<LineChart className="h-5 w-5 text-primary" />} 
          description="إجمالي الإيرادات"
        />
      </div>

      {/* علامات التبويب للعقارات، الحجوزات، التحليلات */}
      <Tabs defaultValue="properties" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="properties">العقارات</TabsTrigger>
          <TabsTrigger value="bookings">الحجوزات</TabsTrigger>
          <TabsTrigger value="analytics">التحليلات</TabsTrigger>
        </TabsList>
        
        {/* تبويب العقارات */}
        <TabsContent value="properties" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>قائمة العقارات</CardTitle>
              <CardDescription>إدارة عقاراتك المسجلة في المنصة</CardDescription>
            </CardHeader>
            <CardContent>
              {properties?.length === 0 ? (
                <div className="text-center py-8">
                  <h3 className="text-lg font-medium mb-2">لا توجد عقارات حتى الآن</h3>
                  <p className="text-muted-foreground mb-4">قم بإضافة عقارات جديدة للبدء في استقبال الحجوزات</p>
                  <Button onClick={() => setLocation("/admin/property/new")}>
                    <PlusCircle className="h-4 w-4 ml-2" />
                    إضافة عقار جديد
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {properties?.map((property: Property) => (
                    <div key={property.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-lg">
                      <div className="flex items-center gap-4 mb-4 sm:mb-0">
                        <div className="w-16 h-16 rounded overflow-hidden bg-muted">
                          {property.images && property.images.length > 0 ? (
                            <img 
                              src={property.images[0]} 
                              alt={property.title} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-muted">
                              <Home className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium">{property.title}</h3>
                          <p className="text-sm text-muted-foreground">{property.location}</p>
                          <div className="flex items-center mt-1 gap-4">
                            <Badge variant={property.active ? "default" : "secondary"}>
                              {property.active ? "نشط" : "غير نشط"}
                            </Badge>
                            <span className="text-sm flex items-center">
                              <Star className="h-3 w-3 text-yellow-500 mr-1" />
                              {property.rating || "0.0"}
                            </span>
                            <span className="text-sm text-primary font-medium">
                              ${property.price}/ليلة
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setLocation(`/property/${property.id}`)}
                        >
                          <Eye className="h-4 w-4 ml-1" />
                          عرض
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setLocation(`/admin/property/edit/${property.id}`)}
                        >
                          <Pencil className="h-4 w-4 ml-1" />
                          تعديل
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteProperty(property.id)}
                        >
                          <Trash2 className="h-4 w-4 ml-1" />
                          حذف
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setLocation(`/property/${property.id}/analytics`)}
                        >
                          <LineChart className="h-4 w-4 ml-1" />
                          التحليلات
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* تبويب الحجوزات */}
        <TabsContent value="bookings" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>حجوزات العقارات</CardTitle>
              <CardDescription>إدارة الحجوزات وتحديث حالتها</CardDescription>
            </CardHeader>
            <CardContent>
              {bookings?.length === 0 ? (
                <div className="text-center py-8">
                  <h3 className="text-lg font-medium mb-2">لا توجد حجوزات حتى الآن</h3>
                  <p className="text-muted-foreground">ستظهر الحجوزات الجديدة هنا عندما يقوم المستخدمون بالحجز</p>
                </div>
              ) : (
                <Table>
                  <TableCaption>قائمة بجميع حجوزات عقاراتك</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">رقم الحجز</TableHead>
                      <TableHead className="text-right">العقار</TableHead>
                      <TableHead className="text-right">الضيوف</TableHead>
                      <TableHead className="text-right">تاريخ البداية</TableHead>
                      <TableHead className="text-right">تاريخ النهاية</TableHead>
                      <TableHead className="text-right">المبلغ</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings?.map((booking: Booking) => {
                      // البحث عن عنوان العقار المرتبط بالحجز
                      const property = properties?.find((p: Property) => p.id === booking.propertyId);
                      
                      return (
                        <TableRow key={booking.id}>
                          <TableCell className="font-medium">#{booking.id}</TableCell>
                          <TableCell>{property?.title || `عقار #${booking.propertyId}`}</TableCell>
                          <TableCell>{booking.guestCount}</TableCell>
                          <TableCell>{new Date(booking.startDate).toLocaleDateString('ar-EG')}</TableCell>
                          <TableCell>{new Date(booking.endDate).toLocaleDateString('ar-EG')}</TableCell>
                          <TableCell>${booking.totalPrice}</TableCell>
                          <TableCell>
                            <BookingStatusBadge status={booking.status} />
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                  تحديث الحالة
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>تغيير الحالة</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleBookingStatusChange(booking.id, "pending")}>
                                  قيد الانتظار
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleBookingStatusChange(booking.id, "confirmed")}>
                                  مؤكد
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleBookingStatusChange(booking.id, "completed")}>
                                  مكتمل
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleBookingStatusChange(booking.id, "cancelled")}>
                                  ملغي
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* تبويب التحليلات */}
        <TabsContent value="analytics" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>تحليلات الأداء</CardTitle>
              <CardDescription>إحصائيات وبيانات أداء عقاراتك</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics?.propertiesWithBookings?.length === 0 ? (
                <div className="text-center py-8">
                  <h3 className="text-lg font-medium mb-2">لا توجد بيانات كافية للتحليل</h3>
                  <p className="text-muted-foreground">ستظهر التحليلات هنا عندما تتوفر المزيد من البيانات</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* قسم أداء العقارات */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">أداء العقارات</h3>
                    {analytics?.propertiesWithBookings?.map((propertyStats) => (
                      <div key={propertyStats.id} className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium">{propertyStats.title}</h4>
                          <span className="text-sm text-muted-foreground">{propertyStats.bookingsCount} حجز</span>
                        </div>
                        
                        {/* شريط التقدم للإيرادات */}
                        <div className="mb-4">
                          <div className="flex justify-between text-sm mb-1">
                            <span>الإيرادات</span>
                            <span className="font-medium">${propertyStats.revenue}</span>
                          </div>
                          <Progress value={propertyStats.revenue / (analytics.totalRevenue || 1) * 100} className="h-2" />
                        </div>
                        
                        {/* شريط التقدم للتقييم */}
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>التقييم</span>
                            <span className="font-medium flex items-center">
                              <Star className="h-3 w-3 text-yellow-500 ml-1" />
                              {propertyStats.rating || "0.0"}
                            </span>
                          </div>
                          <Progress value={propertyStats.rating / 5 * 100} className="h-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* قسم إحصائيات إضافية */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">إحصائيات إضافية</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">معدل الإشغال</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold mb-2">{(analytics?.occupancyRate * 100).toFixed(0)}%</div>
                          <Progress value={analytics?.occupancyRate * 100} className="h-2" />
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">متوسط التقييم</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-baseline gap-2">
                            <div className="text-2xl font-bold">{analytics?.averageRating?.toFixed(1) || "0.0"}</div>
                            <div className="text-sm text-muted-foreground">من 5</div>
                          </div>
                          <div className="flex items-center mt-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star 
                                key={star}
                                className={`h-5 w-5 ${star <= Math.round(analytics?.averageRating || 0) ? 'text-yellow-500 fill-yellow-500' : 'text-muted'}`}
                              />
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                  
                  {/* روابط مفيدة */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">روابط مفيدة</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Link href="/admin/property/new">
                        <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                          <CardContent className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                              <PlusCircle className="h-5 w-5 text-primary" />
                              <span>إضافة عقار جديد</span>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          </CardContent>
                        </Card>
                      </Link>
                      
                      <Link href="/admin/settings">
                        <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                          <CardContent className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                              <Settings className="h-5 w-5 text-primary" />
                              <span>إعدادات الحساب</span>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          </CardContent>
                        </Card>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PropertyDashboard;