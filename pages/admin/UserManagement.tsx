import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Shield, User, MoreHorizontal, UserCheck, UserX, Trash2 } from "lucide-react";
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
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  getFirestore, 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc,
  where
} from "firebase/firestore";

// تعريف نوع المستخدم
interface UserData {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'user' | 'property_admin' | 'service_admin' | 'super_admin';
  createdAt: Date;
  avatar?: string;
  disabled?: boolean;
  firebaseUid?: string;
}

// تعريف نوع الدور (Role)
type UserRole = 'user' | 'property_admin' | 'service_admin' | 'super_admin';

// Utility function to get role label in Arabic
const getRoleLabel = (role: UserRole): string => {
  switch (role) {
    case 'user':
      return 'مستخدم عادي';
    case 'property_admin':
      return 'مشرف عقار';
    case 'service_admin':
      return 'مشرف خدمة';
    case 'super_admin':
      return 'مشرف عام';
    default:
      return 'مستخدم عادي';
  }
};

// Utility function to get role badge color
const getRoleBadgeVariant = (role: UserRole): "default" | "secondary" | "destructive" | "outline" => {
  switch (role) {
    case 'user':
      return 'default';
    case 'property_admin':
      return 'secondary';
    case 'service_admin':
      return 'outline';
    case 'super_admin':
      return 'destructive';
    default:
      return 'default';
  }
};

const UserManagement = () => {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

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
    const usersRef = collection(db, "users");
    
    // استخدام onSnapshot للحصول على تحديثات مباشرة
    const unsubscribe = onSnapshot(
      usersRef,
      (snapshot) => {
        const usersData: UserData[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          usersData.push({
            id: doc.id,
            username: data.username || 'بدون اسم مستخدم',
            email: data.email || 'بدون بريد إلكتروني',
            firstName: data.firstName,
            lastName: data.lastName,
            role: data.role || 'user',
            createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
            avatar: data.avatar,
            disabled: data.disabled || false,
            firebaseUid: data.firebaseUid
          });
        });
        
        // ترتيب المستخدمين حسب الدور والتاريخ
        usersData.sort((a, b) => {
          // ترتيب حسب الدور أولاً (المشرفين العموميين في البداية)
          const roleOrder = { 'super_admin': 0, 'property_admin': 1, 'service_admin': 2, 'user': 3 };
          const roleComparison = roleOrder[a.role] - roleOrder[b.role];
          
          if (roleComparison !== 0) return roleComparison;
          
          // ثم حسب تاريخ الإنشاء (الأحدث أولاً)
          return b.createdAt.getTime() - a.createdAt.getTime();
        });
        
        setUsers(usersData);
        setFilteredUsers(usersData);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching users:", err);
        setError("حدث خطأ في جلب بيانات المستخدمين");
        setLoading(false);
      }
    );

    // إلغاء الاشتراك في المراقبة عند إزالة المكون
    return () => unsubscribe();
  }, [user, setLocation]);

  // تحديث قائمة المستخدمين عند تغيير مصطلح البحث
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(
        (user) => 
          user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.firstName && user.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (user.lastName && user.lastName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  // ترقية مستخدم إلى مشرف عقار
  const upgradeToPropertyAdmin = async (userId: string) => {
    try {
      setIsUpdating(userId);
      const db = getFirestore();
      const userRef = doc(db, "users", userId);
      
      await updateDoc(userRef, {
        role: 'property_admin'
      });
      
      toast({
        title: "تمت الترقية بنجاح",
        description: "تم ترقية المستخدم إلى مشرف عقار"
      });
    } catch (err) {
      console.error("Error upgrading user:", err);
      toast({
        title: "فشل في الترقية",
        description: "حدث خطأ أثناء ترقية المستخدم",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(null);
    }
  };

  // ترقية مستخدم إلى مشرف خدمة
  const upgradeToServiceAdmin = async (userId: string) => {
    try {
      setIsUpdating(userId);
      const db = getFirestore();
      const userRef = doc(db, "users", userId);
      
      await updateDoc(userRef, {
        role: 'service_admin'
      });
      
      toast({
        title: "تمت الترقية بنجاح",
        description: "تم ترقية المستخدم إلى مشرف خدمة"
      });
    } catch (err) {
      console.error("Error upgrading user:", err);
      toast({
        title: "فشل في الترقية",
        description: "حدث خطأ أثناء ترقية المستخدم",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(null);
    }
  };

  // تعطيل/تفعيل حساب مستخدم
  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      setIsUpdating(userId);
      const db = getFirestore();
      const userRef = doc(db, "users", userId);
      
      await updateDoc(userRef, {
        disabled: !currentStatus
      });
      
      toast({
        title: currentStatus ? "تم تفعيل الحساب" : "تم تعطيل الحساب",
        description: currentStatus 
          ? "تم تفعيل حساب المستخدم بنجاح" 
          : "تم تعطيل حساب المستخدم بنجاح"
      });
    } catch (err) {
      console.error("Error toggling user status:", err);
      toast({
        title: "فشل في تغيير حالة الحساب",
        description: "حدث خطأ أثناء تغيير حالة الحساب",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(null);
    }
  };

  // حذف مستخدم
  const deleteUser = async (userId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المستخدم؟ هذا الإجراء لا يمكن التراجع عنه.")) {
      return;
    }
    
    try {
      setIsUpdating(userId);
      const db = getFirestore();
      const userRef = doc(db, "users", userId);
      
      // حذف المستخدم من Firestore
      await deleteDoc(userRef);
      
      // ملاحظة: حذف المستخدم من Firebase Auth يحتاج إلى Cloud Function أو Admin SDK
      
      toast({
        title: "تم الحذف بنجاح",
        description: "تم حذف المستخدم بنجاح"
      });
    } catch (err) {
      console.error("Error deleting user:", err);
      toast({
        title: "فشل في الحذف",
        description: "حدث خطأ أثناء حذف المستخدم",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(null);
    }
  };

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
      <h1 className="text-3xl font-bold mb-6">إدارة المستخدمين</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>المستخدمين المسجلين</CardTitle>
          <CardDescription>
            عرض وإدارة جميع المستخدمين المسجلين في النظام
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center mb-4">
            <Input
              placeholder="بحث عن مستخدم..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <div className="mr-4 text-sm text-muted-foreground">
              {filteredUsers.length} مستخدم من أصل {users.length}
            </div>
          </div>
          
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">اسم المستخدم</TableHead>
                  <TableHead className="text-right">البريد الإلكتروني</TableHead>
                  <TableHead className="text-right">الدور</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">تاريخ التسجيل</TableHead>
                  <TableHead className="text-center">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id} className={user.disabled ? "bg-muted/50" : ""}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-2 overflow-hidden">
                            {user.avatar ? (
                              <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                            ) : (
                              <User className="h-4 w-4 text-gray-500" />
                            )}
                          </div>
                          <div>
                            <div>{user.username}</div>
                            {user.firstName && user.lastName && (
                              <div className="text-xs text-muted-foreground">
                                {user.firstName} {user.lastName}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {getRoleLabel(user.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.disabled ? (
                          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                            معطل
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                            نشط
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.createdAt.toLocaleDateString('ar-EG')}
                      </TableCell>
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              {isUpdating === user.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <MoreHorizontal className="h-4 w-4" />
                              )}
                              <span className="sr-only">فتح القائمة</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>إجراءات</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            
                            {user.role !== 'property_admin' && user.role !== 'super_admin' && (
                              <DropdownMenuItem 
                                onClick={() => upgradeToPropertyAdmin(user.id)}
                                disabled={isUpdating === user.id}
                              >
                                <Shield className="mr-2 h-4 w-4" />
                                <span>ترقية إلى مشرف عقار</span>
                              </DropdownMenuItem>
                            )}
                            
                            {user.role !== 'service_admin' && user.role !== 'super_admin' && (
                              <DropdownMenuItem 
                                onClick={() => upgradeToServiceAdmin(user.id)}
                                disabled={isUpdating === user.id}
                              >
                                <Shield className="mr-2 h-4 w-4" />
                                <span>ترقية إلى مشرف خدمة</span>
                              </DropdownMenuItem>
                            )}
                            
                            {user.role !== 'super_admin' && (
                              <>
                                <DropdownMenuItem 
                                  onClick={() => toggleUserStatus(user.id, user.disabled || false)}
                                  disabled={isUpdating === user.id}
                                >
                                  {user.disabled ? (
                                    <>
                                      <UserCheck className="mr-2 h-4 w-4 text-green-500" />
                                      <span>تفعيل الحساب</span>
                                    </>
                                  ) : (
                                    <>
                                      <UserX className="mr-2 h-4 w-4 text-amber-500" />
                                      <span>تعطيل الحساب</span>
                                    </>
                                  )}
                                </DropdownMenuItem>
                                
                                <DropdownMenuSeparator />
                                
                                <DropdownMenuItem 
                                  onClick={() => deleteUser(user.id)}
                                  disabled={isUpdating === user.id}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  <span>حذف المستخدم</span>
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      لا توجد نتائج مطابقة لبحثك
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => setSearchTerm("")}>إعادة تعيين</Button>
          <div className="text-sm text-muted-foreground">
            آخر تحديث: {new Date().toLocaleTimeString('ar-EG')}
          </div>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>ملاحظات هامة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>
            <span className="font-semibold">مشرف عقار</span>: يمكنه إدارة العقارات الخاصة به والاطلاع على الحجوزات المتعلقة بها
          </p>
          <p>
            <span className="font-semibold">مشرف خدمة</span>: يمكنه إدارة الخدمات مثل المطاعم والرحلات
          </p>
          <p>
            <span className="font-semibold">مشرف عام</span>: له كامل الصلاحيات في النظام
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            ملاحظة: تعطيل الحساب لا يحذف بيانات المستخدم، بل يمنعه فقط من تسجيل الدخول والوصول إلى النظام
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;