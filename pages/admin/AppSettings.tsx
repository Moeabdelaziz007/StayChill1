import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  Save, 
  RefreshCcw, 
  Plus, 
  Trash2, 
  Edit, 
  CheckCircle, 
  Moon, 
  Sun, 
  Gift, 
  Sparkles, 
  Palette, 
  Upload, 
  TrashIcon
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  onSnapshot,
  query,
  orderBy,
  addDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { 
  getStorage, 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject 
} from "firebase/storage";
import { v4 as uuidv4 } from "uuid";

// أنواع البيانات
interface ThemeSettings {
  primaryColor: string;
  logoUrl: string;
  mode: 'light' | 'dark' | 'system';
  borderRadius: number;
  fontFamily: string;
  secondaryColor: string;
}

interface LoyaltySettings {
  pointsPerBooking: number;
  pointsPerNight: number;
  pointsPerAmount: number;
  amountPerPoint: number;
  pointsToCurrencyRate: number;
  minPointsToRedeem: number;
  tiers: LoyaltyTier[];
}

interface LoyaltyTier {
  name: string;
  threshold: number;
  multiplier: number;
  benefits: string[];
}

interface PromotionalOffer {
  id: string;
  name: string;
  code: string;
  discount: number;
  discountType: 'percentage' | 'fixed';
  expiresAt: Date;
  active: boolean;
  applyTo: 'all' | 'properties' | 'restaurants';
  minBookingValue?: number;
  maxUsesPerUser?: number;
  createdAt: Date;
}

// قيم افتراضية للإعدادات
const defaultThemeSettings: ThemeSettings = {
  primaryColor: "#22C55E",
  logoUrl: "",
  mode: "system",
  borderRadius: 8,
  fontFamily: "Tajawal, Poppins, sans-serif",
  secondaryColor: "#0ea5e9"
};

const defaultLoyaltySettings: LoyaltySettings = {
  pointsPerBooking: 50,
  pointsPerNight: 10,
  pointsPerAmount: 2, // نقاط لكل 100 جنيه
  amountPerPoint: 0.5, // قيمة النقطة بالجنيه
  pointsToCurrencyRate: 0.1, // 10 نقاط = 1 جنيه
  minPointsToRedeem: 100,
  tiers: [
    {
      name: "فضي",
      threshold: 0,
      multiplier: 1,
      benefits: ["النقاط الأساسية"]
    },
    {
      name: "ذهبي",
      threshold: 500,
      multiplier: 1.5,
      benefits: ["نقاط مضاعفة", "خدمة عملاء مميزة"]
    },
    {
      name: "بلاتيني",
      threshold: 2000,
      multiplier: 2,
      benefits: ["نقاط مضاعفة مرتين", "خدمة عملاء VIP", "ترقيات مجانية"]
    }
  ]
};

const AppSettings = () => {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // حالة البيانات
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(defaultThemeSettings);
  const [loyaltySettings, setLoyaltySettings] = useState<LoyaltySettings>(defaultLoyaltySettings);
  const [offers, setOffers] = useState<PromotionalOffer[]>([]);
  
  // حالة التحرير
  const [editingTheme, setEditingTheme] = useState(false);
  const [editingLoyalty, setEditingLoyalty] = useState(false);
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  
  // حالة التحميل والأخطاء
  const [loadingTheme, setLoadingTheme] = useState(true);
  const [loadingLoyalty, setLoadingLoyalty] = useState(true);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [savingTheme, setSavingTheme] = useState(false);
  const [savingLoyalty, setSavingLoyalty] = useState(false);
  const [savingOffer, setSavingOffer] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // نموذج عرض جديد
  const [newOffer, setNewOffer] = useState<Omit<PromotionalOffer, 'id' | 'createdAt'>>({
    name: "",
    code: "",
    discount: 0,
    discountType: "percentage",
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // بعد 30 يوم
    active: true,
    applyTo: "all",
    minBookingValue: 0,
    maxUsesPerUser: 1
  });
  
  // مرجع للمدخلات
  const logoInputRef = useRef<HTMLInputElement>(null);
  
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
    
    // جلب إعدادات الثيم
    const themeDocRef = doc(db, "app_settings", "theme");
    const unsubscribeTheme = onSnapshot(
      themeDocRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data() as ThemeSettings;
          setThemeSettings(data);
        } else {
          // استخدام القيم الافتراضية إذا لم تكن هناك إعدادات موجودة
          setDoc(themeDocRef, defaultThemeSettings)
            .catch(err => console.error("Error creating default theme settings:", err));
        }
        setLoadingTheme(false);
      },
      (err) => {
        console.error("Error fetching theme settings:", err);
        setError("حدث خطأ في جلب إعدادات الثيم");
        setLoadingTheme(false);
      }
    );
    
    // جلب إعدادات نظام النقاط
    const loyaltyDocRef = doc(db, "app_settings", "loyalty");
    const unsubscribeLoyalty = onSnapshot(
      loyaltyDocRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data() as LoyaltySettings;
          setLoyaltySettings(data);
        } else {
          // استخدام القيم الافتراضية إذا لم تكن هناك إعدادات موجودة
          setDoc(loyaltyDocRef, defaultLoyaltySettings)
            .catch(err => console.error("Error creating default loyalty settings:", err));
        }
        setLoadingLoyalty(false);
      },
      (err) => {
        console.error("Error fetching loyalty settings:", err);
        setError("حدث خطأ في جلب إعدادات نظام النقاط");
        setLoadingLoyalty(false);
      }
    );
    
    // جلب العروض الترويجية
    const offersCollectionRef = collection(db, "app_settings", "promo", "offers");
    const offersQuery = query(offersCollectionRef, orderBy("createdAt", "desc"));
    
    const unsubscribeOffers = onSnapshot(
      offersQuery,
      (querySnapshot) => {
        const offersData: PromotionalOffer[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          
          // تحويل التواريخ إلى كائنات Date
          let expiresAt = new Date();
          let createdAt = new Date();
          
          if (data.expiresAt) {
            expiresAt = data.expiresAt instanceof Timestamp 
              ? data.expiresAt.toDate() 
              : new Date(data.expiresAt);
          }
          
          if (data.createdAt) {
            createdAt = data.createdAt instanceof Timestamp 
              ? data.createdAt.toDate() 
              : new Date(data.createdAt);
          }
          
          offersData.push({
            id: doc.id,
            name: data.name || "",
            code: data.code || "",
            discount: data.discount || 0,
            discountType: data.discountType || "percentage",
            expiresAt,
            active: data.active !== undefined ? data.active : true,
            applyTo: data.applyTo || "all",
            minBookingValue: data.minBookingValue,
            maxUsesPerUser: data.maxUsesPerUser,
            createdAt
          });
        });
        
        setOffers(offersData);
        setLoadingOffers(false);
      },
      (err) => {
        console.error("Error fetching offers:", err);
        setError("حدث خطأ في جلب العروض الترويجية");
        setLoadingOffers(false);
      }
    );
    
    // إلغاء الاشتراك في المراقبة عند إزالة المكون
    return () => {
      unsubscribeTheme();
      unsubscribeLoyalty();
      unsubscribeOffers();
    };
  }, [user, setLocation]);
  
  // حفظ إعدادات الثيم
  const saveThemeSettings = async () => {
    try {
      setSavingTheme(true);
      const db = getFirestore();
      const themeDocRef = doc(db, "app_settings", "theme");
      
      const themeDataToUpdate = {
        primaryColor: themeSettings.primaryColor,
        logoUrl: themeSettings.logoUrl,
        mode: themeSettings.mode,
        borderRadius: themeSettings.borderRadius,
        fontFamily: themeSettings.fontFamily,
        secondaryColor: themeSettings.secondaryColor
      };
      await updateDoc(themeDocRef, themeDataToUpdate);
      
      toast({
        title: "تم الحفظ",
        description: "تم حفظ إعدادات الثيم بنجاح",
      });
      
      setEditingTheme(false);
    } catch (err) {
      console.error("Error saving theme settings:", err);
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء حفظ إعدادات الثيم",
        variant: "destructive"
      });
    } finally {
      setSavingTheme(false);
    }
  };
  
  // حفظ إعدادات نظام النقاط
  const saveLoyaltySettings = async () => {
    try {
      setSavingLoyalty(true);
      const db = getFirestore();
      const loyaltyDocRef = doc(db, "app_settings", "loyalty");
      
      const loyaltyDataToUpdate = {
        pointsPerBooking: loyaltySettings.pointsPerBooking,
        pointsPerNight: loyaltySettings.pointsPerNight,
        pointsPerAmount: loyaltySettings.pointsPerAmount,
        amountPerPoint: loyaltySettings.amountPerPoint,
        pointsToCurrencyRate: loyaltySettings.pointsToCurrencyRate,
        minPointsToRedeem: loyaltySettings.minPointsToRedeem,
        tiers: loyaltySettings.tiers
      };
      await updateDoc(loyaltyDocRef, loyaltyDataToUpdate);
      
      toast({
        title: "تم الحفظ",
        description: "تم حفظ إعدادات نظام النقاط بنجاح",
      });
      
      setEditingLoyalty(false);
    } catch (err) {
      console.error("Error saving loyalty settings:", err);
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء حفظ إعدادات نظام النقاط",
        variant: "destructive"
      });
    } finally {
      setSavingLoyalty(false);
    }
  };
  
  // إضافة عرض ترويجي جديد
  const addPromotionalOffer = async () => {
    try {
      setSavingOffer(true);
      const db = getFirestore();
      const offersCollectionRef = collection(db, "app_settings", "promo", "offers");
      
      // تأكد من إنشاء المسار إذا لم يكن موجودًا
      const promoDocRef = doc(db, "app_settings", "promo");
      const promoDoc = await getDoc(promoDocRef);
      
      if (!promoDoc.exists()) {
        await setDoc(promoDocRef, { 
          createdAt: serverTimestamp() 
        });
      }
      
      await addDoc(offersCollectionRef, {
        ...newOffer,
        createdAt: serverTimestamp()
      });
      
      toast({
        title: "تم الإضافة",
        description: "تم إضافة العرض الترويجي بنجاح",
      });
      
      // إعادة تعيين النموذج
      setNewOffer({
        name: "",
        code: "",
        discount: 0,
        discountType: "percentage",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        active: true,
        applyTo: "all",
        minBookingValue: 0,
        maxUsesPerUser: 1
      });
    } catch (err) {
      console.error("Error adding promotional offer:", err);
      toast({
        title: "خطأ في الإضافة",
        description: "حدث خطأ أثناء إضافة العرض الترويجي",
        variant: "destructive"
      });
    } finally {
      setSavingOffer(false);
    }
  };
  
  // تحديث عرض ترويجي
  const updatePromotionalOffer = async (offerId: string, updatedData: Partial<PromotionalOffer>) => {
    try {
      setSavingOffer(true);
      const db = getFirestore();
      const offerDocRef = doc(db, "app_settings", "promo", "offers", offerId);
      
      await updateDoc(offerDocRef, updatedData);
      
      toast({
        title: "تم التحديث",
        description: "تم تحديث العرض الترويجي بنجاح",
      });
      
      setEditingOfferId(null);
    } catch (err) {
      console.error("Error updating promotional offer:", err);
      toast({
        title: "خطأ في التحديث",
        description: "حدث خطأ أثناء تحديث العرض الترويجي",
        variant: "destructive"
      });
    } finally {
      setSavingOffer(false);
    }
  };
  
  // حذف عرض ترويجي
  const deletePromotionalOffer = async (offerId: string) => {
    try {
      const db = getFirestore();
      const offerDocRef = doc(db, "app_settings", "promo", "offers", offerId);
      
      await deleteDoc(offerDocRef);
      
      toast({
        title: "تم الحذف",
        description: "تم حذف العرض الترويجي بنجاح",
      });
    } catch (err) {
      console.error("Error deleting promotional offer:", err);
      toast({
        title: "خطأ في الحذف",
        description: "حدث خطأ أثناء حذف العرض الترويجي",
        variant: "destructive"
      });
    }
  };
  
  // تحميل شعار جديد
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setUploadingLogo(true);
      const storage = getStorage();
      const logoId = uuidv4();
      const logoRef = ref(storage, `logos/${logoId}_${file.name}`);
      
      // حذف الشعار القديم إذا كان موجودًا
      if (themeSettings.logoUrl) {
        try {
          const oldLogoRef = ref(storage, themeSettings.logoUrl);
          await deleteObject(oldLogoRef);
        } catch (error) {
          console.log("Old logo does not exist or could not be deleted");
        }
      }
      
      // تحميل الشعار الجديد
      const uploadTask = uploadBytesResumable(logoRef, file);
      
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log("Upload is " + progress + "% done");
        },
        (error) => {
          console.error("Error uploading logo:", error);
          toast({
            title: "خطأ في التحميل",
            description: "حدث خطأ أثناء تحميل الشعار",
            variant: "destructive"
          });
          setUploadingLogo(false);
        },
        async () => {
          // الحصول على URL التحميل
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          // تحديث إعدادات الثيم
          setThemeSettings({
            ...themeSettings,
            logoUrl: downloadURL
          });
          
          // حفظ في قاعدة البيانات
          const db = getFirestore();
          const themeDocRef = doc(db, "app_settings", "theme");
          await updateDoc(themeDocRef, { logoUrl: downloadURL });
          
          toast({
            title: "تم التحميل",
            description: "تم تحميل الشعار بنجاح",
          });
          
          setUploadingLogo(false);
        }
      );
    } catch (err) {
      console.error("Error in logo upload process:", err);
      toast({
        title: "خطأ في التحميل",
        description: "حدث خطأ أثناء عملية تحميل الشعار",
        variant: "destructive"
      });
      setUploadingLogo(false);
    }
  };
  
  // تحديث خصائص الثيم
  const updateThemeSetting = (key: keyof ThemeSettings, value: any) => {
    setThemeSettings({
      ...themeSettings,
      [key]: value
    });
  };
  
  // تحديث خصائص نظام النقاط
  const updateLoyaltySetting = (key: keyof LoyaltySettings, value: any) => {
    setLoyaltySettings({
      ...loyaltySettings,
      [key]: value
    });
  };
  
  // تحديث خصائص العرض الجديد
  const updateNewOffer = (key: keyof typeof newOffer, value: any) => {
    setNewOffer({
      ...newOffer,
      [key]: value
    });
  };
  
  // تحديث مستوى نظام النقاط
  const updateLoyaltyTier = (index: number, key: keyof LoyaltyTier, value: any) => {
    const updatedTiers = [...loyaltySettings.tiers];
    updatedTiers[index] = {
      ...updatedTiers[index],
      [key]: value
    };
    
    setLoyaltySettings({
      ...loyaltySettings,
      tiers: updatedTiers
    });
  };
  
  // إضافة منفعة إلى مستوى نظام النقاط
  const addBenefitToTier = (tierIndex: number, benefit: string) => {
    if (!benefit.trim()) return;
    
    const updatedTiers = [...loyaltySettings.tiers];
    updatedTiers[tierIndex].benefits.push(benefit);
    
    setLoyaltySettings({
      ...loyaltySettings,
      tiers: updatedTiers
    });
  };
  
  // حذف منفعة من مستوى نظام النقاط
  const removeBenefitFromTier = (tierIndex: number, benefitIndex: number) => {
    const updatedTiers = [...loyaltySettings.tiers];
    updatedTiers[tierIndex].benefits.splice(benefitIndex, 1);
    
    setLoyaltySettings({
      ...loyaltySettings,
      tiers: updatedTiers
    });
  };
  
  // عرض رسالة التحميل
  if (loadingTheme || loadingLoyalty || loadingOffers) {
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
      <h1 className="text-3xl font-bold mb-6">إعدادات التطبيق</h1>
      
      <Tabs defaultValue="theme" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="theme" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            إعدادات الثيم
          </TabsTrigger>
          <TabsTrigger value="loyalty" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            نظام النقاط والمكافآت
          </TabsTrigger>
          <TabsTrigger value="offers" className="flex items-center gap-2">
            <Gift className="h-4 w-4" />
            العروض الترويجية
          </TabsTrigger>
        </TabsList>
        
        {/* محتوى علامة تبويب إعدادات الثيم */}
        <TabsContent value="theme">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>إعدادات الثيم والمظهر</span>
                <div className="flex items-center gap-2">
                  {editingTheme ? (
                    <>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setThemeSettings(defaultThemeSettings);
                          setEditingTheme(false);
                        }}
                      >
                        إلغاء
                      </Button>
                      <Button 
                        onClick={saveThemeSettings} 
                        disabled={savingTheme}
                      >
                        {savingTheme && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        حفظ
                      </Button>
                    </>
                  ) : (
                    <Button 
                      variant="outline" 
                      onClick={() => setEditingTheme(true)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      تعديل
                    </Button>
                  )}
                </div>
              </CardTitle>
              <CardDescription>
                تخصيص مظهر التطبيق، بما في ذلك الألوان والشعار والطابع العام
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* معاينة الألوان */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div 
                    className="h-20 rounded-md flex flex-col items-center justify-center text-white"
                    style={{ backgroundColor: themeSettings.primaryColor }}
                  >
                    <span>اللون الأساسي</span>
                    <span className="text-xs mt-1">{themeSettings.primaryColor}</span>
                  </div>
                  <div 
                    className="h-20 rounded-md flex flex-col items-center justify-center text-white"
                    style={{ backgroundColor: themeSettings.secondaryColor }}
                  >
                    <span>اللون الثانوي</span>
                    <span className="text-xs mt-1">{themeSettings.secondaryColor}</span>
                  </div>
                  <div 
                    className="h-20 rounded-md flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800"
                  >
                    <span>الوضع العادي</span>
                    <div className="flex items-center mt-1">
                      <Sun className="h-4 w-4 mr-1" />
                      <span className="text-xs">فاتح</span>
                    </div>
                  </div>
                  <div 
                    className="h-20 rounded-md flex flex-col items-center justify-center bg-gray-900 text-white"
                  >
                    <span>الوضع الليلي</span>
                    <div className="flex items-center mt-1">
                      <Moon className="h-4 w-4 mr-1" />
                      <span className="text-xs">داكن</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* الألوان والمظهر */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">الألوان والمظهر</h3>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="primaryColor" className="text-right block">اللون الأساسي</Label>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-8 h-8 rounded-full border"
                            style={{ backgroundColor: themeSettings.primaryColor }}
                          ></div>
                          <Input
                            id="primaryColor"
                            type="color"
                            value={themeSettings.primaryColor}
                            onChange={(e) => updateThemeSetting('primaryColor', e.target.value)}
                            disabled={!editingTheme}
                            className="w-16 h-10 p-1"
                          />
                          <Input 
                            type="text"
                            value={themeSettings.primaryColor}
                            onChange={(e) => updateThemeSetting('primaryColor', e.target.value)}
                            disabled={!editingTheme}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="secondaryColor" className="text-right block">اللون الثانوي</Label>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-8 h-8 rounded-full border"
                            style={{ backgroundColor: themeSettings.secondaryColor }}
                          ></div>
                          <Input
                            id="secondaryColor"
                            type="color"
                            value={themeSettings.secondaryColor}
                            onChange={(e) => updateThemeSetting('secondaryColor', e.target.value)}
                            disabled={!editingTheme}
                            className="w-16 h-10 p-1"
                          />
                          <Input 
                            type="text"
                            value={themeSettings.secondaryColor}
                            onChange={(e) => updateThemeSetting('secondaryColor', e.target.value)}
                            disabled={!editingTheme}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="mode" className="text-right block">وضع العرض الافتراضي</Label>
                        <Select
                          value={themeSettings.mode}
                          onValueChange={(value) => updateThemeSetting('mode', value)}
                          disabled={!editingTheme}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="اختر وضع العرض" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="light">فاتح</SelectItem>
                            <SelectItem value="dark">داكن</SelectItem>
                            <SelectItem value="system">تلقائي (حسب النظام)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="borderRadius" className="text-right block">انحناء الحواف (بكسل)</Label>
                        <div className="flex items-center gap-4">
                          <Input
                            id="borderRadius"
                            type="range"
                            min="0"
                            max="20"
                            value={themeSettings.borderRadius}
                            onChange={(e) => updateThemeSetting('borderRadius', parseInt(e.target.value))}
                            disabled={!editingTheme}
                            className="flex-1"
                          />
                          <span className="w-8 text-center">{themeSettings.borderRadius}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>0</span>
                          <span>10</span>
                          <span>20</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="fontFamily" className="text-right block">نوع الخط</Label>
                        <Select
                          value={themeSettings.fontFamily}
                          onValueChange={(value) => updateThemeSetting('fontFamily', value)}
                          disabled={!editingTheme}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="اختر نوع الخط" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Tajawal, Poppins, sans-serif">Tajawal / Poppins</SelectItem>
                            <SelectItem value="Cairo, Roboto, sans-serif">Cairo / Roboto</SelectItem>
                            <SelectItem value="IBM Plex Sans Arabic, sans-serif">IBM Plex Sans Arabic</SelectItem>
                            <SelectItem value="Noto Sans Arabic, sans-serif">Noto Sans Arabic</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
                  {/* الشعار والصور */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">الشعار والصور</h3>
                    
                    <div className="border rounded-md p-4 flex flex-col items-center justify-center">
                      {themeSettings.logoUrl ? (
                        <div className="text-center">
                          <img 
                            src={themeSettings.logoUrl} 
                            alt="شعار التطبيق" 
                            className="max-h-32 mx-auto mb-4"
                          />
                          {editingTheme && (
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => updateThemeSetting('logoUrl', '')}
                              className="mt-2"
                            >
                              <TrashIcon className="h-4 w-4 mr-2" />
                              حذف الشعار
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground">
                          <div className="w-32 h-32 border border-dashed rounded-md flex items-center justify-center mb-2 mx-auto">
                            <span>لا يوجد شعار</span>
                          </div>
                        </div>
                      )}
                      
                      {editingTheme && (
                        <div className="mt-4 w-full">
                          <input 
                            type="file" 
                            ref={logoInputRef}
                            onChange={handleLogoUpload}
                            accept="image/*"
                            className="hidden"
                          />
                          <Button 
                            variant="outline" 
                            onClick={() => logoInputRef.current?.click()}
                            disabled={uploadingLogo}
                            className="w-full"
                          >
                            {uploadingLogo ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <Upload className="h-4 w-4 mr-2" />
                            )}
                            {themeSettings.logoUrl ? 'تغيير الشعار' : 'رفع شعار'}
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4 bg-muted rounded-md">
                      <h4 className="font-medium mb-2 flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        نصائح لاختيار الشعار المناسب
                      </h4>
                      <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                        <li>يفضل استخدام صورة بخلفية شفافة (PNG)</li>
                        <li>أبعاد موصى بها: 512 × 512 بكسل كحد أدنى</li>
                        <li>يجب أن يكون الشعار واضحًا في أوضاع العرض الفاتح والداكن</li>
                        <li>تجنب استخدام نص صغير في الشعار، حيث قد يصعب قراءته على الشاشات الصغيرة</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                آخر تحديث: {new Date().toLocaleDateString('ar-EG')}
              </div>
              
              {editingTheme && (
                <Button onClick={saveThemeSettings} disabled={savingTheme}>
                  {savingTheme && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  <Save className="h-4 w-4 mr-2" />
                  حفظ التغييرات
                </Button>
              )}
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* محتوى علامة تبويب نظام النقاط والمكافآت */}
        <TabsContent value="loyalty">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>نظام النقاط والمكافآت</span>
                <div className="flex items-center gap-2">
                  {editingLoyalty ? (
                    <>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setLoyaltySettings(defaultLoyaltySettings);
                          setEditingLoyalty(false);
                        }}
                      >
                        إلغاء
                      </Button>
                      <Button 
                        onClick={saveLoyaltySettings} 
                        disabled={savingLoyalty}
                      >
                        {savingLoyalty && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        حفظ
                      </Button>
                    </>
                  ) : (
                    <Button 
                      variant="outline" 
                      onClick={() => setEditingLoyalty(true)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      تعديل
                    </Button>
                  )}
                </div>
              </CardTitle>
              <CardDescription>
                إعدادات نظام النقاط والمكافآت، وكيفية حساب النقاط ومستويات الولاء
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {/* إعدادات النقاط الأساسية */}
                <div>
                  <h3 className="text-lg font-medium mb-4">إعدادات النقاط الأساسية</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pointsPerBooking">نقاط لكل حجز</Label>
                      <Input
                        id="pointsPerBooking"
                        type="number"
                        value={loyaltySettings.pointsPerBooking}
                        onChange={(e) => updateLoyaltySetting('pointsPerBooking', parseInt(e.target.value))}
                        disabled={!editingLoyalty}
                      />
                      <p className="text-xs text-muted-foreground">
                        عدد النقاط التي يحصل عليها المستخدم عند إجراء أي حجز
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="pointsPerNight">نقاط لكل ليلة</Label>
                      <Input
                        id="pointsPerNight"
                        type="number"
                        value={loyaltySettings.pointsPerNight}
                        onChange={(e) => updateLoyaltySetting('pointsPerNight', parseInt(e.target.value))}
                        disabled={!editingLoyalty}
                      />
                      <p className="text-xs text-muted-foreground">
                        عدد النقاط الإضافية لكل ليلة في الحجز
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="pointsPerAmount">نقاط لكل 100 جنيه</Label>
                      <Input
                        id="pointsPerAmount"
                        type="number"
                        value={loyaltySettings.pointsPerAmount}
                        onChange={(e) => updateLoyaltySetting('pointsPerAmount', parseInt(e.target.value))}
                        disabled={!editingLoyalty}
                      />
                      <p className="text-xs text-muted-foreground">
                        عدد النقاط التي يحصل عليها المستخدم لكل 100 جنيه من قيمة الحجز
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="amountPerPoint">قيمة النقطة (بالجنيه)</Label>
                      <Input
                        id="amountPerPoint"
                        type="number"
                        step="0.1"
                        value={loyaltySettings.amountPerPoint}
                        onChange={(e) => updateLoyaltySetting('amountPerPoint', parseFloat(e.target.value))}
                        disabled={!editingLoyalty}
                      />
                      <p className="text-xs text-muted-foreground">
                        قيمة النقطة الواحدة عند استبدالها (بالجنيه المصري)
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="pointsToCurrencyRate">معدل تحويل النقاط إلى عملة</Label>
                      <Input
                        id="pointsToCurrencyRate"
                        type="number"
                        step="0.01"
                        value={loyaltySettings.pointsToCurrencyRate}
                        onChange={(e) => updateLoyaltySetting('pointsToCurrencyRate', parseFloat(e.target.value))}
                        disabled={!editingLoyalty}
                      />
                      <p className="text-xs text-muted-foreground">
                        معدل تحويل النقاط إلى عملة (كم جنيه يساوي كل نقطة)
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="minPointsToRedeem">الحد الأدنى للنقاط القابلة للاستبدال</Label>
                      <Input
                        id="minPointsToRedeem"
                        type="number"
                        value={loyaltySettings.minPointsToRedeem}
                        onChange={(e) => updateLoyaltySetting('minPointsToRedeem', parseInt(e.target.value))}
                        disabled={!editingLoyalty}
                      />
                      <p className="text-xs text-muted-foreground">
                        الحد الأدنى لعدد النقاط التي يمكن استبدالها في المرة الواحدة
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* مستويات نظام الولاء */}
                <div>
                  <h3 className="text-lg font-medium mb-4">مستويات نظام الولاء</h3>
                  
                  <div className="space-y-6">
                    {loyaltySettings.tiers.map((tier, index) => (
                      <Card key={index} className={`border ${index === 0 ? 'border-gray-200' : index === 1 ? 'border-yellow-200' : 'border-blue-200'}`}>
                        <CardHeader className={`pb-2 ${index === 0 ? 'bg-gray-50' : index === 1 ? 'bg-yellow-50' : 'bg-blue-50'}`}>
                          <CardTitle className="text-base flex items-center">
                            <div className="flex-1 flex items-center gap-2">
                              {index === 0 ? (
                                <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
                                  {tier.name}
                                </Badge>
                              ) : index === 1 ? (
                                <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                                  {tier.name}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                                  {tier.name}
                                </Badge>
                              )}
                            </div>
                            
                            {editingLoyalty && (
                              <Input
                                value={tier.name}
                                onChange={(e) => updateLoyaltyTier(index, 'name', e.target.value)}
                                className="max-w-[120px] h-8"
                              />
                            )}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>حد النقاط للوصول</Label>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  value={tier.threshold}
                                  onChange={(e) => updateLoyaltyTier(index, 'threshold', parseInt(e.target.value))}
                                  disabled={!editingLoyalty || index === 0} // المستوى الأول دائمًا يبدأ من 0
                                  className="flex-1"
                                />
                                <span className="text-sm text-muted-foreground whitespace-nowrap">نقطة</span>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <Label>معامل مضاعفة النقاط</Label>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  step="0.1"
                                  value={tier.multiplier}
                                  onChange={(e) => updateLoyaltyTier(index, 'multiplier', parseFloat(e.target.value))}
                                  disabled={!editingLoyalty}
                                  className="flex-1"
                                />
                                <span className="text-sm text-muted-foreground whitespace-nowrap">×</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-4">
                            <Label className="mb-2 block">مزايا هذا المستوى</Label>
                            
                            <div className="space-y-2">
                              {tier.benefits.map((benefit, benefitIndex) => (
                                <div key={benefitIndex} className="flex items-center gap-2">
                                  <div className="flex-1 bg-background rounded border px-3 py-1.5 text-sm">
                                    {benefit}
                                  </div>
                                  
                                  {editingLoyalty && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => removeBenefitFromTier(index, benefitIndex)}
                                      className="h-8 w-8"
                                    >
                                      <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                  )}
                                </div>
                              ))}
                              
                              {editingLoyalty && (
                                <div className="flex items-center gap-2 mt-2">
                                  <Input
                                    placeholder="أضف ميزة جديدة..."
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        addBenefitToTier(index, e.currentTarget.value);
                                        e.currentTarget.value = '';
                                      }
                                    }}
                                  />
                                  <Button
                                    variant="outline"
                                    onClick={(e) => {
                                      const input = e.currentTarget.previousSibling as HTMLInputElement;
                                      if (input.value) {
                                        addBenefitToTier(index, input.value);
                                        input.value = '';
                                      }
                                    }}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
                
                {/* معاينة احتساب النقاط */}
                <div className="bg-muted p-4 rounded-md">
                  <h3 className="text-lg font-medium mb-4">معاينة احتساب النقاط</h3>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-card p-4 rounded-md border">
                        <h4 className="font-medium text-center mb-2">حجز بقيمة 1000 جنيه</h4>
                        <div className="text-center text-3xl font-bold text-primary">
                          {loyaltySettings.pointsPerBooking + (1000 / 100 * loyaltySettings.pointsPerAmount)}
                        </div>
                        <div className="text-center text-sm text-muted-foreground">
                          نقطة ({loyaltySettings.pointsPerBooking} نقطة أساسية + {1000 / 100 * loyaltySettings.pointsPerAmount} نقطة من القيمة)
                        </div>
                      </div>
                      
                      <div className="bg-card p-4 rounded-md border">
                        <h4 className="font-medium text-center mb-2">حجز لمدة 3 ليالي</h4>
                        <div className="text-center text-3xl font-bold text-primary">
                          {loyaltySettings.pointsPerBooking + (3 * loyaltySettings.pointsPerNight)}
                        </div>
                        <div className="text-center text-sm text-muted-foreground">
                          نقطة ({loyaltySettings.pointsPerBooking} نقطة أساسية + {3 * loyaltySettings.pointsPerNight} نقطة من الليالي)
                        </div>
                      </div>
                      
                      <div className="bg-card p-4 rounded-md border">
                        <h4 className="font-medium text-center mb-2">قيمة {loyaltySettings.minPointsToRedeem} نقطة</h4>
                        <div className="text-center text-3xl font-bold text-primary">
                          {loyaltySettings.minPointsToRedeem * loyaltySettings.amountPerPoint} ج.م
                        </div>
                        <div className="text-center text-sm text-muted-foreground">
                          ({loyaltySettings.amountPerPoint} جنيه لكل نقطة)
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-card p-4 rounded-md border">
                      <h4 className="font-medium mb-2">مثال لعملية حجز كاملة:</h4>
                      <div className="text-sm">
                        <p className="mb-1">
                          🏠 حجز فيلا بقيمة 2000 جنيه لمدة 4 ليالي لعضو في المستوى {loyaltySettings.tiers[1].name}:
                        </p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                          <li>النقاط الأساسية: {loyaltySettings.pointsPerBooking}</li>
                          <li>نقاط الليالي: {4 * loyaltySettings.pointsPerNight}</li>
                          <li>نقاط القيمة: {2000 / 100 * loyaltySettings.pointsPerAmount}</li>
                          <li>معامل المضاعفة: {loyaltySettings.tiers[1].multiplier}×</li>
                          <li className="font-medium mt-2">المجموع: {Math.round((loyaltySettings.pointsPerBooking + (4 * loyaltySettings.pointsPerNight) + (2000 / 100 * loyaltySettings.pointsPerAmount)) * loyaltySettings.tiers[1].multiplier)} نقطة</li>
                          <li className="font-medium">القيمة بالجنيه: {Math.round((loyaltySettings.pointsPerBooking + (4 * loyaltySettings.pointsPerNight) + (2000 / 100 * loyaltySettings.pointsPerAmount)) * loyaltySettings.tiers[1].multiplier * loyaltySettings.amountPerPoint)} ج.م</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                آخر تحديث: {new Date().toLocaleDateString('ar-EG')}
              </div>
              
              {editingLoyalty && (
                <Button onClick={saveLoyaltySettings} disabled={savingLoyalty}>
                  {savingLoyalty && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  <Save className="h-4 w-4 mr-2" />
                  حفظ التغييرات
                </Button>
              )}
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* محتوى علامة تبويب العروض الترويجية */}
        <TabsContent value="offers">
          <Card>
            <CardHeader>
              <CardTitle>العروض الترويجية</CardTitle>
              <CardDescription>
                إدارة العروض الترويجية وكوبونات الخصم في التطبيق
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* إضافة عرض جديد */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">إضافة عرض ترويجي جديد</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">اسم العرض</Label>
                        <Input
                          id="name"
                          placeholder="مثال: عرض الصيف 2025"
                          value={newOffer.name}
                          onChange={(e) => updateNewOffer('name', e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="code">كود الخصم</Label>
                        <Input
                          id="code"
                          placeholder="مثال: SUMMER25"
                          value={newOffer.code}
                          onChange={(e) => updateNewOffer('code', e.target.value.toUpperCase())}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="discount">قيمة الخصم</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="discount"
                            type="number"
                            placeholder="قيمة الخصم"
                            value={newOffer.discount}
                            onChange={(e) => updateNewOffer('discount', parseFloat(e.target.value))}
                            className="flex-1"
                          />
                          <Select
                            value={newOffer.discountType}
                            onValueChange={(value) => updateNewOffer('discountType', value as 'percentage' | 'fixed')}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">٪ نسبة</SelectItem>
                              <SelectItem value="fixed">ج.م قيمة</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="expiresAt">تاريخ الانتهاء</Label>
                        <Input
                          id="expiresAt"
                          type="date"
                          value={newOffer.expiresAt.toISOString().split('T')[0]}
                          onChange={(e) => updateNewOffer('expiresAt', new Date(e.target.value))}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="applyTo">يطبق على</Label>
                        <Select
                          value={newOffer.applyTo}
                          onValueChange={(value) => updateNewOffer('applyTo', value as 'all' | 'properties' | 'restaurants')}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">جميع الخدمات</SelectItem>
                            <SelectItem value="properties">العقارات فقط</SelectItem>
                            <SelectItem value="restaurants">المطاعم فقط</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="minBookingValue">الحد الأدنى للحجز (ج.م)</Label>
                        <Input
                          id="minBookingValue"
                          type="number"
                          placeholder="0 = لا يوجد حد أدنى"
                          value={newOffer.minBookingValue}
                          onChange={(e) => updateNewOffer('minBookingValue', parseFloat(e.target.value))}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="maxUsesPerUser">أقصى عدد استخدامات للمستخدم</Label>
                        <Input
                          id="maxUsesPerUser"
                          type="number"
                          placeholder="0 = غير محدود"
                          value={newOffer.maxUsesPerUser}
                          onChange={(e) => updateNewOffer('maxUsesPerUser', parseInt(e.target.value))}
                        />
                      </div>
                      
                      <div className="flex items-center justify-end space-x-2 pt-6">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="active"
                            checked={newOffer.active}
                            onCheckedChange={(checked) => updateNewOffer('active', checked)}
                          />
                          <Label htmlFor="active">تفعيل العرض</Label>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between border-t pt-4">
                    <Button variant="outline" onClick={() => {
                      // إعادة تعيين نموذج الإضافة
                      setNewOffer({
                        name: "",
                        code: "",
                        discount: 0,
                        discountType: "percentage",
                        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                        active: true,
                        applyTo: "all",
                        minBookingValue: 0,
                        maxUsesPerUser: 1
                      });
                    }}>
                      إعادة التعيين
                    </Button>
                    <Button onClick={addPromotionalOffer} disabled={savingOffer || !newOffer.name || !newOffer.code || newOffer.discount <= 0}>
                      {savingOffer && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      <Plus className="h-4 w-4 mr-2" />
                      إضافة العرض
                    </Button>
                  </CardFooter>
                </Card>
                
                {/* قائمة العروض الحالية */}
                <div>
                  <h3 className="text-lg font-medium mb-4">العروض الترويجية الحالية</h3>
                  
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[200px]">اسم العرض</TableHead>
                          <TableHead>كود الخصم</TableHead>
                          <TableHead>قيمة الخصم</TableHead>
                          <TableHead className="text-center">مدة الصلاحية</TableHead>
                          <TableHead className="text-center">التطبيق</TableHead>
                          <TableHead className="text-center">الحالة</TableHead>
                          <TableHead className="text-center w-[100px]">إجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {offers.length > 0 ? (
                          offers.map((offer) => (
                            <TableRow key={offer.id}>
                              <TableCell className="font-medium">
                                {editingOfferId === offer.id ? (
                                  <Input
                                    value={offer.name}
                                    onChange={(e) => updatePromotionalOffer(offer.id, { name: e.target.value })}
                                  />
                                ) : (
                                  offer.name
                                )}
                              </TableCell>
                              <TableCell>
                                {editingOfferId === offer.id ? (
                                  <Input
                                    value={offer.code}
                                    onChange={(e) => updatePromotionalOffer(offer.id, { code: e.target.value.toUpperCase() })}
                                  />
                                ) : (
                                  <Badge variant="outline" className="font-mono">
                                    {offer.code}
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {editingOfferId === offer.id ? (
                                  <div className="flex items-center gap-2">
                                    <Input
                                      type="number"
                                      value={offer.discount}
                                      onChange={(e) => updatePromotionalOffer(offer.id, { discount: parseFloat(e.target.value) })}
                                      className="w-20"
                                    />
                                    <Select
                                      value={offer.discountType}
                                      onValueChange={(value) => updatePromotionalOffer(offer.id, { discountType: value as 'percentage' | 'fixed' })}
                                    >
                                      <SelectTrigger className="w-24">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="percentage">٪ نسبة</SelectItem>
                                        <SelectItem value="fixed">ج.م قيمة</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                ) : (
                                  <>
                                    {offer.discount}{offer.discountType === 'percentage' ? '%' : ' ج.م'}
                                  </>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                {editingOfferId === offer.id ? (
                                  <Input
                                    type="date"
                                    value={offer.expiresAt.toISOString().split('T')[0]}
                                    onChange={(e) => updatePromotionalOffer(offer.id, { expiresAt: new Date(e.target.value) })}
                                  />
                                ) : (
                                  <>
                                    {offer.expiresAt.toLocaleDateString('ar-EG')}
                                    {offer.expiresAt < new Date() && (
                                      <Badge variant="destructive" className="ml-2">
                                        منتهي
                                      </Badge>
                                    )}
                                  </>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                {editingOfferId === offer.id ? (
                                  <Select
                                    value={offer.applyTo}
                                    onValueChange={(value) => updatePromotionalOffer(offer.id, { applyTo: value as 'all' | 'properties' | 'restaurants' })}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="all">الكل</SelectItem>
                                      <SelectItem value="properties">العقارات</SelectItem>
                                      <SelectItem value="restaurants">المطاعم</SelectItem>
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <>
                                    {offer.applyTo === 'all' ? 'جميع الخدمات' : 
                                     offer.applyTo === 'properties' ? 'العقارات فقط' : 'المطاعم فقط'}
                                  </>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                {editingOfferId === offer.id ? (
                                  <div className="flex items-center justify-center">
                                    <Switch
                                      checked={offer.active}
                                      onCheckedChange={(checked) => updatePromotionalOffer(offer.id, { active: checked })}
                                    />
                                  </div>
                                ) : (
                                  <>
                                    {offer.active ? (
                                      <Badge variant="default">
                                        مفعّل
                                      </Badge>
                                    ) : (
                                      <Badge variant="secondary">
                                        معطّل
                                      </Badge>
                                    )}
                                  </>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center justify-center gap-2">
                                  {editingOfferId === offer.id ? (
                                    <Button
                                      variant="default"
                                      size="icon"
                                      onClick={() => setEditingOfferId(null)}
                                      className="h-8 w-8"
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => setEditingOfferId(offer.id)}
                                      className="h-8 w-8"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-100"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>تأكيد حذف العرض</DialogTitle>
                                        <DialogDescription>
                                          هل أنت متأكد من حذف العرض الترويجي "{offer.name}"؟ هذا الإجراء لا يمكن التراجع عنه.
                                        </DialogDescription>
                                      </DialogHeader>
                                      <DialogFooter>
                                        <DialogClose asChild>
                                          <Button variant="outline">إلغاء</Button>
                                        </DialogClose>
                                        <Button 
                                          variant="destructive" 
                                          onClick={() => deletePromotionalOffer(offer.id)}
                                        >
                                          حذف العرض
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
                              لا توجد عروض ترويجية حالية. أضف عرضًا باستخدام النموذج أعلاه.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AppSettings;