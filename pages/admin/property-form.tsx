import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Save, Loader2, Image, Plus, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";

// نوع البيانات للعقار
interface Property {
  id?: number;
  title: string;
  description: string;
  location: string;
  address: string;
  price: number;
  beds: number;
  baths: number;
  guests: number;
  amenities: string[] | null;
  images: string[];
  featured?: boolean | null;
  active?: boolean | null;
}

// مخطط التحقق من صحة البيانات باستخدام zod
const propertyFormSchema = z.object({
  title: z.string().min(3, "يجب أن يكون العنوان 3 أحرف على الأقل"),
  description: z.string().min(10, "يجب أن يكون الوصف 10 أحرف على الأقل"),
  location: z.string().min(2, "يجب تحديد الموقع"),
  address: z.string().min(5, "يجب إدخال العنوان التفصيلي"),
  price: z.number().min(1, "يجب أن يكون السعر أكبر من صفر"),
  beds: z.number().min(1, "يجب تحديد عدد الأسرة"),
  baths: z.number().min(1, "يجب تحديد عدد الحمامات"),
  guests: z.number().min(1, "يجب تحديد عدد الضيوف"),
  amenities: z.array(z.string()).nullable(),
  images: z.array(z.string()).min(1, "يجب إضافة صورة واحدة على الأقل"),
  featured: z.boolean().nullable(),
  active: z.boolean().nullable(),
});

type PropertyFormData = z.infer<typeof propertyFormSchema>;

const amenitiesOptions = [
  { id: "wifi", label: "واي فاي" },
  { id: "pool", label: "مسبح" },
  { id: "kitchen", label: "مطبخ" },
  { id: "parking", label: "موقف سيارات" },
  { id: "ac", label: "تكييف" },
  { id: "tv", label: "تلفزيون" },
  { id: "washer", label: "غسالة" },
  { id: "dryer", label: "مجفف" },
  { id: "beach", label: "على الشاطئ" },
  { id: "bbq", label: "شواء" },
  { id: "gym", label: "صالة رياضية" },
  { id: "balcony", label: "شرفة" },
  { id: "heating", label: "تدفئة" },
  { id: "breakfast", label: "فطور" },
  { id: "pets", label: "يسمح بالحيوانات الأليفة" }
];

const PropertyForm = ({ id }: { id?: number }) => {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditMode] = useState(!!id);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  
  // التحقق من تسجيل الدخول والصلاحيات
  useEffect(() => {
    if (!user) {
      setLocation("/login");
      return;
    }

    if (user.role !== 'property_admin' && user.role !== 'super_admin') {
      setLocation("/");
      toast({
        title: "غير مصرح",
        description: "ليس لديك صلاحية الوصول",
        variant: "destructive",
      });
    }
  }, [user, setLocation, toast]);

  // جلب بيانات العقار في حالة التعديل
  const { 
    data: propertyData,
    isLoading: isLoadingProperty,
    error: propertyError
  } = useQuery({
    queryKey: ['/api/property-admin/properties', id],
    queryFn: async () => {
      if (!id) return undefined;
      
      const res = await apiRequest('GET', `/api/property-admin/properties/${id}`);
      return await res.json();
    },
    enabled: !!id,
  });

  // إعداد نموذج البيانات
  const form = useForm<PropertyFormData>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      address: "",
      price: 0,
      beds: 1,
      baths: 1,
      guests: 1,
      amenities: [],
      images: [],
      featured: false,
      active: true,
    }
  });

  // تعبئة النموذج ببيانات العقار في حالة التعديل
  useEffect(() => {
    if (propertyData && isEditMode) {
      form.reset({
        title: propertyData.title,
        description: propertyData.description,
        location: propertyData.location,
        address: propertyData.address,
        price: propertyData.price,
        beds: propertyData.beds,
        baths: propertyData.baths,
        guests: propertyData.guests,
        amenities: propertyData.amenities || [],
        images: propertyData.images || [],
        featured: propertyData.featured ?? false,
        active: propertyData.active ?? true,
      });
      
      setImageUrls(propertyData.images || []);
    }
  }, [propertyData, isEditMode, form]);

  // Mutation لإضافة عقار جديد
  const createPropertyMutation = useMutation({
    mutationFn: async (data: PropertyFormData) => {
      const res = await apiRequest('POST', '/api/property-admin/properties', data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "تمت الإضافة",
        description: "تم إضافة العقار بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/property-admin/properties'] });
      setLocation("/admin/property-dashboard");
    },
    onError: (error) => {
      console.error("Error creating property:", error);
      toast({
        title: "خطأ",
        description: "فشل في إضافة العقار. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    },
  });

  // Mutation لتحديث عقار موجود
  const updatePropertyMutation = useMutation({
    mutationFn: async (data: PropertyFormData) => {
      if (!id) throw new Error("Property ID is required");
      
      const res = await apiRequest('PUT', `/api/property-admin/properties/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "تم التحديث",
        description: "تم تحديث العقار بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/property-admin/properties'] });
      queryClient.invalidateQueries({ queryKey: ['/api/property-admin/properties', id] });
      setLocation("/admin/property-dashboard");
    },
    onError: (error) => {
      console.error("Error updating property:", error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث العقار. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    },
  });

  // معالجة تقديم النموذج
  const onSubmit = (data: PropertyFormData) => {
    if (isEditMode) {
      updatePropertyMutation.mutate(data);
    } else {
      createPropertyMutation.mutate(data);
    }
  };

  // إضافة رابط صورة جديد
  const handleAddImage = () => {
    if (!newImageUrl || !newImageUrl.trim()) return;
    
    const updatedImages = [...imageUrls, newImageUrl.trim()];
    setImageUrls(updatedImages);
    form.setValue('images', updatedImages);
    setNewImageUrl("");
  };

  // حذف صورة
  const handleRemoveImage = (index: number) => {
    const updatedImages = imageUrls.filter((_, i) => i !== index);
    setImageUrls(updatedImages);
    form.setValue('images', updatedImages);
  };

  // عرض مؤشر التحميل
  if (isEditMode && isLoadingProperty) {
    return (
      <div className="container py-8 flex flex-col items-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-4">جاري تحميل بيانات العقار...</p>
      </div>
    );
  }

  // عرض رسالة خطأ في حالة فشل جلب البيانات
  if (isEditMode && propertyError) {
    return (
      <div className="container py-8">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">خطأ في جلب البيانات</CardTitle>
            <CardDescription>
              تعذر الحصول على بيانات العقار. يرجى المحاولة مرة أخرى لاحقًا.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/admin/property-dashboard")}>
              <ArrowLeft className="ml-2 h-4 w-4" />
              العودة إلى لوحة التحكم
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{isEditMode ? "تعديل عقار" : "إضافة عقار جديد"}</h1>
          <p className="text-muted-foreground mt-1">
            {isEditMode ? "قم بتحديث معلومات العقار" : "قم بإدخال معلومات العقار الجديد"}
          </p>
        </div>
        <Button variant="outline" onClick={() => setLocation("/admin/property-dashboard")}>
          <ArrowLeft className="ml-2 h-4 w-4" />
          العودة للوحة التحكم
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>المعلومات الأساسية</CardTitle>
              <CardDescription>أدخل المعلومات الأساسية للعقار</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>عنوان العقار</FormLabel>
                    <FormControl>
                      <Input placeholder="أدخل عنوان العقار" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>وصف العقار</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="أدخل وصفًا مفصلاً للعقار" 
                        className="min-h-32" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الموقع</FormLabel>
                      <FormControl>
                        <Input placeholder="المدينة / المنطقة" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>العنوان التفصيلي</FormLabel>
                      <FormControl>
                        <Input placeholder="العنوان التفصيلي للعقار" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>التفاصيل والأسعار</CardTitle>
              <CardDescription>أدخل تفاصيل العقار والسعر</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>السعر في الليلة ($)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          placeholder="السعر" 
                          {...field} 
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="beds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>عدد الأسرة</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          placeholder="عدد الأسرة" 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="baths"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>عدد الحمامات</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          placeholder="عدد الحمامات" 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="guests"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>عدد الضيوف</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          placeholder="عدد الضيوف" 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">وسائل الراحة</h3>
                  <p className="text-sm text-muted-foreground mb-4">اختر وسائل الراحة المتوفرة في العقار</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-2">
                  {amenitiesOptions.map((amenity) => (
                    <FormField
                      key={amenity.id}
                      control={form.control}
                      name="amenities"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-3 space-y-0 space-x-reverse">
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(amenity.id)}
                              onCheckedChange={(checked) => {
                                const currentValues = field.value || [];
                                const updatedValues = checked
                                  ? [...currentValues, amenity.id]
                                  : currentValues.filter(value => value !== amenity.id);
                                field.onChange(updatedValues);
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal text-sm cursor-pointer">
                            {amenity.label}
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>الصور</CardTitle>
              <CardDescription>أضف صور العقار (روابط URL للصور)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col space-y-4">
                <div className="flex flex-wrap gap-4">
                  {imageUrls.map((url, index) => (
                    <div key={index} className="relative w-32 h-32">
                      <img
                        src={url}
                        alt={`Property image ${index + 1}`}
                        className="w-full h-full object-cover rounded-md"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=Error';
                        }}
                      />
                      <button
                        type="button"
                        className="absolute top-1 right-1 bg-destructive text-white p-1 rounded-full"
                        onClick={() => handleRemoveImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}

                  {imageUrls.length === 0 && (
                    <div className="w-32 h-32 border border-dashed border-muted-foreground rounded-md flex items-center justify-center">
                      <Image className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Input
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="أدخل رابط URL للصورة"
                    className="flex-1"
                  />
                  <Button type="button" onClick={handleAddImage} variant="secondary">
                    <Plus className="h-4 w-4 ml-1" />
                    إضافة
                  </Button>
                </div>

                <FormField
                  control={form.control}
                  name="images"
                  render={() => (
                    <FormItem>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>إعدادات إضافية</CardTitle>
              <CardDescription>إعدادات الظهور والتفعيل</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="featured"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">عقار مميز</FormLabel>
                        <FormDescription>
                          سيظهر هذا العقار في قسم العقارات المميزة
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">نشط</FormLabel>
                        <FormDescription>
                          العقار متاح للحجز ويظهر في نتائج البحث
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setLocation("/admin/property-dashboard")}
            >
              إلغاء
            </Button>
            <Button 
              type="submit" 
              disabled={createPropertyMutation.isPending || updatePropertyMutation.isPending}
            >
              {createPropertyMutation.isPending || updatePropertyMutation.isPending ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="ml-2 h-4 w-4" />
                  {isEditMode ? "حفظ التغييرات" : "إضافة العقار"}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default PropertyForm;