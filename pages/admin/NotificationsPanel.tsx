import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  Send, 
  Users, 
  UserCog, 
  Mail, 
  BellRing, 
  Info, 
  AlertCircle, 
  CheckCircle
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
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  getFirestore, 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  getDoc,
  addDoc,
  orderBy,
  serverTimestamp,
  where,
  Timestamp,
  limit,
  getDocs
} from "firebase/firestore";
import { httpsCallable, getFunctions } from "firebase/functions";

// أنواع البيانات
interface Notification {
  id: string;
  title: string;
  body: string;
  target: "all" | "propertyAdmins" | "specific";
  email?: string;
  sentAt: Date;
  sentBy: string;
  status: "pending" | "sent" | "failed";
  recipients: number;
}

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  fcmToken?: string;
}

const NotificationsPanel = () => {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // حالة نموذج الإشعار
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationBody, setNotificationBody] = useState("");
  const [targetGroup, setTargetGroup] = useState<"all" | "propertyAdmins" | "specific">("all");
  const [targetEmail, setTargetEmail] = useState("");
  
  // حالة البيانات
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [userCount, setUserCount] = useState<{total: number, propertyAdmins: number}>({total: 0, propertyAdmins: 0});
  
  // حالة التحميل والأخطاء
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // جلب بيانات الإشعارات والمستخدمين
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
    
    // جلب بيانات الإشعارات
    const notificationsRef = collection(db, "notifications");
    const notificationsQuery = query(notificationsRef, orderBy("sentAt", "desc"), limit(20));
    
    const unsubscribeNotifications = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        const notificationsData: Notification[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          
          // تحويل التواريخ إلى كائنات Date
          let sentAt = new Date();
          
          if (data.sentAt) {
            sentAt = data.sentAt instanceof Timestamp 
              ? data.sentAt.toDate() 
              : new Date(data.sentAt);
          }
          
          notificationsData.push({
            id: doc.id,
            title: data.title || "",
            body: data.body || "",
            target: data.target || "all",
            email: data.email,
            sentAt,
            sentBy: data.sentBy || "غير معروف",
            status: data.status || "sent",
            recipients: data.recipients || 0
          });
        });
        
        setNotifications(notificationsData);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching notifications:", err);
        setError("حدث خطأ في جلب بيانات الإشعارات");
        setLoading(false);
      }
    );
    
    // جلب عدد المستخدمين
    const usersRef = collection(db, "users");
    
    const fetchUserCounts = async () => {
      try {
        // إجمالي المستخدمين
        const totalUsersQuery = query(usersRef);
        const totalUsersSnapshot = await getDocs(totalUsersQuery);
        
        // عدد مشرفي العقارات
        const propertyAdminsQuery = query(usersRef, where("role", "==", "property_admin"));
        const propertyAdminsSnapshot = await getDocs(propertyAdminsQuery);
        
        // حفظ الأعداد
        setUserCount({
          total: totalUsersSnapshot.size,
          propertyAdmins: propertyAdminsSnapshot.size
        });
        
        // حفظ بيانات المستخدمين للاستخدام لاحقًا
        const usersData: User[] = [];
        totalUsersSnapshot.forEach((doc) => {
          const data = doc.data();
          usersData.push({
            id: doc.id,
            username: data.username || "بدون اسم",
            email: data.email || "",
            role: data.role || "user",
            fcmToken: data.fcmToken
          });
        });
        
        setUsers(usersData);
      } catch (err) {
        console.error("Error fetching user counts:", err);
      }
    };
    
    fetchUserCounts();
    
    // إلغاء الاشتراك في المراقبة عند إزالة المكون
    return () => {
      unsubscribeNotifications();
    };
  }, [user, setLocation]);
  
  // إرسال الإشعار
  const sendNotification = async () => {
    // التحقق من البيانات المدخلة
    if (!notificationTitle.trim()) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى إدخال عنوان الإشعار",
        variant: "destructive"
      });
      return;
    }
    
    if (!notificationBody.trim()) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى إدخال نص الإشعار",
        variant: "destructive"
      });
      return;
    }
    
    if (targetGroup === "specific" && !targetEmail.trim()) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى إدخال البريد الإلكتروني للمستخدم المستهدف",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setSending(true);
      
      // إعداد بيانات الإشعار
      const notificationData = {
        title: notificationTitle,
        body: notificationBody,
        target: targetGroup,
        email: targetGroup === "specific" ? targetEmail : undefined,
        sentAt: new Date(),
        sentBy: user?.username || user?.email || "مشرف النظام",
        status: "pending" as "pending",
        recipients: 0
      };
      
      // إضافة الإشعار إلى قاعدة البيانات
      const db = getFirestore();
      const notificationsRef = collection(db, "notifications");
      const docRef = await addDoc(notificationsRef, {
        ...notificationData,
        sentAt: serverTimestamp()
      });
      
      // استدعاء Cloud Function لإرسال الإشعار
      const functions = getFunctions();
      const sendAdminNotification = httpsCallable(functions, 'sendAdminNotification');
      
      try {
        // استدعاء الدالة
        const result = await sendAdminNotification({
          notificationId: docRef.id,
          title: notificationTitle,
          body: notificationBody,
          target: targetGroup,
          email: targetGroup === "specific" ? targetEmail : undefined
        });
        
        const data = result.data as { success: boolean, recipients: number, error?: string };
        
        if (data.success) {
          // تحديث حالة الإشعار في قاعدة البيانات
          const notificationRef = doc(db, "notifications", docRef.id);
          await getDoc(notificationRef);
          
          toast({
            title: "تم إرسال الإشعار",
            description: `تم إرسال الإشعار بنجاح إلى ${data.recipients} مستخدم`,
          });
          
          // إعادة تعيين النموذج
          setNotificationTitle("");
          setNotificationBody("");
          setTargetGroup("all");
          setTargetEmail("");
        } else {
          throw new Error(data.error || "فشل في إرسال الإشعار");
        }
      } catch (err) {
        console.error("Error calling Cloud Function:", err);
        
        toast({
          title: "فشل في إرسال الإشعار",
          description: "حدث خطأ أثناء محاولة إرسال الإشعار. يرجى المحاولة مرة أخرى لاحقًا.",
          variant: "destructive"
        });
        
        // تحديث حالة الإشعار إلى فاشل
        const notificationRef = doc(db, "notifications", docRef.id);
        await getDoc(notificationRef);
      }
    } catch (err) {
      console.error("Error sending notification:", err);
      
      toast({
        title: "خطأ في الإرسال",
        description: "حدث خطأ أثناء محاولة إرسال الإشعار. يرجى المحاولة مرة أخرى لاحقًا.",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };
  
  // عرض مؤشر التحميل
  if (loading) {
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
      <h1 className="text-3xl font-bold mb-6">لوحة الإشعارات</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span>إجمالي المستخدمين</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{userCount.total}</div>
            <p className="text-sm text-muted-foreground">مستخدم مسجل في النظام</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <UserCog className="h-5 w-5 text-muted-foreground" />
              <span>مشرفي العقارات</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{userCount.propertyAdmins}</div>
            <p className="text-sm text-muted-foreground">مالك عقار مسجل في النظام</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BellRing className="h-5 w-5 text-muted-foreground" />
              <span>الإشعارات المرسلة</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{notifications.length}</div>
            <p className="text-sm text-muted-foreground">إشعار تم إرساله من النظام</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* نموذج إرسال الإشعارات */}
        <Card>
          <CardHeader>
            <CardTitle>إرسال إشعار جديد</CardTitle>
            <CardDescription>
              إرسال إشعارات لمستخدمي التطبيق عبر Firebase Cloud Messaging
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notification-title">عنوان الإشعار</Label>
                <Input
                  id="notification-title"
                  placeholder="أدخل عنوان الإشعار..."
                  value={notificationTitle}
                  onChange={(e) => setNotificationTitle(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notification-body">نص الإشعار</Label>
                <Textarea
                  id="notification-body"
                  placeholder="أدخل نص الإشعار..."
                  rows={4}
                  value={notificationBody}
                  onChange={(e) => setNotificationBody(e.target.value)}
                  className="resize-none"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="target-group">الفئة المستهدفة</Label>
                <Select
                  value={targetGroup}
                  onValueChange={(value) => setTargetGroup(value as "all" | "propertyAdmins" | "specific")}
                >
                  <SelectTrigger id="target-group">
                    <SelectValue placeholder="حدد الفئة المستهدفة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع المستخدمين ({userCount.total})</SelectItem>
                    <SelectItem value="propertyAdmins">مشرفي العقارات فقط ({userCount.propertyAdmins})</SelectItem>
                    <SelectItem value="specific">مستخدم محدد</SelectItem>
                  </SelectContent>
                </Select>
                
                {targetGroup === "specific" && (
                  <div className="pt-3">
                    <Label htmlFor="target-email">البريد الإلكتروني للمستخدم</Label>
                    <Input
                      id="target-email"
                      placeholder="أدخل البريد الإلكتروني للمستخدم المستهدف..."
                      value={targetEmail}
                      onChange={(e) => setTargetEmail(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-between items-center border-t pt-6">
            <div className="text-sm text-muted-foreground">
              {targetGroup === "all" && (
                <span>سيتم إرسال الإشعار إلى جميع المستخدمين ({userCount.total})</span>
              )}
              {targetGroup === "propertyAdmins" && (
                <span>سيتم إرسال الإشعار إلى مشرفي العقارات فقط ({userCount.propertyAdmins})</span>
              )}
              {targetGroup === "specific" && (
                <span>سيتم إرسال الإشعار إلى {targetEmail || "مستخدم محدد"}</span>
              )}
            </div>
            <Button 
              onClick={sendNotification} 
              disabled={sending || !notificationTitle || !notificationBody || (targetGroup === "specific" && !targetEmail)}
            >
              {sending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              <Send className="h-4 w-4 mr-2" />
              إرسال الإشعار
            </Button>
          </CardFooter>
        </Card>
        
        {/* وصف وإرشادات */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>إرشادات الإشعارات</CardTitle>
              <CardDescription>
                معلومات مهمة حول كيفية إرسال الإشعارات وأفضل الممارسات
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>عن الإشعارات</AlertTitle>
                <AlertDescription>
                  يتم إرسال الإشعارات باستخدام Firebase Cloud Messaging (FCM) لتنبيه المستخدمين بالتحديثات المهمة أو العروض الجديدة.
                </AlertDescription>
              </Alert>
              
              <Alert variant="default">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>أفضل الممارسات</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    <li>حافظ على عناوين قصيرة وواضحة (أقل من 50 حرف)</li>
                    <li>اجعل نص الإشعار مختصرًا ومفيدًا (أقل من 150 حرف)</li>
                    <li>تجنب إرسال إشعارات متكررة في وقت قصير</li>
                    <li>استخدم الإشعارات للمعلومات المهمة فقط</li>
                  </ul>
                </AlertDescription>
              </Alert>
              
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>تنبيه</AlertTitle>
                <AlertDescription>
                  لا يمكن التراجع عن الإشعارات بعد إرسالها. تأكد من المحتوى قبل الضغط على زر الإرسال.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
          
          {/* تسجيل FCM Tokens */}
          <Card>
            <CardHeader>
              <CardTitle>حول توكنات FCM</CardTitle>
              <CardDescription>
                كيفية تسجيل توكنات Firebase Cloud Messaging للمستخدمين
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">
                يجب تسجيل توكن FCM لكل مستخدم عند تسجيل الدخول أو تحديث التوكن. استخدم الكود التالي في التطبيق:
              </p>
              
              <div className="bg-muted p-3 rounded-md font-mono text-xs">
                {`// في صفحة تسجيل الدخول بعد نجاح العملية
import { getMessaging, getToken } from "firebase/messaging";
import { doc, updateDoc } from "firebase/firestore";

// الحصول على توكن FCM
const messaging = getMessaging();
getToken(messaging, { 
  vapidKey: 'BPL_...' // مفتاح VAPID من إعدادات Cloud Messaging 
}).then((token) => {
  // تحديث توكن المستخدم في Firestore
  const userRef = doc(db, "users", user.uid);
  updateDoc(userRef, { fcmToken: token });
});`}
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  عدد المستخدمين الذين لديهم توكنات FCM مسجلة:
                </span>
                <Badge variant="outline">
                  {users.filter(user => user.fcmToken).length} / {userCount.total}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* سجل الإشعارات المرسلة */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>سجل الإشعارات المرسلة</CardTitle>
          <CardDescription>
            آخر {notifications.length} إشعار تم إرسالها من النظام
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>عنوان الإشعار</TableHead>
                  <TableHead>الفئة المستهدفة</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>المستلمين</TableHead>
                  <TableHead>تاريخ الإرسال</TableHead>
                  <TableHead>بواسطة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <TableRow key={notification.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{notification.title}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {notification.body}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {notification.target === "all" && (
                          <Badge variant="outline">كل المستخدمين</Badge>
                        )}
                        {notification.target === "propertyAdmins" && (
                          <Badge variant="outline">مشرفي العقارات</Badge>
                        )}
                        {notification.target === "specific" && (
                          <div>
                            <Badge variant="outline">مستخدم محدد</Badge>
                            <div className="text-xs text-muted-foreground mt-1">
                              {notification.email}
                            </div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {notification.status === "sent" && (
                          <Badge variant="default" className="bg-green-500">تم الإرسال</Badge>
                        )}
                        {notification.status === "pending" && (
                          <Badge variant="secondary">قيد الإرسال</Badge>
                        )}
                        {notification.status === "failed" && (
                          <Badge variant="destructive">فشل الإرسال</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {notification.recipients}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {notification.sentAt.toLocaleDateString('ar-EG')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {notification.sentAt.toLocaleTimeString('ar-EG')}
                        </div>
                      </TableCell>
                      <TableCell>
                        {notification.sentBy}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      لا توجد إشعارات مرسلة حتى الآن
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationsPanel;