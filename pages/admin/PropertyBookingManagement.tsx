import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  Home, 
  CalendarRange, 
  Edit, 
  Trash2, 
  XCircle, 
  Check, 
  Clock,
  Filter,
  User,
  Map,
  CheckCircle,
  XCircle as Cancel,
  RefreshCcw
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  getFirestore, 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc,
  where,
  getDoc,
  Timestamp 
} from "firebase/firestore";

// أنواع البيانات
interface Property {
  id: string;
  title: string;
  description: string;
  location: string;
  price: number;
  images: string[];
  userId: string; // معرف المالك
  ownerName?: string; // سيتم إضافته بعد جلب البيانات
  ownerEmail?: string; // سيتم إضافته بعد جلب البيانات
  active: boolean;
  featured: boolean;
  createdAt: Date;
}

interface Booking {
  id: string;
  userId: string;
  propertyId: string;
  startDate: Date;
  endDate: Date;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: Date;
  userName?: string; // سيتم إضافته بعد جلب البيانات
  propertyTitle?: string; // سيتم إضافته بعد جلب البيانات
}

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

// تحويل حالة الحجز إلى نص عربي
const getBookingStatusLabel = (status: string): string => {
  switch (status) {
    case 'pending':
      return 'قيد الانتظار';
    case 'confirmed':
      return 'مؤكد';
    case 'cancelled':
      return 'ملغي';
    default:
      return 'غير معروف';
  }
};

// تحويل حالة الحجز إلى لون البادج
const getBookingStatusColor = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case 'pending':
      return 'secondary';
    case 'confirmed':
      return 'default';
    case 'cancelled':
      return 'destructive';
    default:
      return 'outline';
  }
};

const PropertyBookingManagement = () => {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // حالة البيانات
  const [properties, setProperties] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  
  // حالة التصفية
  const [propertySearchTerm, setPropertySearchTerm] = useState("");
  const [bookingSearchTerm, setBookingSearchTerm] = useState("");
  const [activePropertyFilter, setActivePropertyFilter] = useState<string>("all");
  const [bookingStatusFilter, setBookingStatusFilter] = useState<string>("all");
  
  // حالة التحميل والأخطاء
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // حالة العمليات
  const [processingProperty, setProcessingProperty] = useState<string | null>(null);
  const [processingBooking, setProcessingBooking] = useState<string | null>(null);
  
  // حالة الحوار
  const [confirmDelete, setConfirmDelete] = useState<{type: 'property' | 'booking', id: string} | null>(null);
  
  useEffect(() => {
    // تحقق من وجود المستخدم وصلاحياته
    if (!user) {
      setLocation("/login");
      return;
    }

    if (user.role !== "super_admin") {
      setLocation("/");
      return;
    }

    // الاتصال بقاعدة البيانات
    const db = getFirestore();
    
    // جلب بيانات المستخدمين
    const usersRef = collection(db, "users");
    const unsubscribeUsers = onSnapshot(
      usersRef,
      (snapshot) => {
        const usersData: User[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          usersData.push({
            id: doc.id,
            username: data.username || 'بدون اسم مستخدم',
            email: data.email || 'بدون بريد إلكتروني',
            role: data.role || 'user'
          });
        });
        setUsers(usersData);
      },
      (err) => {
        console.error("Error fetching users:", err);
        setError("حدث خطأ في جلب بيانات المستخدمين");
      }
    );
    
    // جلب بيانات العقارات
    const propertiesRef = collection(db, "properties");
    const unsubscribeProperties = onSnapshot(
      propertiesRef,
      (snapshot) => {
        const propertiesData: Property[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          
          // تحويل التواريخ إلى كائنات Date
          let createdAt = new Date();
          if (data.createdAt) {
            createdAt = data.createdAt instanceof Timestamp 
              ? data.createdAt.toDate() 
              : new Date(data.createdAt);
          }
          
          propertiesData.push({
            id: doc.id,
            title: data.title || 'بدون عنوان',
            description: data.description || '',
            location: data.location || 'غير محدد',
            price: data.price || 0,
            images: data.images || [],
            userId: data.userId || '',
            active: data.active !== undefined ? data.active : true,
            featured: data.featured || false,
            createdAt
          });
        });
        
        // إضافة بيانات المالك لكل عقار
        const propertiesWithOwnerInfo = propertiesData.map(property => {
          const owner = users.find(u => u.id === property.userId);
          if (owner) {
            return {
              ...property,
              ownerName: owner.username,
              ownerEmail: owner.email
            };
          }
          return property;
        });
        
        // ترتيب العقارات حسب تاريخ الإنشاء تنازلياً
        propertiesWithOwnerInfo.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        
        setProperties(propertiesWithOwnerInfo);
        setFilteredProperties(propertiesWithOwnerInfo);
        setLoadingProperties(false);
      },
      (err) => {
        console.error("Error fetching properties:", err);
        setError("حدث خطأ في جلب بيانات العقارات");
        setLoadingProperties(false);
      }
    );
    
    // جلب بيانات الحجوزات
    const bookingsRef = collection(db, "bookings");
    const unsubscribeBookings = onSnapshot(
      bookingsRef,
      (snapshot) => {
        const bookingsData: Booking[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          
          // تحويل التواريخ إلى كائنات Date
          let startDate = new Date();
          let endDate = new Date();
          let createdAt = new Date();
          
          if (data.startDate) {
            startDate = data.startDate instanceof Timestamp 
              ? data.startDate.toDate() 
              : new Date(data.startDate);
          }
          
          if (data.endDate) {
            endDate = data.endDate instanceof Timestamp 
              ? data.endDate.toDate() 
              : new Date(data.endDate);
          }
          
          if (data.createdAt) {
            createdAt = data.createdAt instanceof Timestamp 
              ? data.createdAt.toDate() 
              : new Date(data.createdAt);
          }
          
          bookingsData.push({
            id: doc.id,
            userId: data.userId || '',
            propertyId: data.propertyId || '',
            startDate,
            endDate,
            totalPrice: data.totalPrice || 0,
            status: data.status || 'pending',
            createdAt
          });
        });
        
        setBookings(bookingsData);
        setFilteredBookings(bookingsData);
        setLoadingBookings(false);
      },
      (err) => {
        console.error("Error fetching bookings:", err);
        setError("حدث خطأ في جلب بيانات الحجوزات");
        setLoadingBookings(false);
      }
    );
    
    // إلغاء الاشتراك في المراقبة عند إزالة المكون
    return () => {
      unsubscribeUsers();
      unsubscribeProperties();
      unsubscribeBookings();
    };
  }, [user, setLocation]);
  
  // تحديث بيانات الحجوزات والعقارات عند تحديث بيانات المستخدمين
  useEffect(() => {
    // إضافة بيانات المالك لكل عقار
    const propertiesWithOwnerInfo = properties.map(property => {
      const owner = users.find(u => u.id === property.userId);
      if (owner) {
        return {
          ...property,
          ownerName: owner.username,
          ownerEmail: owner.email
        };
      }
      return property;
    });
    
    setProperties(propertiesWithOwnerInfo);
    
    // إضافة بيانات المستخدم والعقار لكل حجز
    const bookingsWithUserAndPropertyInfo = bookings.map(booking => {
      const bookingUser = users.find(u => u.id === booking.userId);
      const bookingProperty = properties.find(p => p.id === booking.propertyId);
      
      return {
        ...booking,
        userName: bookingUser?.username,
        propertyTitle: bookingProperty?.title
      };
    });
    
    setBookings(bookingsWithUserAndPropertyInfo);
  }, [users, properties.length, bookings.length]);
  
  // تصفية العقارات عند تغيير مصطلح البحث أو فلتر الحالة
  useEffect(() => {
    let filtered = [...properties];
    
    // تصفية حسب نص البحث
    if (propertySearchTerm.trim() !== "") {
      filtered = filtered.filter(
        property => 
          property.title.toLowerCase().includes(propertySearchTerm.toLowerCase()) ||
          property.location.toLowerCase().includes(propertySearchTerm.toLowerCase()) ||
          (property.ownerName && property.ownerName.toLowerCase().includes(propertySearchTerm.toLowerCase())) ||
          (property.ownerEmail && property.ownerEmail.toLowerCase().includes(propertySearchTerm.toLowerCase()))
      );
    }
    
    // تصفية حسب الحالة
    if (activePropertyFilter !== "all") {
      const isActive = activePropertyFilter === "active";
      filtered = filtered.filter(property => property.active === isActive);
    }
    
    setFilteredProperties(filtered);
  }, [propertySearchTerm, activePropertyFilter, properties]);
  
  // تصفية الحجوزات عند تغيير مصطلح البحث أو فلتر الحالة
  useEffect(() => {
    let filtered = [...bookings];
    
    // تصفية حسب نص البحث
    if (bookingSearchTerm.trim() !== "") {
      filtered = filtered.filter(
        booking => 
          (booking.userName && booking.userName.toLowerCase().includes(bookingSearchTerm.toLowerCase())) ||
          (booking.propertyTitle && booking.propertyTitle.toLowerCase().includes(bookingSearchTerm.toLowerCase()))
      );
    }
    
    // تصفية حسب الحالة
    if (bookingStatusFilter !== "all") {
      filtered = filtered.filter(booking => booking.status === bookingStatusFilter);
    }
    
    setFilteredBookings(filtered);
  }, [bookingSearchTerm, bookingStatusFilter, bookings]);
  
  // توجيه إلى صفحة تعديل العقار
  const navigateToEditProperty = (propertyId: string) => {
    setLocation(`/admin/properties/edit/${propertyId}`);
  };
  
  // تغيير حالة العقار (تفعيل/تعطيل)
  const togglePropertyActive = async (propertyId: string, currentActive: boolean) => {
    try {
      setProcessingProperty(propertyId);
      const db = getFirestore();
      const propertyRef = doc(db, "properties", propertyId);
      
      await updateDoc(propertyRef, {
        active: !currentActive
      });
      
      toast({
        title: currentActive ? "تم تعطيل العقار" : "تم تفعيل العقار",
        description: currentActive 
          ? "تم تعطيل العقار بنجاح، ولن يظهر في نتائج البحث" 
          : "تم تفعيل العقار بنجاح، وسيظهر في نتائج البحث"
      });
    } catch (err) {
      console.error("Error toggling property active status:", err);
      toast({
        title: "فشل في تغيير حالة العقار",
        description: "حدث خطأ أثناء تغيير حالة العقار",
        variant: "destructive"
      });
    } finally {
      setProcessingProperty(null);
    }
  };
  
  // حذف عقار
  const deleteProperty = async (propertyId: string) => {
    try {
      setProcessingProperty(propertyId);
      const db = getFirestore();
      const propertyRef = doc(db, "properties", propertyId);
      
      // حذف العقار
      await deleteDoc(propertyRef);
      
      // بحث عن الحجوزات المرتبطة بهذا العقار وتغيير حالتها إلى ملغية
      const bookingsToUpdate = bookings.filter(b => b.propertyId === propertyId);
      
      for (const booking of bookingsToUpdate) {
        const bookingRef = doc(db, "bookings", booking.id);
        await updateDoc(bookingRef, { status: 'cancelled' });
      }
      
      toast({
        title: "تم حذف العقار",
        description: `تم حذف العقار بنجاح وإلغاء ${bookingsToUpdate.length} حجز مرتبط به`
      });
      
      setConfirmDelete(null);
    } catch (err) {
      console.error("Error deleting property:", err);
      toast({
        title: "فشل في حذف العقار",
        description: "حدث خطأ أثناء حذف العقار",
        variant: "destructive"
      });
    } finally {
      setProcessingProperty(null);
    }
  };
  
  // تغيير حالة الحجز
  const updateBookingStatus = async (bookingId: string, newStatus: 'pending' | 'confirmed' | 'cancelled') => {
    try {
      setProcessingBooking(bookingId);
      const db = getFirestore();
      const bookingRef = doc(db, "bookings", bookingId);
      
      await updateDoc(bookingRef, {
        status: newStatus
      });
      
      const statusLabels = {
        pending: "قيد الانتظار",
        confirmed: "مؤكد",
        cancelled: "ملغي"
      };
      
      toast({
        title: "تم تحديث حالة الحجز",
        description: `تم تغيير حالة الحجز إلى ${statusLabels[newStatus]}`
      });
    } catch (err) {
      console.error("Error updating booking status:", err);
      toast({
        title: "فشل في تحديث حالة الحجز",
        description: "حدث خطأ أثناء تحديث حالة الحجز",
        variant: "destructive"
      });
    } finally {
      setProcessingBooking(null);
    }
  };
  
  // حذف حجز
  const deleteBooking = async (bookingId: string) => {
    try {
      setProcessingBooking(bookingId);
      const db = getFirestore();
      const bookingRef = doc(db, "bookings", bookingId);
      
      await deleteDoc(bookingRef);
      
      toast({
        title: "تم حذف الحجز",
        description: "تم حذف الحجز بنجاح"
      });
      
      setConfirmDelete(null);
    } catch (err) {
      console.error("Error deleting booking:", err);
      toast({
        title: "فشل في حذف الحجز",
        description: "حدث خطأ أثناء حذف الحجز",
        variant: "destructive"
      });
    } finally {
      setProcessingBooking(null);
    }
  };
  
  // عرض رسالة التحميل
  if (loadingProperties || loadingBookings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // عرض رسالة الخطأ
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-500 mb-4">{error}</div>
        <Button onClick={() => window.location.reload()}>إعادة المحاولة</Button>
      </div>
    );
  }
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">إدارة العقارات والحجوزات</h1>
      
      {/* علامات التبويب للتنقل بين العقارات والحجوزات */}
      <Tabs defaultValue="properties" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="properties" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            العقارات ({properties.length})
          </TabsTrigger>
          <TabsTrigger value="bookings" className="flex items-center gap-2">
            <CalendarRange className="h-4 w-4" />
            الحجوزات ({bookings.length})
          </TabsTrigger>
        </TabsList>
        
        {/* محتوى علامة تبويب العقارات */}
        <TabsContent value="properties">
          <Card>
            <CardHeader>
              <CardTitle>جميع العقارات</CardTitle>
              <CardDescription>
                عرض وإدارة جميع العقارات في النظام
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 gap-4 mb-4">
                <div className="w-full md:w-1/2">
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="بحث عن عقار..."
                      value={propertySearchTerm}
                      onChange={(e) => setPropertySearchTerm(e.target.value)}
                      className="flex-1 ml-2"
                    />
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setPropertySearchTerm("")}
                    >
                      <RefreshCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="active-filter" className="mr-2 whitespace-nowrap">فلترة حسب الحالة:</Label>
                  <Select
                    value={activePropertyFilter}
                    onValueChange={setActivePropertyFilter}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="جميع العقارات" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع العقارات</SelectItem>
                      <SelectItem value="active">العقارات المفعلة</SelectItem>
                      <SelectItem value="inactive">العقارات المعطلة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">العقار</TableHead>
                      <TableHead className="text-right">المالك</TableHead>
                      <TableHead className="text-right">الموقع</TableHead>
                      <TableHead className="text-right">السعر</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProperties.length > 0 ? (
                      filteredProperties.map((property) => (
                        <TableRow key={property.id} className={!property.active ? "bg-muted/40" : ""}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {property.images && property.images.length > 0 ? (
                                <div className="w-10 h-10 rounded bg-gray-200 overflow-hidden">
                                  <img 
                                    src={property.images[0]} 
                                    alt={property.title} 
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center">
                                  <Home className="h-5 w-5 text-gray-500" />
                                </div>
                              )}
                              <div>
                                <div className="font-medium">{property.title}</div>
                                <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                  {property.description}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div>{property.ownerName || 'غير معروف'}</div>
                                <div className="text-xs text-muted-foreground">
                                  {property.ownerEmail || ''}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Map className="h-4 w-4 text-muted-foreground" />
                              <span>{property.location}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Intl.NumberFormat('ar-EG', { 
                              style: 'currency', 
                              currency: 'EGP' 
                            }).format(property.price)}
                          </TableCell>
                          <TableCell>
                            {property.active ? (
                              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                                مفعّل
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
                                معطّل
                              </Badge>
                            )}
                            {property.featured && (
                              <Badge variant="secondary" className="mr-2">
                                مميز
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => navigateToEditProperty(property.id)}
                                disabled={processingProperty === property.id}
                                className="h-8 w-8"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant={property.active ? "default" : "secondary"}
                                size="icon"
                                onClick={() => togglePropertyActive(property.id, property.active)}
                                disabled={processingProperty === property.id}
                                className="h-8 w-8"
                              >
                                {processingProperty === property.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : property.active ? (
                                  <XCircle className="h-4 w-4" />
                                ) : (
                                  <Check className="h-4 w-4" />
                                )}
                              </Button>
                              <Dialog open={confirmDelete?.type === 'property' && confirmDelete.id === property.id} onOpenChange={(open) => {
                                if (!open) setConfirmDelete(null);
                              }}>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="destructive"
                                    size="icon"
                                    onClick={() => setConfirmDelete({ type: 'property', id: property.id })}
                                    disabled={processingProperty === property.id}
                                    className="h-8 w-8"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>تأكيد حذف العقار</DialogTitle>
                                    <DialogDescription>
                                      هل أنت متأكد من حذف هذا العقار؟ سيتم أيضًا إلغاء جميع الحجوزات المرتبطة به. هذا الإجراء لا يمكن التراجع عنه.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <DialogFooter>
                                    <DialogClose asChild>
                                      <Button variant="outline">إلغاء</Button>
                                    </DialogClose>
                                    <Button 
                                      variant="destructive" 
                                      onClick={() => deleteProperty(property.id)}
                                      disabled={processingProperty === property.id}
                                    >
                                      {processingProperty === property.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                      ) : null}
                                      تأكيد الحذف
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                          لا توجد عقارات متطابقة مع الفلتر المحدد
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                إجمالي العقارات: {properties.length} | المعروضة: {filteredProperties.length}
              </div>
              <Button variant="outline" onClick={() => setLocation("/admin/properties/new")}>
                إضافة عقار جديد
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* محتوى علامة تبويب الحجوزات */}
        <TabsContent value="bookings">
          <Card>
            <CardHeader>
              <CardTitle>جميع الحجوزات</CardTitle>
              <CardDescription>
                عرض وإدارة جميع الحجوزات في النظام
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 gap-4 mb-4">
                <div className="w-full md:w-1/2">
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="بحث عن حجز..."
                      value={bookingSearchTerm}
                      onChange={(e) => setBookingSearchTerm(e.target.value)}
                      className="flex-1 ml-2"
                    />
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setBookingSearchTerm("")}
                    >
                      <RefreshCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="status-filter" className="mr-2 whitespace-nowrap">فلترة حسب الحالة:</Label>
                  <Select
                    value={bookingStatusFilter}
                    onValueChange={setBookingStatusFilter}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="جميع الحجوزات" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الحجوزات</SelectItem>
                      <SelectItem value="pending">قيد الانتظار</SelectItem>
                      <SelectItem value="confirmed">مؤكدة</SelectItem>
                      <SelectItem value="cancelled">ملغية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">المستخدم</TableHead>
                      <TableHead className="text-right">العقار</TableHead>
                      <TableHead className="text-right">تاريخ الوصول</TableHead>
                      <TableHead className="text-right">تاريخ المغادرة</TableHead>
                      <TableHead className="text-right">السعر الكلي</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.length > 0 ? (
                      filteredBookings.map((booking) => (
                        <TableRow 
                          key={booking.id} 
                          className={
                            booking.status === 'cancelled' 
                              ? "bg-muted/40" 
                              : booking.status === 'pending' 
                                ? "bg-amber-50/40 dark:bg-amber-900/10" 
                                : ""
                          }
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span>{booking.userName || 'غير معروف'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {booking.propertyTitle || 'غير معروف'}
                          </TableCell>
                          <TableCell>
                            {booking.startDate.toLocaleDateString('ar-EG')}
                          </TableCell>
                          <TableCell>
                            {booking.endDate.toLocaleDateString('ar-EG')}
                          </TableCell>
                          <TableCell>
                            {new Intl.NumberFormat('ar-EG', { 
                              style: 'currency', 
                              currency: 'EGP' 
                            }).format(booking.totalPrice)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getBookingStatusColor(booking.status)}>
                              {getBookingStatusLabel(booking.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              {booking.status === 'pending' && (
                                <Button
                                  variant="default"
                                  size="icon"
                                  onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                                  disabled={processingBooking === booking.id}
                                  className="h-8 w-8"
                                  title="تأكيد الحجز"
                                >
                                  {processingBooking === booking.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <CheckCircle className="h-4 w-4" />
                                  )}
                                </Button>
                              )}
                              
                              {booking.status !== 'cancelled' && (
                                <Button
                                  variant="secondary"
                                  size="icon"
                                  onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                                  disabled={processingBooking === booking.id}
                                  className="h-8 w-8"
                                  title="إلغاء الحجز"
                                >
                                  {processingBooking === booking.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Cancel className="h-4 w-4" />
                                  )}
                                </Button>
                              )}
                              
                              <Dialog open={confirmDelete?.type === 'booking' && confirmDelete.id === booking.id} onOpenChange={(open) => {
                                if (!open) setConfirmDelete(null);
                              }}>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="destructive"
                                    size="icon"
                                    onClick={() => setConfirmDelete({ type: 'booking', id: booking.id })}
                                    disabled={processingBooking === booking.id}
                                    className="h-8 w-8"
                                    title="حذف الحجز"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>تأكيد حذف الحجز</DialogTitle>
                                    <DialogDescription>
                                      هل أنت متأكد من حذف هذا الحجز؟ هذا الإجراء لا يمكن التراجع عنه.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <DialogFooter>
                                    <DialogClose asChild>
                                      <Button variant="outline">إلغاء</Button>
                                    </DialogClose>
                                    <Button 
                                      variant="destructive" 
                                      onClick={() => deleteBooking(booking.id)}
                                      disabled={processingBooking === booking.id}
                                    >
                                      {processingBooking === booking.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                      ) : null}
                                      تأكيد الحذف
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                          لا توجد حجوزات متطابقة مع الفلتر المحدد
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                إجمالي الحجوزات: {bookings.length} | المعروضة: {filteredBookings.length}
              </div>
              <div className="flex gap-2 text-sm text-muted-foreground">
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                  مؤكدة: {bookings.filter(b => b.status === 'confirmed').length}
                </Badge>
                <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
                  قيد الانتظار: {bookings.filter(b => b.status === 'pending').length}
                </Badge>
                <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                  ملغية: {bookings.filter(b => b.status === 'cancelled').length}
                </Badge>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PropertyBookingManagement;