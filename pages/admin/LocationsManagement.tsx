import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { logger } from "@/lib/logger";
import { UserRole } from "@shared/schema";
import { 
  Loader2, Image, Pencil, Trash, Upload, Plus, Search, 
  MapPin, Filter, RefreshCw, ArrowUpDown, Check, X, Globe,
  Eye
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { getFirestore, collection, query, getDocs, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// نوع بيانات الموقع
interface Location {
  id: string;
  name: string;
  arabicName: string;
  description: string;
  images: string[];
  featuredImage: string;
  properties: number;
  createdAt?: any;
  updatedAt?: any;
}

// مخطط التحقق من صحة نموذج إضافة/تعديل موقع
const locationFormSchema = z.object({
  name: z.string().min(2, {
    message: "يجب أن يحتوي اسم الموقع على حرفين على الأقل",
  }),
  arabicName: z.string().min(2, {
    message: "يجب أن يحتوي الاسم العربي على حرفين على الأقل",
  }),
  description: z.string().min(10, {
    message: "يجب أن يحتوي الوصف على 10 أحرف على الأقل",
  }),
});

type LocationFormValues = z.infer<typeof locationFormSchema>;

export default function LocationsManagement() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [featuredImage, setFeaturedImage] = useState<string>("");
  const { toast } = useToast();

  // نموذج إضافة/تعديل موقع
  const form = useForm<LocationFormValues>({
    resolver: zodResolver(locationFormSchema),
    defaultValues: {
      name: "",
      arabicName: "",
      description: "",
    },
  });

  // التحقق من صلاحيات المستخدم
  useEffect(() => {
    if (!user) {
      setLocation("/auth");
      return;
    }

    if (user.role !== UserRole.SUPER_ADMIN) {
      setLocation("/");
      return;
    }

    fetchLocations();
  }, [user, setLocation]);

  // جلب بيانات المواقع
  const fetchLocations = async () => {
    try {
      setLoading(true);
      const db = getFirestore();
      const locationsRef = collection(db, "locations");
      const q = query(locationsRef);
      const querySnapshot = await getDocs(q);
      
      const locationsList: Location[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        locationsList.push({
          id: doc.id,
          name: data.name || "",
          arabicName: data.arabicName || "",
          description: data.description || "",
          images: data.images || [],
          featuredImage: data.featuredImage || "",
          properties: data.properties || 0,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        });
      });
      
      setLocations(locationsList);
      setLoading(false);
    } catch (err) {
      logger.error("locations", "خطأ في جلب بيانات المواقع", err);
      setError("حدث خطأ في جلب بيانات المواقع");
      setLoading(false);
    }
  };

  // فتح مربع حوار إضافة موقع جديد
  const openAddDialog = () => {
    setCurrentLocation(null);
    form.reset({
      name: "",
      arabicName: "",
      description: "",
    });
    setUploadedImages([]);
    setFeaturedImage("");
    setIsDialogOpen(true);
  };

  // فتح مربع حوار تعديل موقع
  const openEditDialog = (loc: Location) => {
    setCurrentLocation(loc);
    form.reset({
      name: loc.name,
      arabicName: loc.arabicName,
      description: loc.description,
    });
    setUploadedImages(loc.images || []);
    setFeaturedImage(loc.featuredImage || "");
    setIsDialogOpen(true);
  };

  // فتح مربع حوار حذف موقع
  const openDeleteDialog = (loc: Location) => {
    setCurrentLocation(loc);
    setIsDeleteDialogOpen(true);
  };

  // حفظ الموقع (إضافة أو تعديل)
  const onSubmit = async (data: LocationFormValues) => {
    try {
      if (uploadedImages.length === 0) {
        toast({
          title: "خطأ في الصور",
          description: "يرجى تحميل صورة واحدة على الأقل للموقع",
          variant: "destructive",
        });
        return;
      }

      if (!featuredImage) {
        // إذا لم يتم تحديد صورة مميزة، استخدم الصورة الأولى
        setFeaturedImage(uploadedImages[0]);
      }

      const db = getFirestore();
      
      if (currentLocation) {
        // تحديث موقع موجود
        const locationRef = doc(db, "locations", currentLocation.id);
        await updateDoc(locationRef, {
          name: data.name,
          arabicName: data.arabicName,
          description: data.description,
          images: uploadedImages,
          featuredImage: featuredImage || uploadedImages[0],
          updatedAt: serverTimestamp()
        });
        
        toast({
          title: "تم تحديث الموقع",
          description: `تم تحديث بيانات ${data.name} بنجاح`,
        });
      } else {
        // إضافة موقع جديد
        await addDoc(collection(db, "locations"), {
          name: data.name,
          arabicName: data.arabicName,
          description: data.description,
          images: uploadedImages,
          featuredImage: featuredImage || uploadedImages[0],
          properties: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        toast({
          title: "تمت الإضافة",
          description: `تم إضافة ${data.name} بنجاح`,
        });
      }
      
      setIsDialogOpen(false);
      fetchLocations();
    } catch (err) {
      logger.error("locations", "خطأ في حفظ بيانات الموقع", err);
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء حفظ بيانات الموقع",
        variant: "destructive",
      });
    }
  };

  // حذف موقع
  const deleteLocation = async () => {
    if (!currentLocation) return;
    
    try {
      const db = getFirestore();
      await deleteDoc(doc(db, "locations", currentLocation.id));
      
      toast({
        title: "تم الحذف",
        description: `تم حذف ${currentLocation.name} بنجاح`,
      });
      
      setIsDeleteDialogOpen(false);
      fetchLocations();
    } catch (err) {
      logger.error("locations", "خطأ في حذف الموقع", err);
      toast({
        title: "خطأ في الحذف",
        description: "حدث خطأ أثناء حذف الموقع",
        variant: "destructive",
      });
    }
  };

  // رفع الصور
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setUploadingImages(true);
    const newUploadedImages = [...uploadedImages];
    const storage = getStorage();
    
    try {
      // التحقق من أبعاد الصور
      const validateDimensions = (file: File): Promise<boolean> => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            const { width, height } = img;
            if (width < 1920 || height < 1080) {
              toast({
                title: "خطأ في أبعاد الصورة",
                description: `الصورة ${file.name} يجب أن تكون بدقة 1920×1080 على الأقل. الأبعاد الحالية: ${width}×${height}`,
                variant: "destructive",
              });
              resolve(false);
            } else {
              resolve(true);
            }
          };
          img.src = URL.createObjectURL(file);
        });
      };
      
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        
        // التحقق من نوع الملف
        if (!file.type.includes("image/")) {
          toast({
            title: "خطأ في نوع الملف",
            description: `الملف ${file.name} ليس صورة`,
            variant: "destructive",
          });
          continue;
        }
        
        // التحقق من حجم الملف (الحد الأقصى 5 ميجابايت)
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "خطأ في حجم الملف",
            description: `حجم الصورة ${file.name} أكبر من 5 ميجابايت`,
            variant: "destructive",
          });
          continue;
        }
        
        // التحقق من أبعاد الصورة
        const validDimensions = await validateDimensions(file);
        if (!validDimensions) continue;
        
        // رفع الصورة إلى Firebase Storage
        const fileRef = ref(storage, `locations/${Date.now()}_${file.name}`);
        await uploadBytes(fileRef, file);
        const downloadURL = await getDownloadURL(fileRef);
        
        newUploadedImages.push(downloadURL);
      }
      
      setUploadedImages(newUploadedImages);
      
      if (newUploadedImages.length > 0 && !featuredImage) {
        setFeaturedImage(newUploadedImages[0]);
      }
      
      toast({
        title: "تم رفع الصور",
        description: "تم رفع الصور بنجاح",
      });
    } catch (err) {
      logger.error("locations", "خطأ في رفع الصور", err);
      toast({
        title: "خطأ في رفع الصور",
        description: "حدث خطأ أثناء رفع الصور",
        variant: "destructive",
      });
    } finally {
      setUploadingImages(false);
    }
  };

  // حذف صورة
  const removeImage = (index: number) => {
    const newImages = [...uploadedImages];
    const removedImage = newImages.splice(index, 1)[0];
    
    // إذا كانت الصورة المحذوفة هي الصورة المميزة، قم بتعيين صورة أخرى
    if (removedImage === featuredImage) {
      setFeaturedImage(newImages.length > 0 ? newImages[0] : "");
    }
    
    setUploadedImages(newImages);
  };

  // تعيين صورة مميزة
  const setAsFeatured = (index: number) => {
    setFeaturedImage(uploadedImages[index]);
    
    toast({
      title: "تم تعيين الصورة المميزة",
      description: "تم تعيين الصورة المحددة كصورة مميزة للموقع",
    });
  };

  // تصفية المواقع حسب مصطلح البحث
  const filteredLocations = locations.filter(
    (loc) =>
      loc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loc.arabicName.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">إدارة المواقع</h1>
        <Button onClick={openAddDialog}>
          <Plus className="h-4 w-4 mr-2" /> إضافة موقع جديد
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>المواقع المتاحة</CardTitle>
          <CardDescription>
            إدارة المواقع السياحية في النظام مثل رأس الحكمة والساحل وشرم الشيخ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="البحث عن موقع..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={fetchLocations}>
              <RefreshCw className="h-4 w-4 mr-2" /> تحديث
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16 text-center">الصورة</TableHead>
                  <TableHead>الاسم</TableHead>
                  <TableHead>الاسم العربي</TableHead>
                  <TableHead className="hidden md:table-cell">الوصف</TableHead>
                  <TableHead className="text-center">العقارات</TableHead>
                  <TableHead className="hidden md:table-cell">تاريخ الإضافة</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLocations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      لا توجد مواقع متاحة{searchTerm && " تطابق معايير البحث"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLocations.map((loc) => (
                    <TableRow key={loc.id}>
                      <TableCell className="text-center">
                        {loc.featuredImage ? (
                          <div className="w-10 h-10 rounded-md overflow-hidden inline-block">
                            <img
                              src={loc.featuredImage}
                              alt={loc.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <MapPin className="h-5 w-5 mx-auto text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell>{loc.name}</TableCell>
                      <TableCell>{loc.arabicName}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="max-w-xs truncate">{loc.description}</div>
                      </TableCell>
                      <TableCell className="text-center">{loc.properties}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {loc.createdAt ? new Date(loc.createdAt.toDate()).toLocaleDateString() : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">فتح القائمة</span>
                              <ArrowUpDown className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openEditDialog(loc)}>
                              <Pencil className="h-4 w-4 mr-2" /> تعديل
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openDeleteDialog(loc)}>
                              <Trash className="h-4 w-4 mr-2" /> حذف
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
      </Card>

      {/* مربع حوار إضافة/تعديل الموقع */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {currentLocation ? `تعديل: ${currentLocation.name}` : "إضافة موقع جديد"}
            </DialogTitle>
            <DialogDescription>
              {currentLocation
                ? "قم بتعديل بيانات الموقع والصور الخاصة به"
                : "أضف موقعًا جديدًا مع توفير المعلومات والصور اللازمة"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم الموقع (بالإنجليزية)</FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: Ras El Hekma" {...field} />
                    </FormControl>
                    <FormDescription>
                      اسم الموقع باللغة الإنجليزية كما سيظهر في التطبيق
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="arabicName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم الموقع (بالعربية)</FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: رأس الحكمة" {...field} />
                    </FormControl>
                    <FormDescription>
                      اسم الموقع باللغة العربية كما سيظهر في التطبيق
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>وصف الموقع</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="اكتب وصفًا تفصيليًا للموقع..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      وصف شامل للموقع يتضمن المميزات والمعالم السياحية والمعلومات المهمة
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* قسم الصور */}
              <div className="space-y-4">
                <div>
                  <FormLabel>صور الموقع</FormLabel>
                  <FormDescription>
                    قم بتحميل صور عالية الجودة للموقع (بدقة 1920×1080 على الأقل)
                  </FormDescription>
                  
                  <div className="mt-2 flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("location-images")?.click()}
                      disabled={uploadingImages}
                    >
                      {uploadingImages ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" /> جاري الرفع...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" /> رفع الصور
                        </>
                      )}
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {uploadedImages.length} {uploadedImages.length === 1 ? "صورة" : "صور"}
                    </span>
                    <input
                      id="location-images"
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={uploadingImages}
                    />
                  </div>
                </div>
                
                {/* عرض الصور المرفوعة */}
                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {uploadedImages.map((img, index) => (
                      <div
                        key={index}
                        className={`relative rounded-md overflow-hidden h-24 group border-2 ${
                          img === featuredImage ? "border-amber-500" : "border-transparent"
                        }`}
                      >
                        <img
                          src={img}
                          alt={`صورة ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {img === featuredImage && (
                          <div className="absolute top-1 left-1 bg-amber-500 text-white rounded-full p-0.5">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => setAsFeatured(index)}
                          >
                            <Star className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => removeImage(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit">
                  {currentLocation ? "تحديث الموقع" : "إضافة الموقع"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* مربع حوار تأكيد الحذف */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من رغبتك في حذف {currentLocation?.name}؟ هذا الإجراء لا يمكن التراجع عنه.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              إلغاء
            </Button>
            <Button variant="destructive" onClick={deleteLocation}>
              تأكيد الحذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}