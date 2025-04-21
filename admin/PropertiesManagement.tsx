import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Home,
  MoreVertical,
  PlusCircle,
  Edit,
  Trash2,
  Search,
  MapPin,
  User,
  Star,
  Bed,
  Bath,
  Users,
  Tag,
  Loader2,
  Check,
  X,
  Eye,
  FileImage,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
  amenities: string[] | null;
  rating: number;
  reviewsCount: number;
  active: boolean | null;
  featured: boolean | null;
  userId: number;
  createdAt: string;
  ownerName?: string;
};

export function PropertiesManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewImagesDialogOpen, setIsViewImagesDialogOpen] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get all properties
  const {
    data: properties = [],
    isLoading: propertiesLoading,
    error: propertiesError,
  } = useQuery<Property[]>({
    queryKey: ["/api/admin/properties"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/admin/properties");
        if (!res.ok) throw new Error("Failed to fetch properties");
        return await res.json();
      } catch (error: any) {
        console.error("Error fetching properties:", error);
        throw new Error(error.message || "Failed to fetch properties");
      }
    },
  });
  
  // Get all locations for filter
  const {
    data: locations = [],
    isLoading: locationsLoading,
  } = useQuery<{ id: number; name: string }[]>({
    queryKey: ["/api/admin/locations"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/admin/locations");
        if (!res.ok) throw new Error("Failed to fetch locations");
        return await res.json();
      } catch (error: any) {
        console.error("Error fetching locations:", error);
        return [];
      }
    },
  });
  
  // Delete property mutation
  const deletePropertyMutation = useMutation({
    mutationFn: async (propertyId: number) => {
      const res = await apiRequest("DELETE", `/api/admin/properties/${propertyId}`);
      if (!res.ok) throw new Error("Failed to delete property");
      return propertyId;
    },
    onSuccess: () => {
      toast({
        title: "تم حذف العقار بنجاح",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/properties"] });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "فشل حذف العقار",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update property mutation
  const updatePropertyMutation = useMutation({
    mutationFn: async (propertyData: Partial<Property> & { id: number }) => {
      const { id, ...data } = propertyData;
      const res = await apiRequest("PATCH", `/api/admin/properties/${id}`, data);
      if (!res.ok) throw new Error("Failed to update property");
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "تم تحديث العقار بنجاح",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/properties"] });
      setIsEditDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "فشل تحديث العقار",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Filter properties
  const filteredProperties = properties.filter((property) => {
    const matchesSearch =
      property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (property.ownerName || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesLocation =
      !locationFilter || property.location === locationFilter;
    
    return matchesSearch && matchesLocation;
  });
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ar-EG", {
      style: "currency",
      currency: "EGP",
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("ar-EG").format(date);
  };
  
  if (propertiesLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>جاري تحميل بيانات العقارات...</CardTitle>
          <CardDescription>يرجى الانتظار</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between">
              <Skeleton className="h-10 w-[250px]" />
              <Skeleton className="h-10 w-[120px]" />
            </div>
            <div className="space-y-2">
              {Array(5)
                .fill(null)
                .map((_, index) => (
                  <Skeleton key={index} className="h-16 w-full" />
                ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (propertiesError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>خطأ في تحميل بيانات العقارات</CardTitle>
          <CardDescription>حدث خطأ أثناء محاولة جلب بيانات العقارات</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/properties"] })}
          >
            إعادة المحاولة
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  const handleEditProperty = (property: Property) => {
    setEditingProperty(property);
    setIsEditDialogOpen(true);
  };
  
  const handleDeleteProperty = (property: Property) => {
    setEditingProperty(property);
    setIsDeleteDialogOpen(true);
  };
  
  const handleViewImages = (property: Property) => {
    setEditingProperty(property);
    setIsViewImagesDialogOpen(true);
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <CardTitle className="flex items-center">
              <Home className="h-5 w-5 mr-2" />
              إدارة العقارات
            </CardTitle>
            <CardDescription>
              عرض وإدارة جميع العقارات في النظام
            </CardDescription>
          </div>
          <Button className="bg-[#00182A] hover:bg-[#002D4A]">
            <PlusCircle className="h-4 w-4 mr-2" />
            إضافة عقار جديد
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filter Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="البحث عن عقار..."
              className="pl-3 pr-10 rounded-md"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center">
            <MapPin className="h-4 w-4 text-gray-400 mr-2" />
            <select
              className="border rounded-md border-gray-200 p-2 text-sm"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
            >
              <option value="">جميع المواقع</option>
              {locationsLoading ? (
                <option disabled>جاري التحميل...</option>
              ) : (
                locations.map((location) => (
                  <option key={location.id} value={location.name}>
                    {location.name}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
        
        {/* Properties Table */}
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>اسم العقار</TableHead>
                <TableHead>الموقع</TableHead>
                <TableHead>السعر / ليلة</TableHead>
                <TableHead>
                  <div className="flex items-center">
                    <Bed className="h-4 w-4 mr-1" />
                    <Bath className="h-4 w-4 mr-1" />
                    <Users className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>التقييم</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>تاريخ الإضافة</TableHead>
                <TableHead className="text-left">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProperties.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center h-24">
                    <div className="flex flex-col items-center justify-center">
                      <Home className="h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-gray-500 text-sm">لا توجد نتائج مطابقة</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredProperties.map((property, index) => (
                  <TableRow key={property.id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-md bg-gray-100 overflow-hidden flex-shrink-0">
                          {property.images && property.images.length > 0 ? (
                            <img
                              src={property.images[0]}
                              alt={property.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Home className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium truncate max-w-[150px]">
                            {property.title}
                            {property.featured && (
                              <span className="inline-flex items-center justify-center mr-1 w-4 h-4">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500 truncate max-w-[150px]">
                            {property.address}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{property.location}</TableCell>
                    <TableCell>{formatCurrency(property.price)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <span className="flex items-center">
                          <Bed className="h-3 w-3 mr-1" />
                          {property.beds}
                        </span>
                        <span className="flex items-center">
                          <Bath className="h-3 w-3 mr-1" />
                          {property.baths}
                        </span>
                        <span className="flex items-center">
                          <Users className="h-3 w-3 mr-1" />
                          {property.guests}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                        <span>{property.rating.toFixed(1)}</span>
                        <span className="text-gray-400 text-xs ml-1">
                          ({property.reviewsCount})
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {property.active ? (
                        <Badge className="bg-green-100 text-green-800">
                          نشط
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-500">
                          غير نشط
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(property.createdAt)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditProperty(property)}>
                            <Edit className="mr-2 h-4 w-4" />
                            تعديل
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleViewImages(property)}>
                            <FileImage className="mr-2 h-4 w-4" />
                            عرض الصور
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteProperty(property)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            حذف
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              updatePropertyMutation.mutate({
                                id: property.id,
                                active: !property.active,
                              })
                            }
                          >
                            {property.active ? (
                              <>
                                <X className="mr-2 h-4 w-4" />
                                تعطيل
                              </>
                            ) : (
                              <>
                                <Check className="mr-2 h-4 w-4" />
                                تفعيل
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              updatePropertyMutation.mutate({
                                id: property.id,
                                featured: !property.featured,
                              })
                            }
                          >
                            <Star className="mr-2 h-4 w-4" />
                            {property.featured
                              ? "إزالة من المميز"
                              : "إضافة للمميز"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      
      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد حذف العقار</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من رغبتك في حذف العقار{" "}
              <span className="font-semibold">{editingProperty?.title}</span>؟
              <div className="mt-2">
                لا يمكن التراجع عن هذا الإجراء. سيتم حذف جميع البيانات المرتبطة
                بهذا العقار، بما في ذلك الحجوزات والتقييمات.
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (editingProperty) {
                  deletePropertyMutation.mutate(editingProperty.id);
                }
              }}
              disabled={deletePropertyMutation.isPending}
            >
              {deletePropertyMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              حذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>تعديل بيانات العقار</DialogTitle>
            <DialogDescription>
              تعديل بيانات العقار {editingProperty?.title}
            </DialogDescription>
          </DialogHeader>
          <div>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">معلومات أساسية</TabsTrigger>
                <TabsTrigger value="details">التفاصيل والمواصفات</TabsTrigger>
                <TabsTrigger value="amenities">المرافق والخدمات</TabsTrigger>
              </TabsList>
              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-title">اسم العقار</Label>
                      <Input
                        id="edit-title"
                        value={editingProperty?.title || ""}
                        onChange={(e) =>
                          setEditingProperty((prev) =>
                            prev ? { ...prev, title: e.target.value } : null
                          )
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-location">الموقع</Label>
                      <select
                        id="edit-location"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={editingProperty?.location || ""}
                        onChange={(e) =>
                          setEditingProperty((prev) =>
                            prev ? { ...prev, location: e.target.value } : null
                          )
                        }
                      >
                        {locationsLoading ? (
                          <option disabled>جاري التحميل...</option>
                        ) : (
                          locations.map((location) => (
                            <option key={location.id} value={location.name}>
                              {location.name}
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-address">العنوان التفصيلي</Label>
                    <Input
                      id="edit-address"
                      value={editingProperty?.address || ""}
                      onChange={(e) =>
                        setEditingProperty((prev) =>
                          prev ? { ...prev, address: e.target.value } : null
                        )
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-description">الوصف</Label>
                    <Textarea
                      id="edit-description"
                      rows={4}
                      value={editingProperty?.description || ""}
                      onChange={(e) =>
                        setEditingProperty((prev) =>
                          prev ? { ...prev, description: e.target.value } : null
                        )
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-price">السعر لليلة</Label>
                      <Input
                        id="edit-price"
                        type="number"
                        value={editingProperty?.price || 0}
                        onChange={(e) =>
                          setEditingProperty((prev) =>
                            prev
                              ? { ...prev, price: Number(e.target.value) }
                              : null
                          )
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>الحالة والتمييز</Label>
                      <div className="flex items-center space-x-4 rtl:space-x-reverse">
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <input
                            type="checkbox"
                            id="edit-active"
                            checked={editingProperty?.active || false}
                            onChange={(e) =>
                              setEditingProperty((prev) =>
                                prev
                                  ? { ...prev, active: e.target.checked }
                                  : null
                              )
                            }
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <Label htmlFor="edit-active">نشط</Label>
                        </div>
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <input
                            type="checkbox"
                            id="edit-featured"
                            checked={editingProperty?.featured || false}
                            onChange={(e) =>
                              setEditingProperty((prev) =>
                                prev
                                  ? { ...prev, featured: e.target.checked }
                                  : null
                              )
                            }
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <Label htmlFor="edit-featured">مميز</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="details" className="space-y-4 mt-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-beds">عدد غرف النوم</Label>
                    <Input
                      id="edit-beds"
                      type="number"
                      min="1"
                      value={editingProperty?.beds || 1}
                      onChange={(e) =>
                        setEditingProperty((prev) =>
                          prev ? { ...prev, beds: Number(e.target.value) } : null
                        )
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-baths">عدد الحمامات</Label>
                    <Input
                      id="edit-baths"
                      type="number"
                      min="1"
                      value={editingProperty?.baths || 1}
                      onChange={(e) =>
                        setEditingProperty((prev) =>
                          prev ? { ...prev, baths: Number(e.target.value) } : null
                        )
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-guests">أقصى عدد للضيوف</Label>
                    <Input
                      id="edit-guests"
                      type="number"
                      min="1"
                      value={editingProperty?.guests || 1}
                      onChange={(e) =>
                        setEditingProperty((prev) =>
                          prev
                            ? { ...prev, guests: Number(e.target.value) }
                            : null
                        )
                      }
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>معلومات إضافية</Label>
                  <div className="text-sm text-gray-500">
                    هذا القسم سيتم توسيعه لاحقًا لإضافة معلومات أكثر تفصيلاً عن
                    العقار، مثل الطابق، المساحة، نوع العقار، وغيرها.
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="amenities" className="space-y-4 mt-4">
                <div className="grid gap-4">
                  <Label>المرافق المتاحة</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {[
                      { id: "wifi", label: "واي فاي" },
                      { id: "pool", label: "مسبح" },
                      { id: "sea_view", label: "إطلالة على البحر" },
                      { id: "ac", label: "مكيف هواء" },
                      { id: "parking", label: "موقف سيارات" },
                      { id: "kitchen", label: "مطبخ" },
                      { id: "balcony", label: "تراس" },
                      { id: "tv", label: "تلفزيون" },
                      { id: "gym", label: "صالة رياضية" },
                    ].map((amenity) => (
                      <div
                        key={amenity.id}
                        className="flex items-center space-x-2 rtl:space-x-reverse"
                      >
                        <input
                          type="checkbox"
                          id={`edit-amenity-${amenity.id}`}
                          checked={
                            editingProperty?.amenities?.includes(amenity.id) ||
                            false
                          }
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setEditingProperty((prev) => {
                              if (!prev) return null;
                              
                              const updatedAmenities = [...(prev.amenities || [])];
                              if (checked && !updatedAmenities.includes(amenity.id)) {
                                updatedAmenities.push(amenity.id);
                              } else if (
                                !checked &&
                                updatedAmenities.includes(amenity.id)
                              ) {
                                const index = updatedAmenities.indexOf(amenity.id);
                                updatedAmenities.splice(index, 1);
                              }
                              
                              return { ...prev, amenities: updatedAmenities };
                            });
                          }}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <Label htmlFor={`edit-amenity-${amenity.id}`}>
                          {amenity.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              إلغاء
            </Button>
            <Button
              onClick={() => {
                if (editingProperty) {
                  updatePropertyMutation.mutate({
                    id: editingProperty.id,
                    title: editingProperty.title,
                    description: editingProperty.description,
                    location: editingProperty.location,
                    address: editingProperty.address,
                    price: editingProperty.price,
                    beds: editingProperty.beds,
                    baths: editingProperty.baths,
                    guests: editingProperty.guests,
                    amenities: editingProperty.amenities,
                    active: editingProperty.active,
                    featured: editingProperty.featured,
                  });
                }
              }}
              disabled={updatePropertyMutation.isPending}
              className="bg-[#00182A] hover:bg-[#002D4A]"
            >
              {updatePropertyMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              حفظ التغييرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* View Images Dialog */}
      <Dialog
        open={isViewImagesDialogOpen}
        onOpenChange={setIsViewImagesDialogOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>صور العقار</DialogTitle>
            <DialogDescription>
              عرض صور العقار {editingProperty?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            {editingProperty?.images && editingProperty.images.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {editingProperty.images.map((image, index) => (
                  <div
                    key={index}
                    className="relative rounded-md overflow-hidden aspect-square"
                  >
                    <img
                      src={image}
                      alt={`صورة ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 right-0 bg-black bg-opacity-50 text-white px-2 py-1 text-xs">
                      {index + 1} / {editingProperty.images.length}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileImage className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                <p className="text-gray-500">لا توجد صور متاحة لهذا العقار</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsViewImagesDialogOpen(false)}>
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}