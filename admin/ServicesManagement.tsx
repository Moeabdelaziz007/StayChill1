import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pen, Plus, Trash2, FileImage, Star, Clock, Utensils } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Service {
  id: number;
  name: string;
  type: 'restaurant' | 'cleaning' | 'delivery' | 'transportation';
  description: string;
  price: number;
  location: string;
  isActive: boolean;
  image: string;
  rating: number;
  createdAt: string;
}

// بيانات وهمية للخدمات
const servicesData: Service[] = [
  {
    id: 1,
    name: "مطعم البحر الأزرق",
    type: "restaurant",
    description: "مطعم مأكولات بحرية فاخر في رأس الحكمة",
    price: 0, // حجز مجاني
    location: "رأس الحكمة",
    isActive: true,
    image: "/images/services/restaurant-1.jpg",
    rating: 4.8,
    createdAt: "2025-01-15"
  },
  {
    id: 2,
    name: "مطعم الواحة",
    type: "restaurant",
    description: "مطعم شرقي تقليدي بإطلالة على البحر",
    price: 0,
    location: "الساحل الشمالي",
    isActive: true,
    image: "/images/services/restaurant-2.jpg",
    rating: 4.5,
    createdAt: "2025-01-20"
  },
  {
    id: 3,
    name: "خدمة تنظيف العقارات",
    type: "cleaning",
    description: "خدمة تنظيف احترافية للعقارات",
    price: 250,
    location: "جميع المواقع",
    isActive: false,
    image: "/images/services/cleaning.jpg",
    rating: 4.2,
    createdAt: "2025-02-05"
  },
  {
    id: 4,
    name: "توصيل الطعام",
    type: "delivery",
    description: "خدمة توصيل طعام من المطاعم المحلية",
    price: 50,
    location: "رأس الحكمة، الساحل الشمالي",
    isActive: false,
    image: "/images/services/delivery.jpg",
    rating: 3.9,
    createdAt: "2025-02-10"
  },
  {
    id: 5,
    name: "استئجار سيارات",
    type: "transportation",
    description: "خدمة تأجير سيارات للإجازات",
    price: 450,
    location: "جميع المواقع",
    isActive: false,
    image: "/images/services/car-rental.jpg",
    rating: 4.0,
    createdAt: "2025-02-15"
  }
];

export function ServicesManagement() {
  const [services, setServices] = useState<Service[]>(servicesData);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newService, setNewService] = useState<Partial<Service>>({
    name: '',
    type: 'restaurant',
    description: '',
    price: 0,
    location: '',
    isActive: true,
    image: '',
    rating: 0
  });

  const getServiceTypeIcon = (type: string) => {
    switch (type) {
      case 'restaurant':
        return <Utensils className="h-4 w-4 text-blue-500" />;
      case 'cleaning':
        return <Trash2 className="h-4 w-4 text-green-500" />;
      case 'delivery':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'transportation':
        return <Trash2 className="h-4 w-4 text-purple-500" />;
      default:
        return <Trash2 className="h-4 w-4" />;
    }
  };

  const getServiceTypeLabel = (type: string) => {
    switch (type) {
      case 'restaurant':
        return 'مطعم';
      case 'cleaning':
        return 'تنظيف';
      case 'delivery':
        return 'توصيل';
      case 'transportation':
        return 'مواصلات';
      default:
        return type;
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">مفعّل</Badge>
    ) : (
      <Badge variant="outline" className="text-gray-500">غير مفعّل</Badge>
    );
  };

  // تصفية الخدمات حسب البحث
  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // إضافة خدمة جديدة
  const handleAddService = () => {
    const newId = services.length > 0 ? Math.max(...services.map(s => s.id)) + 1 : 1;
    const createdService: Service = {
      ...newService as Service,
      id: newId,
      createdAt: new Date().toISOString().split('T')[0]
    };
    
    setServices([...services, createdService]);
    setNewService({
      name: '',
      type: 'restaurant',
      description: '',
      price: 0,
      location: '',
      isActive: true,
      image: '',
      rating: 0
    });
    setIsAddDialogOpen(false);
  };

  // تحديث حالة الخدمة
  const toggleServiceStatus = (id: number) => {
    setServices(services.map(service => 
      service.id === id ? { ...service, isActive: !service.isActive } : service
    ));
  };

  // حذف خدمة
  const deleteService = (id: number) => {
    if (window.confirm('هل أنت متأكد من رغبتك في حذف هذه الخدمة؟')) {
      setServices(services.filter(service => service.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex gap-4 flex-1">
          <Input
            placeholder="البحث عن خدمة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Select defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="تصفية حسب النوع" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الخدمات</SelectItem>
              <SelectItem value="restaurant">المطاعم</SelectItem>
              <SelectItem value="cleaning">خدمات التنظيف</SelectItem>
              <SelectItem value="delivery">خدمات التوصيل</SelectItem>
              <SelectItem value="transportation">خدمات المواصلات</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#00182A] hover:bg-[#002D4A]">
              <Plus className="h-4 w-4 mr-2" />
              إضافة خدمة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>إضافة خدمة جديدة</DialogTitle>
              <DialogDescription>
                أدخل معلومات الخدمة الجديدة للإضافة إلى المنصة
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  اسم الخدمة
                </Label>
                <Input
                  id="name"
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">
                  نوع الخدمة
                </Label>
                <Select
                  value={newService.type}
                  onValueChange={(value) => setNewService({ ...newService, type: value as any })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="اختر نوع الخدمة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="restaurant">مطعم</SelectItem>
                    <SelectItem value="cleaning">خدمة تنظيف</SelectItem>
                    <SelectItem value="delivery">خدمة توصيل</SelectItem>
                    <SelectItem value="transportation">خدمة مواصلات</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  الوصف
                </Label>
                <Textarea
                  id="description"
                  value={newService.description}
                  onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="price" className="text-right">
                  السعر
                </Label>
                <Input
                  id="price"
                  type="number"
                  value={newService.price?.toString()}
                  onChange={(e) => setNewService({ ...newService, price: parseFloat(e.target.value) })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="location" className="text-right">
                  الموقع
                </Label>
                <Input
                  id="location"
                  value={newService.location}
                  onChange={(e) => setNewService({ ...newService, location: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="image" className="text-right">
                  رابط الصورة
                </Label>
                <Input
                  id="image"
                  value={newService.image}
                  onChange={(e) => setNewService({ ...newService, image: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="isActive" className="text-right">
                  الحالة
                </Label>
                <div className="flex items-center col-span-3">
                  <Checkbox
                    id="isActive"
                    checked={newService.isActive}
                    onCheckedChange={(checked) => setNewService({ ...newService, isActive: checked as boolean })}
                  />
                  <Label htmlFor="isActive" className="mr-2">
                    مفعّل
                  </Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>إلغاء</Button>
              <Button 
                onClick={handleAddService} 
                className="bg-[#00182A] hover:bg-[#002D4A]"
                disabled={!newService.name || !newService.description || !newService.location}
              >
                إضافة
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>جميع الخدمات</CardTitle>
          <CardDescription>
            الخدمات المقدمة في المنصة مع المعلومات والإحصائيات
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>قائمة بجميع الخدمات المتاحة</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>الاسم</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>الموقع</TableHead>
                <TableHead>السعر</TableHead>
                <TableHead>التقييم</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="text-left">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredServices.map((service) => (
                <TableRow key={service.id}>
                  <TableCell>{service.id}</TableCell>
                  <TableCell className="font-medium">{service.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {getServiceTypeIcon(service.type)}
                      <span className="mr-2">{getServiceTypeLabel(service.type)}</span>
                    </div>
                  </TableCell>
                  <TableCell>{service.location}</TableCell>
                  <TableCell>
                    {service.price > 0 ? `${service.price} ج.م` : 'مجاني'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-500 mr-1" />
                      {service.rating}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(service.isActive)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2 space-x-reverse">
                      <Button variant="ghost" size="icon" onClick={() => toggleServiceStatus(service.id)}>
                        {service.isActive ? (
                          <Trash2 className="h-4 w-4 text-red-500" />
                        ) : (
                          <Plus className="h-4 w-4 text-green-500" />
                        )}
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Pen className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteService(service.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>إحصائيات الخدمات</CardTitle>
          <CardDescription>
            ملخص عام لإحصائيات الخدمات المقدمة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <Utensils className="h-8 w-8 mx-auto text-blue-500 mb-2" />
              <h3 className="text-lg font-medium">المطاعم</h3>
              <p className="text-3xl font-bold">
                {services.filter(s => s.type === 'restaurant').length}
              </p>
              <p className="text-sm text-muted-foreground">
                {services.filter(s => s.type === 'restaurant' && s.isActive).length} نشط
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <Trash2 className="h-8 w-8 mx-auto text-green-500 mb-2" />
              <h3 className="text-lg font-medium">خدمات التنظيف</h3>
              <p className="text-3xl font-bold">
                {services.filter(s => s.type === 'cleaning').length}
              </p>
              <p className="text-sm text-muted-foreground">
                {services.filter(s => s.type === 'cleaning' && s.isActive).length} نشط
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <Clock className="h-8 w-8 mx-auto text-orange-500 mb-2" />
              <h3 className="text-lg font-medium">خدمات التوصيل</h3>
              <p className="text-3xl font-bold">
                {services.filter(s => s.type === 'delivery').length}
              </p>
              <p className="text-sm text-muted-foreground">
                {services.filter(s => s.type === 'delivery' && s.isActive).length} نشط
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t pt-6">
          <p className="text-sm text-muted-foreground">
            تم تحديث الإحصائيات آخر مرة: {new Date().toLocaleDateString('ar-EG')}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}