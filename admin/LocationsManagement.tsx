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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Check, Pen, Plus, Trash2, Image, Eye, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Location {
  id: number;
  name: string;
  description: string;
  image: string;
  propertiesCount: number;
  isActive: boolean;
  coordinates: {
    lat: number;
    lng: number;
  };
}

// بيانات وهمية للمواقع
const locationsData: Location[] = [
  {
    id: 1,
    name: "رأس الحكمة",
    description: "وجهة ساحلية خلابة على البحر المتوسط بمياه صافية وشواطئ رملية ناعمة",
    image: "/images/locations/ras-el-hekma.jpg",
    propertiesCount: 45,
    isActive: true,
    coordinates: {
      lat: 30.9464,
      lng: 28.4372
    }
  },
  {
    id: 2,
    name: "الساحل الشمالي",
    description: "منطقة ساحلية شهيرة تمتد على طول الساحل الشمالي لمصر",
    image: "/images/locations/north-coast.jpg",
    propertiesCount: 67,
    isActive: true,
    coordinates: {
      lat: 31.0409,
      lng: 29.7500
    }
  },
  {
    id: 3,
    name: "شرم الشيخ",
    description: "منتجع شهير عالمياً يطل على البحر الأحمر ومعروف بالشعاب المرجانية الخلابة",
    image: "/images/locations/sharm-el-sheikh.jpg",
    propertiesCount: 52,
    isActive: true,
    coordinates: {
      lat: 27.9158,
      lng: 34.3300
    }
  },
  {
    id: 4,
    name: "مارينا",
    description: "منتجع راقٍ على البحر المتوسط مع مرسى لليخوت ومجموعة من المطاعم والمتاجر الفاخرة",
    image: "/images/locations/marina.jpg",
    propertiesCount: 38,
    isActive: true,
    coordinates: {
      lat: 30.8225,
      lng: 29.0343
    }
  },
  {
    id: 5,
    name: "مرسى مطروح",
    description: "مدينة ساحلية جميلة تشتهر بشواطئها ذات المياه الفيروزية والرمال البيضاء",
    image: "/images/locations/marsa-matrouh.jpg",
    propertiesCount: 29,
    isActive: true,
    coordinates: {
      lat: 31.3543,
      lng: 27.2373
    }
  }
];

export function LocationsManagement() {
  const [locations, setLocations] = useState<Location[]>(locationsData);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newLocation, setNewLocation] = useState<Partial<Location>>({
    name: '',
    description: '',
    image: '',
    isActive: true,
    propertiesCount: 0,
    coordinates: {
      lat: 0,
      lng: 0
    }
  });

  // تصفية المواقع حسب البحث
  const filteredLocations = locations.filter(location =>
    location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // إضافة موقع جديد
  const handleAddLocation = () => {
    const newId = locations.length > 0 ? Math.max(...locations.map(loc => loc.id)) + 1 : 1;
    const createdLocation: Location = {
      ...newLocation as Location,
      id: newId,
    };
    
    setLocations([...locations, createdLocation]);
    setNewLocation({
      name: '',
      description: '',
      image: '',
      isActive: true,
      propertiesCount: 0,
      coordinates: {
        lat: 0,
        lng: 0
      }
    });
    setIsAddDialogOpen(false);
  };

  // تبديل حالة الموقع (نشط/غير نشط)
  const toggleLocationStatus = (id: number) => {
    setLocations(locations.map(location => 
      location.id === id ? { ...location, isActive: !location.isActive } : location
    ));
  };

  // حذف موقع
  const deleteLocation = (id: number) => {
    if (window.confirm('هل أنت متأكد من رغبتك في حذف هذا الموقع؟')) {
      setLocations(locations.filter(location => location.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Input
          placeholder="البحث عن موقع..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#00182A] hover:bg-[#002D4A]">
              <Plus className="h-4 w-4 mr-2" />
              إضافة موقع جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>إضافة موقع جديد</DialogTitle>
              <DialogDescription>
                أدخل معلومات الموقع الجديد لإضافته إلى المنصة
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  اسم الموقع
                </Label>
                <Input
                  id="name"
                  value={newLocation.name}
                  onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  الوصف
                </Label>
                <Textarea
                  id="description"
                  value={newLocation.description}
                  onChange={(e) => setNewLocation({ ...newLocation, description: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="image" className="text-right">
                  رابط الصورة
                </Label>
                <Input
                  id="image"
                  value={newLocation.image}
                  onChange={(e) => setNewLocation({ ...newLocation, image: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="lat" className="text-right">
                  خط العرض
                </Label>
                <Input
                  id="lat"
                  type="number"
                  value={newLocation.coordinates?.lat || 0}
                  onChange={(e) => setNewLocation({ 
                    ...newLocation, 
                    coordinates: { 
                      ...newLocation.coordinates as any,
                      lat: parseFloat(e.target.value) 
                    }
                  })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="lng" className="text-right">
                  خط الطول
                </Label>
                <Input
                  id="lng"
                  type="number"
                  value={newLocation.coordinates?.lng || 0}
                  onChange={(e) => setNewLocation({ 
                    ...newLocation, 
                    coordinates: { 
                      ...newLocation.coordinates as any,
                      lng: parseFloat(e.target.value) 
                    }
                  })}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>إلغاء</Button>
              <Button 
                onClick={handleAddLocation} 
                className="bg-[#00182A] hover:bg-[#002D4A]"
                disabled={!newLocation.name || !newLocation.description}
              >
                إضافة
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>إدارة المواقع</CardTitle>
          <CardDescription>
            عرض وإدارة المواقع المتاحة على المنصة مع إحصائيات العقارات
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>قائمة بجميع المواقع المتاحة على المنصة</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>الاسم</TableHead>
                <TableHead>الوصف</TableHead>
                <TableHead>العقارات</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="text-left">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLocations.map((location) => (
                <TableRow key={location.id}>
                  <TableCell>{location.id}</TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-blue-500 ml-2" />
                      {location.name}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{location.description}</TableCell>
                  <TableCell>{location.propertiesCount}</TableCell>
                  <TableCell>
                    {location.isActive ? (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">نشط</Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-500">غير نشط</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2 space-x-reverse">
                      <Button variant="ghost" size="icon" onClick={() => toggleLocationStatus(location.id)}>
                        {location.isActive ? (
                          <Trash2 className="h-4 w-4 text-red-500" />
                        ) : (
                          <Check className="h-4 w-4 text-green-500" />
                        )}
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Pen className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4 text-blue-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteLocation(location.id)}>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {locations.slice(0, 3).map((location) => (
          <Card key={location.id}>
            <CardHeader className="relative p-0">
              <div className="h-48 w-full overflow-hidden relative">
                <img
                  src={location.image || "https://via.placeholder.com/400x200?text=صورة+الموقع"}
                  alt={location.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                  <CardTitle className="text-white text-xl">{location.name}</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-800 hover:bg-blue-50 border-blue-200">
                  {location.propertiesCount} عقار
                </Badge>
                {location.isActive ? (
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">نشط</Badge>
                ) : (
                  <Badge variant="outline" className="text-gray-500">غير نشط</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{location.description}</p>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                عرض العقارات
              </Button>
              <Button variant="outline" size="sm">
                <Pen className="h-4 w-4 mr-2" />
                تعديل
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}