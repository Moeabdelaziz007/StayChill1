import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Calendar, 
  User, 
  Home, 
  Filter, 
  XCircle,
  CalendarDays,
  MapPin,
  Search,
  ChevronRight
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export function BookingsManagement() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Fetch bookings
  const { 
    data: bookings,
    isLoading 
  } = useQuery({
    queryKey: ['/api/admin/bookings'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/admin/bookings');
        return await res.json();
      } catch (error) {
        console.error('Error fetching bookings:', error);
        return [];
      }
    }
  });

  // Sample booking data (for development)
  const demoBookings = [
    {
      id: 1,
      propertyName: 'فيلا مع حمام سباحة خاص',
      location: 'راس الحكمة',
      status: 'completed',
      guestName: 'محمد أحمد',
      checkIn: '2025-05-15',
      checkOut: '2025-05-20',
      totalAmount: 5250,
      guestCount: 4,
      paymentMethod: 'بطاقة ائتمان'
    },
    {
      id: 2,
      propertyName: 'شاليه لؤلؤة البحر',
      location: 'الساحل الشمالي',
      status: 'confirmed',
      guestName: 'أحمد محمود',
      checkIn: '2025-06-01',
      checkOut: '2025-06-07',
      totalAmount: 8400,
      guestCount: 6,
      paymentMethod: 'تحويل بنكي'
    },
    {
      id: 3,
      propertyName: 'شقة مطلة على البحر',
      location: 'مرسى مطروح',
      status: 'pending',
      guestName: 'سارة علي',
      checkIn: '2025-07-10',
      checkOut: '2025-07-15',
      totalAmount: 3800,
      guestCount: 2,
      paymentMethod: 'في انتظار الدفع'
    },
    {
      id: 4,
      propertyName: 'منتجع النخيل',
      location: 'راس الحكمة',
      status: 'cancelled',
      guestName: 'خالد محمد',
      checkIn: '2025-06-20',
      checkOut: '2025-06-25',
      totalAmount: 4500,
      guestCount: 3,
      paymentMethod: 'بطاقة ائتمان'
    },
    {
      id: 5,
      propertyName: 'شاليه الصفا',
      location: 'الساحل الشمالي',
      status: 'confirmed',
      guestName: 'ليلى يوسف',
      checkIn: '2025-08-05',
      checkOut: '2025-08-12',
      totalAmount: 9200,
      guestCount: 7,
      paymentMethod: 'بطاقة ائتمان'
    }
  ];

  // Filter bookings based on status and search query
  const filteredBookings = demoBookings.filter(booking => {
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    const matchesSearch = 
      booking.propertyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  // Helper for status badge
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">مؤكد</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">قيد الانتظار</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">مكتمل</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">ملغي</Badge>;
      default:
        return <Badge variant="outline">غير معروف</Badge>;
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('ar-EG', options);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-start">
        <div>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            إدارة الحجوزات
          </CardTitle>
          <CardDescription>
            عرض وإدارة كافة الحجوزات في النظام
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <Filter size={14} /> 
            تصفية متقدمة
          </Button>
          <Button className="bg-[#00182A] hover:bg-[#002D4A]">
            <Calendar className="h-4 w-4 mr-2" />
            تصدير التقرير
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="البحث عن حجز، عقار، أو ضيف..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="حالة الحجز" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحجوزات</SelectItem>
              <SelectItem value="confirmed">مؤكد</SelectItem>
              <SelectItem value="pending">قيد الانتظار</SelectItem>
              <SelectItem value="completed">مكتمل</SelectItem>
              <SelectItem value="cancelled">ملغي</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="all" className="mb-6">
          <TabsList>
            <TabsTrigger value="all">جميع الحجوزات ({demoBookings.length})</TabsTrigger>
            <TabsTrigger value="today">اليوم (0)</TabsTrigger>
            <TabsTrigger value="upcoming">القادمة (3)</TabsTrigger>
            <TabsTrigger value="past">السابقة (2)</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">رقم الحجز</TableHead>
                <TableHead>العقار</TableHead>
                <TableHead>اسم الضيف</TableHead>
                <TableHead>تاريخ الوصول</TableHead>
                <TableHead>تاريخ المغادرة</TableHead>
                <TableHead>المبلغ الإجمالي</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="text-right">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Loading skeleton
                Array(5).fill(null).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-20 float-right" /></TableCell>
                  </TableRow>
                ))
              ) : filteredBookings.length > 0 ? (
                // Booking data
                filteredBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">#{booking.id}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{booking.propertyName}</span>
                        <span className="text-xs text-muted-foreground flex items-center">
                          <MapPin size={12} className="mr-1" /> {booking.location}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                          <User size={14} />
                        </div>
                        <div>
                          <div className="font-medium">{booking.guestName}</div>
                          <div className="text-xs text-muted-foreground">{booking.guestCount} ضيوف</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <CalendarDays size={14} className="text-green-500" />
                        <span>{formatDate(booking.checkIn)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <CalendarDays size={14} className="text-red-500" />
                        <span>{formatDate(booking.checkOut)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{booking.totalAmount.toLocaleString()} جنيه</div>
                      <div className="text-xs text-muted-foreground">{booking.paymentMethod}</div>
                    </TableCell>
                    <TableCell>{getStatusBadge(booking.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" className="h-8">
                        التفاصيل <ChevronRight size={14} className="mr-1" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                // Empty state
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Calendar className="h-10 w-10 mb-2" />
                      <p>لا توجد حجوزات {statusFilter !== 'all' ? "بهذه الحالة" : ""}</p>
                      {searchQuery && <p className="text-sm">حاول تغيير معايير البحث</p>}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 flex justify-between items-center text-sm text-muted-foreground">
          <div>عرض 1-{filteredBookings.length} من إجمالي {demoBookings.length} حجز</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>السابق</Button>
            <Button variant="outline" size="sm" disabled>التالي</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}