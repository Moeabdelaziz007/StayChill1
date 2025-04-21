import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { 
  getUserProperties, 
  getProperty,
  getFeaturedProperties,
  COLLECTIONS
} from "@/lib/firestore-collections";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "wouter";
import { doc, updateDoc, getFirestore, deleteField } from "firebase/firestore";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { sanitizeFirestoreData } from "@/lib/firestore-collections";
import { Loader2, Pencil, Trash, ImagePlus } from "lucide-react";

interface Property {
  id: string;
  title: string;
  description: string;
  location: string;
  price: number;
  images: string[];
  [key: string]: any;
}

export default function PropertyManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<Property>>({});
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openImageDialog, setOpenImageDialog] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [imageToDelete, setImageToDelete] = useState("");
  
  const db = getFirestore();

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        if (!user) return;
        
        let propertiesList: Property[] = [];
        
        if (user.role === 'super_admin') {
          // للمسؤول الرئيسي، اعرض جميع العقارات
          const featuredProperties = await getFeaturedProperties(100);
          propertiesList = featuredProperties as unknown as Property[];
        } else if (user.role === 'property_admin') {
          // لمدير العقارات، اعرض فقط العقارات التي يمتلكها
          const userProperties = await getUserProperties(user.id.toString());
          propertiesList = userProperties as unknown as Property[];
        }
        
        setProperties(propertiesList);
      } catch (error) {
        console.error("Error fetching properties:", error);
        toast({
          title: "خطأ في تحميل العقارات",
          description: "حدث خطأ أثناء تحميل العقارات، يرجى المحاولة مرة أخرى",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [user, toast]);

  const handlePropertySelect = async (propertyId: string) => {
    try {
      const propertyData = await getProperty(propertyId);
      if (propertyData) {
        const property = { id: propertyId, ...propertyData } as Property;
        setSelectedProperty(property);
        setFormData(sanitizeFirestoreData(property));
      }
    } catch (error) {
      console.error("Error selecting property:", error);
      toast({
        title: "خطأ في تحميل بيانات العقار",
        description: "حدث خطأ أثناء تحميل بيانات العقار، يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSaveChanges = async () => {
    try {
      if (!selectedProperty) return;
      
      const propertyRef = doc(db, COLLECTIONS.PROPERTIES, selectedProperty.id);
      
      // Remove empty fields
      const updateData = { ...formData };
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === "") {
          updateData[key] = deleteField();
        }
      });
      
      await updateDoc(propertyRef, updateData);
      
      // Update the property in the local state
      const updatedProperties = properties.map(p => 
        p.id === selectedProperty.id ? { ...p, ...formData } : p
      );
      setProperties(updatedProperties);
      setSelectedProperty({ ...selectedProperty, ...formData });
      setEditMode(false);
      
      toast({
        title: "تم الحفظ بنجاح",
        description: "تم حفظ التغييرات بنجاح",
      });
    } catch (error) {
      console.error("Error saving changes:", error);
      toast({
        title: "خطأ في حفظ التغييرات",
        description: "حدث خطأ أثناء حفظ التغييرات، يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProperty = async () => {
    try {
      if (!selectedProperty) return;
      
      const propertyRef = doc(db, COLLECTIONS.PROPERTIES, selectedProperty.id);
      await updateDoc(propertyRef, { 
        active: false,
        deletedAt: new Date()
      });
      
      // Remove the property from the local state
      setProperties(properties.filter(p => p.id !== selectedProperty.id));
      setSelectedProperty(null);
      setOpenDeleteDialog(false);
      
      toast({
        title: "تم الحذف بنجاح",
        description: "تم حذف العقار بنجاح",
      });
    } catch (error) {
      console.error("Error deleting property:", error);
      toast({
        title: "خطأ في حذف العقار",
        description: "حدث خطأ أثناء حذف العقار، يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    }
  };

  const handleAddImage = async () => {
    try {
      if (!selectedProperty || !newImageUrl) return;
      
      const propertyRef = doc(db, COLLECTIONS.PROPERTIES, selectedProperty.id);
      
      // Get current images or initialize empty array
      const currentImages = selectedProperty.images || [];
      
      // Add new image to array
      const updatedImages = [...currentImages, newImageUrl];
      
      await updateDoc(propertyRef, { images: updatedImages });
      
      // Update local state
      const updatedProperty = { ...selectedProperty, images: updatedImages };
      setSelectedProperty(updatedProperty);
      setProperties(properties.map(p => 
        p.id === selectedProperty.id ? updatedProperty : p
      ));
      
      setOpenImageDialog(false);
      setNewImageUrl("");
      
      toast({
        title: "تمت إضافة الصورة بنجاح",
        description: "تمت إضافة الصورة الجديدة بنجاح",
      });
    } catch (error) {
      console.error("Error adding image:", error);
      toast({
        title: "خطأ في إضافة الصورة",
        description: "حدث خطأ أثناء إضافة الصورة، يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    }
  };

  const handleDeleteImage = async () => {
    try {
      if (!selectedProperty || !imageToDelete) return;
      
      const propertyRef = doc(db, COLLECTIONS.PROPERTIES, selectedProperty.id);
      
      // Filter out the image to delete
      const filteredImages = selectedProperty.images.filter(img => img !== imageToDelete);
      
      await updateDoc(propertyRef, { images: filteredImages });
      
      // Update local state
      const updatedProperty = { ...selectedProperty, images: filteredImages };
      setSelectedProperty(updatedProperty);
      setProperties(properties.map(p => 
        p.id === selectedProperty.id ? updatedProperty : p
      ));
      
      setImageToDelete("");
      
      toast({
        title: "تم حذف الصورة بنجاح",
        description: "تم حذف الصورة بنجاح",
      });
    } catch (error) {
      console.error("Error deleting image:", error);
      toast({
        title: "خطأ في حذف الصورة",
        description: "حدث خطأ أثناء حذف الصورة، يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    }
  };

  // Make sure user has proper access
  if (user && !["super_admin", "property_admin"].includes(user.role)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">غير مصرح</h1>
        <p>ليس لديك صلاحية للوصول إلى هذه الصفحة.</p>
      </div>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-[1200px]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">إدارة العقارات</h1>
        <Button onClick={() => navigate("/admin")}>
          العودة للوحة التحكم
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg shadow p-4 overflow-y-auto max-h-[600px]">
              <h2 className="text-xl font-bold mb-4">قائمة العقارات</h2>
              <div className="space-y-2">
                {properties.length === 0 ? (
                  <p className="text-muted-foreground">لا يوجد عقارات متاحة</p>
                ) : (
                  properties.map((property) => (
                    <div
                      key={property.id}
                      className={`p-3 rounded-md cursor-pointer transition-colors ${
                        selectedProperty?.id === property.id
                          ? "bg-primary/10 border border-primary"
                          : "hover:bg-accent"
                      }`}
                      onClick={() => handlePropertySelect(property.id)}
                    >
                      <h3 className="font-medium truncate">{property.title}</h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {property.location}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            {selectedProperty ? (
              <Card className="w-full">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-2xl">
                      {editMode ? "تعديل العقار" : selectedProperty.title}
                    </CardTitle>
                    <CardDescription>
                      {editMode ? "قم بتعديل تفاصيل العقار" : selectedProperty.location}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {editMode ? (
                      <>
                        <Button variant="secondary" onClick={() => setEditMode(false)}>
                          إلغاء
                        </Button>
                        <Button onClick={handleSaveChanges}>
                          حفظ التغييرات
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setOpenDeleteDialog(true)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setEditMode(true)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardHeader>

                <Tabs defaultValue="details" className="w-full">
                  <TabsList className="w-full rounded-t-none justify-start">
                    <TabsTrigger value="details">التفاصيل</TabsTrigger>
                    <TabsTrigger value="images">الصور ({selectedProperty.images?.length || 0})</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="details">
                    <CardContent className="pt-6">
                      {editMode ? (
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium mb-1 block">
                              العنوان
                            </label>
                            <Input
                              name="title"
                              value={formData.title || ""}
                              onChange={handleInputChange}
                            />
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium mb-1 block">
                              الموقع
                            </label>
                            <Input
                              name="location"
                              value={formData.location || ""}
                              onChange={handleInputChange}
                            />
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium mb-1 block">
                              السعر (بالجنيه المصري)
                            </label>
                            <Input
                              name="price"
                              type="number"
                              value={formData.price || ""}
                              onChange={handleInputChange}
                            />
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium mb-1 block">
                              الوصف
                            </label>
                            <Textarea
                              name="description"
                              value={formData.description || ""}
                              onChange={handleInputChange}
                              rows={5}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-sm font-medium text-muted-foreground">
                              الوصف
                            </h3>
                            <p className="mt-1">{selectedProperty.description}</p>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground">
                                السعر
                              </h3>
                              <p className="mt-1">{selectedProperty.price} ج.م / ليلة</p>
                            </div>
                            
                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground">
                                عدد الغرف
                              </h3>
                              <p className="mt-1">{selectedProperty.beds} غرفة نوم</p>
                            </div>
                            
                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground">
                                عدد الحمامات
                              </h3>
                              <p className="mt-1">{selectedProperty.baths} حمام</p>
                            </div>
                            
                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground">
                                الضيوف
                              </h3>
                              <p className="mt-1">حتى {selectedProperty.guests} ضيف</p>
                            </div>
                          </div>
                          
                          {selectedProperty.amenities && (
                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground">
                                المميزات
                              </h3>
                              <div className="mt-1 flex flex-wrap gap-2">
                                {selectedProperty.amenities.map((amenity: string, index: number) => (
                                  <span
                                    key={index}
                                    className="px-2 py-1 bg-accent rounded-md text-sm"
                                  >
                                    {amenity}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </TabsContent>
                  
                  <TabsContent value="images">
                    <CardContent className="pt-6">
                      <div className="mb-4 flex justify-between items-center">
                        <h3 className="text-lg font-medium">إدارة الصور</h3>
                        <Button
                          variant="outline"
                          className="gap-2"
                          onClick={() => setOpenImageDialog(true)}
                        >
                          <ImagePlus className="h-4 w-4" />
                          إضافة صورة جديدة
                        </Button>
                      </div>
                      
                      {selectedProperty.images && selectedProperty.images.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedProperty.images.map((image, index) => (
                            <div key={index} className="relative group rounded-lg overflow-hidden aspect-video">
                              <img
                                src={image}
                                alt={`صورة ${index + 1} لـ ${selectedProperty.title}`}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    setImageToDelete(image);
                                    handleDeleteImage();
                                  }}
                                >
                                  <Trash className="h-4 w-4 mr-2" />
                                  حذف الصورة
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-10 border border-dashed rounded-lg">
                          <p className="text-muted-foreground">لا توجد صور لهذا العقار</p>
                          <Button
                            variant="outline"
                            className="mt-4 gap-2"
                            onClick={() => setOpenImageDialog(true)}
                          >
                            <ImagePlus className="h-4 w-4" />
                            إضافة صورة
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </TabsContent>
                </Tabs>

                <CardFooter className="border-t pt-6 flex justify-between">
                  <div className="text-sm text-muted-foreground">
                    آخر تحديث: {selectedProperty.updatedAt ? new Date(selectedProperty.updatedAt.toDate ? selectedProperty.updatedAt.toDate() : selectedProperty.updatedAt).toLocaleDateString() : 'غير محدد'}
                  </div>
                </CardFooter>
              </Card>
            ) : (
              <Card className="w-full flex items-center justify-center h-96">
                <CardContent>
                  <p className="text-center text-muted-foreground">
                    يرجى اختيار عقار من القائمة للعرض أو التعديل
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* حوار تأكيد الحذف */}
      <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من حذف هذا العقار؟</AlertDialogTitle>
            <AlertDialogDescription>
              هذا الإجراء لا يمكن التراجع عنه. سيتم إلغاء تفعيل العقار ولن يظهر للمستخدمين.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProperty}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* حوار إضافة صورة جديدة */}
      <AlertDialog open={openImageDialog} onOpenChange={setOpenImageDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>إضافة صورة جديدة</AlertDialogTitle>
            <AlertDialogDescription>
              أدخل رابط الصورة التي تريد إضافتها للعقار.
              يجب أن تكون الصورة بدقة عالية (1920×1080 بكسل على الأقل).
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <Input
            placeholder="https://example.com/image.jpg"
            value={newImageUrl}
            onChange={(e) => setNewImageUrl(e.target.value)}
            className="mt-2"
          />
          
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAddImage}
              disabled={!newImageUrl}
            >
              إضافة
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}