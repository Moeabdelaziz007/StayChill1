import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  CreditCard, 
  Filter, 
  Download, 
  ArrowDown, 
  ArrowUp, 
  DollarSign, 
  Calendar,
  Search,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCcw,
  User,
  Receipt
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export function PaymentsManagement() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Fetch payments
  const { 
    data: payments,
    isLoading 
  } = useQuery({
    queryKey: ['/api/admin/payments'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/admin/payments');
        return await res.json();
      } catch (error) {
        console.error('Error fetching payments:', error);
        return [];
      }
    }
  });

  // Sample payment data (for development)
  const demoPayments = [
    {
      id: "P123456",
      date: "2025-04-15",
      amount: 5250,
      bookingId: 1,
      customerName: "محمد أحمد",
      paymentMethod: "بطاقة ائتمان",
      status: "completed",
      type: "booking",
      description: "حجز فيلا مع حمام سباحة خاص"
    },
    {
      id: "P123457",
      date: "2025-04-18",
      amount: 8400,
      bookingId: 2,
      customerName: "أحمد محمود",
      paymentMethod: "تحويل بنكي",
      status: "completed",
      type: "booking",
      description: "حجز شاليه لؤلؤة البحر"
    },
    {
      id: "P123458",
      date: "2025-04-19",
      amount: 3800,
      bookingId: 3,
      customerName: "سارة علي",
      paymentMethod: "بطاقة ائتمان",
      status: "pending",
      type: "booking",
      description: "حجز شقة مطلة على البحر"
    },
    {
      id: "P123459",
      date: "2025-04-20",
      amount: 1500,
      bookingId: null,
      customerName: "مصطفى كمال",
      paymentMethod: "نقدي",
      status: "completed",
      type: "service",
      description: "خدمة تنظيف"
    },
    {
      id: "P123460",
      date: "2025-04-20",
      amount: 2100,
      bookingId: null,
      customerName: "ليلى يوسف",
      paymentMethod: "بطاقة ائتمان",
      status: "refunded",
      type: "booking",
      description: "إلغاء حجز منتجع النخيل"
    }
  ];

  // Filter payments based on status and search query
  const filteredPayments = demoPayments.filter(payment => {
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    const matchesSearch = 
      payment.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  // Helper for status badge
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">مكتمل</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">قيد المعالجة</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">فشل</Badge>;
      case 'refunded':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">مسترد</Badge>;
      default:
        return <Badge variant="outline">غير معروف</Badge>;
    }
  };

  // Helper for payment icon
  const getPaymentIcon = (method: string) => {
    switch(method) {
      case 'بطاقة ائتمان':
        return <CreditCard size={16} className="text-blue-600" />;
      case 'تحويل بنكي':
        return <ArrowDown size={16} className="text-green-600" />;
      case 'نقدي':
        return <DollarSign size={16} className="text-amber-600" />;
      default:
        return <DollarSign size={16} className="text-gray-400" />;
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('ar-EG', options);
  };

  // Statistics calculation
  const totalAmount = demoPayments.reduce((acc, payment) => 
    payment.status === 'completed' ? acc + payment.amount : acc, 0);
  
  const pendingAmount = demoPayments.reduce((acc, payment) => 
    payment.status === 'pending' ? acc + payment.amount : acc, 0);
  
  const refundedAmount = demoPayments.reduce((acc, payment) => 
    payment.status === 'refunded' ? acc + payment.amount : acc, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-start">
        <div>
          <CardTitle className="flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            إدارة المدفوعات
          </CardTitle>
          <CardDescription>
            عرض وإدارة كافة المدفوعات والمعاملات المالية
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <Download size={14} /> 
            تصدير
          </Button>
          <Button className="bg-[#00182A] hover:bg-[#002D4A]">
            <Receipt className="h-4 w-4 mr-2" />
            إنشاء فاتورة
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Payment Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي المدفوعات</p>
                <p className="text-2xl font-bold">{totalAmount.toLocaleString()} جنيه</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <ArrowUp className="h-5 w-5 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">قيد المعالجة</p>
                <p className="text-2xl font-bold">{pendingAmount.toLocaleString()} جنيه</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">المبالغ المستردة</p>
                <p className="text-2xl font-bold">{refundedAmount.toLocaleString()} جنيه</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <RefreshCcw className="h-5 w-5 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="البحث برقم المعاملة، العميل، أو الوصف..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="حالة المعاملة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع المعاملات</SelectItem>
              <SelectItem value="completed">مكتملة</SelectItem>
              <SelectItem value="pending">قيد المعالجة</SelectItem>
              <SelectItem value="failed">فاشلة</SelectItem>
              <SelectItem value="refunded">مستردة</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="all" className="mb-6">
          <TabsList>
            <TabsTrigger value="all">جميع المعاملات ({demoPayments.length})</TabsTrigger>
            <TabsTrigger value="bookings">الحجوزات (4)</TabsTrigger>
            <TabsTrigger value="services">الخدمات (1)</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم المعاملة</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead>الوصف</TableHead>
                <TableHead>العميل</TableHead>
                <TableHead>طريقة الدفع</TableHead>
                <TableHead>المبلغ</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="text-right">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Loading skeleton
                Array(5).fill(null).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-20 float-right" /></TableCell>
                  </TableRow>
                ))
              ) : filteredPayments.length > 0 ? (
                // Payment data
                filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{payment.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar size={14} className="text-gray-500" />
                        <span>{formatDate(payment.date)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px] truncate" title={payment.description}>
                        {payment.description}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                          <User size={14} />
                        </div>
                        <span>{payment.customerName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getPaymentIcon(payment.paymentMethod)}
                        <span>{payment.paymentMethod}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`font-bold ${payment.status === 'refunded' ? 'text-blue-600' : ''}`}>
                        {payment.status === 'refunded' ? '- ' : ''}{payment.amount.toLocaleString()} جنيه
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" className="h-8">
                        عرض <ChevronRight size={14} className="mr-1" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                // Empty state
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Receipt className="h-10 w-10 mb-2" />
                      <p>لا توجد معاملات {statusFilter !== 'all' ? "بهذه الحالة" : ""}</p>
                      {searchQuery && <p className="text-sm">حاول تغيير معايير البحث</p>}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 flex justify-between items-center text-sm text-muted-foreground">
          <div>عرض 1-{filteredPayments.length} من إجمالي {demoPayments.length} معاملة</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>السابق</Button>
            <Button variant="outline" size="sm" disabled>التالي</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}