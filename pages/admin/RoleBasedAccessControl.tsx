import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  Save, 
  Plus, 
  Trash, 
  Check, 
  X, 
  Lock, 
  Eye, 
  Edit, 
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Users,
  UserPlus,
  Key
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
import { Checkbox } from "@/components/ui/checkbox";
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
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  onSnapshot,
  orderBy, 
  serverTimestamp,
  arrayUnion,
  arrayRemove
} from "firebase/firestore";

// أنواع البيانات
interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isSystem?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: "create" | "read" | "update" | "delete" | "manage";
  isSystem?: boolean;
}

interface Resource {
  id: string;
  name: string;
  description: string;
  actions: Array<"create" | "read" | "update" | "delete" | "manage">;
  isSystem?: boolean;
}

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  customPermissions?: Permission[];
}

// الموارد الافتراضية للنظام
const defaultResources: Resource[] = [
  {
    id: "properties",
    name: "العقارات",
    description: "إدارة العقارات والمنشآت",
    actions: ["create", "read", "update", "delete", "manage"],
    isSystem: true
  },
  {
    id: "bookings",
    name: "الحجوزات",
    description: "إدارة حجوزات العقارات",
    actions: ["create", "read", "update", "delete"],
    isSystem: true
  },
  {
    id: "users",
    name: "المستخدمين",
    description: "إدارة حسابات المستخدمين",
    actions: ["create", "read", "update", "delete", "manage"],
    isSystem: true
  },
  {
    id: "restaurants",
    name: "المطاعم",
    description: "إدارة المطاعم والحجوزات",
    actions: ["create", "read", "update", "delete", "manage"],
    isSystem: true
  },
  {
    id: "reviews",
    name: "التقييمات",
    description: "إدارة تقييمات العقارات والمطاعم",
    actions: ["create", "read", "update", "delete"],
    isSystem: true
  },
  {
    id: "settings",
    name: "الإعدادات",
    description: "إدارة إعدادات التطبيق",
    actions: ["read", "update", "manage"],
    isSystem: true
  },
  {
    id: "notifications",
    name: "الإشعارات",
    description: "إدارة وإرسال الإشعارات",
    actions: ["create", "read", "delete", "manage"],
    isSystem: true
  },
  {
    id: "reports",
    name: "التقارير",
    description: "عرض وتحميل التقارير والإحصائيات",
    actions: ["read", "manage"],
    isSystem: true
  },
  {
    id: "loyalty",
    name: "برنامج الولاء",
    description: "إدارة برنامج النقاط والمكافآت",
    actions: ["read", "update", "manage"],
    isSystem: true
  }
];

// تعريف الأدوار الافتراضية
const defaultRoles: Omit<Role, "createdAt" | "updatedAt">[] = [
  {
    id: "super_admin",
    name: "المشرف الرئيسي",
    description: "صلاحيات كاملة على جميع جوانب النظام",
    permissions: [],
    isSystem: true
  },
  {
    id: "property_admin",
    name: "مشرف العقارات",
    description: "صلاحيات محدودة لإدارة العقارات والحجوزات الخاصة",
    permissions: [],
    isSystem: true
  },
  {
    id: "restaurant_admin",
    name: "مشرف المطاعم",
    description: "صلاحيات محدودة لإدارة المطاعم والحجوزات الخاصة",
    permissions: [],
    isSystem: true
  },
  {
    id: "support",
    name: "الدعم الفني",
    description: "صلاحيات محدودة للدعم الفني وخدمة العملاء",
    permissions: [],
    isSystem: true
  },
  {
    id: "analyst",
    name: "محلل البيانات",
    description: "صلاحيات القراءة فقط للتقارير والإحصائيات",
    permissions: [],
    isSystem: true
  }
];

// ترجمة وظائف الصلاحيات
const translateAction = (action: string): string => {
  switch (action) {
    case "create": return "إنشاء";
    case "read": return "قراءة";
    case "update": return "تعديل";
    case "delete": return "حذف";
    case "manage": return "إدارة كاملة";
    default: return action;
  }
};

// أيقونة لوظائف الصلاحيات
const getActionIcon = (action: string) => {
  switch (action) {
    case "create": return <Plus className="h-4 w-4" />;
    case "read": return <Eye className="h-4 w-4" />;
    case "update": return <Edit className="h-4 w-4" />;
    case "delete": return <Trash className="h-4 w-4" />;
    case "manage": return <Key className="h-4 w-4" />;
    default: return null;
  }
};

// انشاء صلاحية من مورد وإجراء
const createPermission = (resource: Resource, action: "create" | "read" | "update" | "delete" | "manage"): Permission => {
  return {
    id: `${resource.id}_${action}`,
    name: `${translateAction(action)} ${resource.name}`,
    description: `صلاحية ${translateAction(action)} على ${resource.name}`,
    resource: resource.id,
    action,
    isSystem: resource.isSystem
  };
};

// إنشاء الصلاحيات من الموارد المتاحة
const generateAllPermissions = (resources: Resource[]): Permission[] => {
  const permissions: Permission[] = [];
  
  resources.forEach(resource => {
    resource.actions.forEach(action => {
      permissions.push(createPermission(resource, action));
    });
  });
  
  return permissions;
};

const RoleBasedAccessControl = () => {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // حالة البيانات
  const [roles, setRoles] = useState<Role[]>([]);
  const [resources, setResources] = useState<Resource[]>(defaultResources);
  const [permissions, setPermissions] = useState<Permission[]>(generateAllPermissions(defaultResources));
  const [users, setUsers] = useState<User[]>([]);
  
  // حالة التحميل والأخطاء
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // حالة التحرير
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [editingResourceId, setEditingResourceId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<Omit<Role, "id" | "createdAt" | "updatedAt">>({
    name: "",
    description: "",
    permissions: []
  });
  const [newResource, setNewResource] = useState<Omit<Resource, "id">>({
    name: "",
    description: "",
    actions: ["read"]
  });
  
  // إضافة مورد جديد
  const [showAddResource, setShowAddResource] = useState(false);
  
  // تحرير صلاحيات المستخدم
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<Permission[]>([]);
  
  // تأكد من وجود الصلاحيات في قاعدة البيانات
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
    
    const initializeData = async () => {
      try {
        // جلب الموارد
        const resourcesRef = collection(db, "resources");
        const resourcesSnapshot = await getDocs(resourcesRef);
        
        // في حالة عدم وجود موارد، إنشاء الموارد الافتراضية
        if (resourcesSnapshot.empty) {
          console.log("Creating default resources...");
          for (const resource of defaultResources) {
            await setDoc(doc(db, "resources", resource.id), {
              ...resource,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
          }
        } else {
          // تحميل الموارد الموجودة
          const resourcesList: Resource[] = [];
          resourcesSnapshot.forEach(doc => {
            resourcesList.push({
              id: doc.id,
              ...doc.data()
            } as Resource);
          });
          setResources(resourcesList);
          
          // تحديث الصلاحيات بناءً على الموارد
          setPermissions(generateAllPermissions(resourcesList));
        }
        
        // جلب الأدوار
        const rolesRef = collection(db, "roles");
        const rolesSnapshot = await getDocs(rolesRef);
        
        // في حالة عدم وجود أدوار، إنشاء الأدوار الافتراضية
        if (rolesSnapshot.empty) {
          console.log("Creating default roles...");
          
          // إنشاء جميع الصلاحيات أولاً
          const allPermissions = generateAllPermissions(defaultResources);
          
          // إضافة الصلاحيات حسب الدور
          for (const role of defaultRoles) {
            let rolePermissions: Permission[] = [];
            
            if (role.id === "super_admin") {
              // المشرف الرئيسي لديه جميع الصلاحيات
              rolePermissions = [...allPermissions];
            } else if (role.id === "property_admin") {
              // مشرف العقارات لديه صلاحيات محددة
              rolePermissions = allPermissions.filter(p => 
                (p.resource === "properties" && ["create", "read", "update", "delete"].includes(p.action)) ||
                (p.resource === "bookings" && ["read", "update"].includes(p.action)) ||
                (p.resource === "reviews" && ["read"].includes(p.action))
              );
            } else if (role.id === "restaurant_admin") {
              // مشرف المطاعم لديه صلاحيات محددة
              rolePermissions = allPermissions.filter(p => 
                (p.resource === "restaurants" && ["create", "read", "update", "delete"].includes(p.action))
              );
            } else if (role.id === "support") {
              // الدعم الفني لديه صلاحيات القراءة والتحديث
              rolePermissions = allPermissions.filter(p => 
                (["read", "update"].includes(p.action) &&
                ["users", "bookings", "reviews"].includes(p.resource))
              );
            } else if (role.id === "analyst") {
              // محلل البيانات لديه صلاحيات القراءة فقط
              rolePermissions = allPermissions.filter(p => 
                p.action === "read" && ["reports", "bookings", "properties", "users"].includes(p.resource)
              );
            }
            
            await setDoc(doc(db, "roles", role.id), {
              ...role,
              permissions: rolePermissions,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
          }
        }
        
        // جلب المستخدمين
        const usersRef = collection(db, "users");
        const usersSnapshot = await getDocs(usersRef);
        
        const usersList: User[] = [];
        usersSnapshot.forEach(doc => {
          const userData = doc.data();
          usersList.push({
            id: doc.id,
            username: userData.username || "بدون اسم",
            email: userData.email || "",
            role: userData.role || "user",
            customPermissions: userData.customPermissions || []
          });
        });
        setUsers(usersList);
        
        // مراقبة التغييرات في الأدوار
        const unsubscribeRoles = onSnapshot(
          query(collection(db, "roles"), orderBy("name")),
          (snapshot) => {
            const rolesList: Role[] = [];
            snapshot.forEach(doc => {
              const data = doc.data();
              
              // تحويل التواريخ إلى كائنات Date
              let createdAt = new Date();
              let updatedAt = new Date();
              
              if (data.createdAt) {
                createdAt = typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate() : new Date(data.createdAt);
              }
              
              if (data.updatedAt) {
                updatedAt = typeof data.updatedAt.toDate === 'function' ? data.updatedAt.toDate() : new Date(data.updatedAt);
              }
              
              rolesList.push({
                id: doc.id,
                name: data.name,
                description: data.description,
                permissions: data.permissions || [],
                isSystem: data.isSystem,
                createdAt,
                updatedAt
              });
            });
            
            setRoles(rolesList);
            setLoading(false);
          },
          (err) => {
            console.error("Error fetching roles:", err);
            setError("حدث خطأ في جلب بيانات الأدوار");
            setLoading(false);
          }
        );
        
        // إلغاء الاشتراك في المراقبة عند إزالة المكون
        return () => {
          unsubscribeRoles();
        };
      } catch (err) {
        console.error("Error initializing RBAC data:", err);
        setError("حدث خطأ في تهيئة بيانات نظام الصلاحيات");
        setLoading(false);
      }
    };
    
    initializeData();
  }, [user, setLocation]);
  
  // حفظ دور جديد
  const saveNewRole = async () => {
    if (!newRole.name.trim()) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى إدخال اسم الدور",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setSaving(true);
      const db = getFirestore();
      
      // إنشاء معرف فريد من اسم الدور
      const roleId = newRole.name
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^\w\s]/gi, '');
      
      // التحقق من عدم وجود دور بنفس المعرف
      const roleRef = doc(db, "roles", roleId);
      const roleDoc = await getDoc(roleRef);
      
      if (roleDoc.exists()) {
        toast({
          title: "خطأ في الإضافة",
          description: "يوجد دور بنفس الاسم بالفعل",
          variant: "destructive"
        });
        setSaving(false);
        return;
      }
      
      // حفظ الدور الجديد
      await setDoc(roleRef, {
        ...newRole,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      toast({
        title: "تم الإضافة",
        description: "تم إضافة الدور الجديد بنجاح",
      });
      
      // إعادة تعيين النموذج
      setNewRole({
        name: "",
        description: "",
        permissions: []
      });
    } catch (err) {
      console.error("Error adding new role:", err);
      toast({
        title: "خطأ في الإضافة",
        description: "حدث خطأ أثناء إضافة الدور الجديد",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  
  // حفظ مورد جديد
  const saveNewResource = async () => {
    if (!newResource.name.trim()) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى إدخال اسم المورد",
        variant: "destructive"
      });
      return;
    }
    
    if (newResource.actions.length === 0) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى اختيار صلاحية واحدة على الأقل",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setSaving(true);
      const db = getFirestore();
      
      // إنشاء معرف فريد من اسم المورد
      const resourceId = newResource.name
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^\w\s]/gi, '');
      
      // التحقق من عدم وجود مورد بنفس المعرف
      const resourceRef = doc(db, "resources", resourceId);
      const resourceDoc = await getDoc(resourceRef);
      
      if (resourceDoc.exists()) {
        toast({
          title: "خطأ في الإضافة",
          description: "يوجد مورد بنفس الاسم بالفعل",
          variant: "destructive"
        });
        setSaving(false);
        return;
      }
      
      // حفظ المورد الجديد
      const newResourceWithId: Resource = {
        ...newResource,
        id: resourceId
      };
      
      await setDoc(resourceRef, {
        ...newResourceWithId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // إضافة المورد إلى القائمة المحلية
      setResources(prev => [...prev, newResourceWithId]);
      
      // إنشاء صلاحيات جديدة من المورد
      const newPermissions = newResourceWithId.actions.map(action => 
        createPermission(newResourceWithId, action)
      );
      
      // إضافة الصلاحيات الجديدة إلى القائمة المحلية
      setPermissions(prev => [...prev, ...newPermissions]);
      
      toast({
        title: "تم الإضافة",
        description: "تم إضافة المورد الجديد بنجاح",
      });
      
      // إعادة تعيين النموذج وإغلاق الحوار
      setNewResource({
        name: "",
        description: "",
        actions: ["read"]
      });
      setShowAddResource(false);
    } catch (err) {
      console.error("Error adding new resource:", err);
      toast({
        title: "خطأ في الإضافة",
        description: "حدث خطأ أثناء إضافة المورد الجديد",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  
  // تحديث صلاحيات دور
  const updateRolePermissions = async (roleId: string, permission: Permission, isChecked: boolean) => {
    try {
      const db = getFirestore();
      const roleRef = doc(db, "roles", roleId);
      
      if (isChecked) {
        // إضافة الصلاحية
        await updateDoc(roleRef, {
          permissions: arrayUnion(permission),
          updatedAt: serverTimestamp()
        });
      } else {
        // إزالة الصلاحية
        // لسوء الحظ، arrayRemove لا يعمل مباشرة مع الكائنات المعقدة
        // لذلك نحتاج إلى الحصول على القائمة الحالية وتحديثها يدويًا
        const roleDoc = await getDoc(roleRef);
        if (roleDoc.exists()) {
          const role = roleDoc.data() as Role;
          const updatedPermissions = role.permissions.filter(
            p => !(p.id === permission.id)
          );
          
          await updateDoc(roleRef, {
            permissions: updatedPermissions,
            updatedAt: serverTimestamp()
          });
        }
      }
    } catch (err) {
      console.error("Error updating role permissions:", err);
      toast({
        title: "خطأ في التحديث",
        description: "حدث خطأ أثناء تحديث صلاحيات الدور",
        variant: "destructive"
      });
    }
  };
  
  // حذف دور
  const deleteRole = async (roleId: string) => {
    if (!roleId) return;
    
    try {
      setSaving(true);
      const db = getFirestore();
      
      // التحقق من عدم استخدام الدور من قبل مستخدمين
      const usersRef = collection(db, "users");
      const usersWithRoleQuery = query(usersRef, where("role", "==", roleId));
      const usersWithRoleSnapshot = await getDocs(usersWithRoleQuery);
      
      if (!usersWithRoleSnapshot.empty) {
        toast({
          title: "لا يمكن حذف الدور",
          description: `هناك ${usersWithRoleSnapshot.size} مستخدم يستخدم هذا الدور. يرجى تغيير أدوارهم أولاً.`,
          variant: "destructive"
        });
        setSaving(false);
        return;
      }
      
      // حذف الدور
      await deleteDoc(doc(db, "roles", roleId));
      
      toast({
        title: "تم الحذف",
        description: "تم حذف الدور بنجاح",
      });
    } catch (err) {
      console.error("Error deleting role:", err);
      toast({
        title: "خطأ في الحذف",
        description: "حدث خطأ أثناء حذف الدور",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  
  // تحميل صلاحيات المستخدم للتعديل
  const loadUserPermissions = async (userId: string) => {
    try {
      const db = getFirestore();
      const userRef = doc(db, "users", userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserPermissions(userData.customPermissions || []);
        setSelectedUserId(userId);
      } else {
        setUserPermissions([]);
        toast({
          title: "خطأ في التحميل",
          description: "لم يتم العثور على المستخدم",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error("Error loading user permissions:", err);
      toast({
        title: "خطأ في التحميل",
        description: "حدث خطأ أثناء تحميل صلاحيات المستخدم",
        variant: "destructive"
      });
    }
  };
  
  // تحديث صلاحيات المستخدم
  const updateUserPermissions = async () => {
    if (!selectedUserId) return;
    
    try {
      setSaving(true);
      const db = getFirestore();
      const userRef = doc(db, "users", selectedUserId);
      
      await updateDoc(userRef, {
        customPermissions: userPermissions
      });
      
      toast({
        title: "تم التحديث",
        description: "تم تحديث صلاحيات المستخدم بنجاح",
      });
      
      // تحديث قائمة المستخدمين المحلية
      setUsers(users.map(u => 
        u.id === selectedUserId 
          ? { ...u, customPermissions: userPermissions } 
          : u
      ));
      
      // إعادة تعيين الحالة
      setSelectedUserId(null);
      setUserPermissions([]);
    } catch (err) {
      console.error("Error updating user permissions:", err);
      toast({
        title: "خطأ في التحديث",
        description: "حدث خطأ أثناء تحديث صلاحيات المستخدم",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  
  // التحقق من حالة الصلاحية
  const isPermissionChecked = (role: Role, permissionId: string): boolean => {
    return role.permissions.some(p => p.id === permissionId);
  };
  
  // التحقق من حالة صلاحية المستخدم
  const isUserPermissionChecked = (permissionId: string): boolean => {
    return userPermissions.some(p => p.id === permissionId);
  };
  
  // تحديث قائمة صلاحيات المستخدم
  const toggleUserPermission = (permission: Permission, isChecked: boolean) => {
    if (isChecked) {
      setUserPermissions(prev => [...prev, permission]);
    } else {
      setUserPermissions(prev => prev.filter(p => p.id !== permission.id));
    }
  };
  
  // الحصول على اسم الدور
  const getRoleName = (roleId: string): string => {
    const role = roles.find(r => r.id === roleId);
    return role ? role.name : roleId;
  };
  
  // الحصول على قائمة الإجراءات المتاحة
  const getAvailableActions = (): Array<"create" | "read" | "update" | "delete" | "manage"> => {
    return ["create", "read", "update", "delete", "manage"];
  };
  
  // إضافة أو إزالة إجراء من قائمة إجراءات المورد الجديد
  const toggleResourceAction = (action: "create" | "read" | "update" | "delete" | "manage") => {
    if (newResource.actions.includes(action)) {
      setNewResource({
        ...newResource,
        actions: newResource.actions.filter(a => a !== action)
      });
    } else {
      setNewResource({
        ...newResource,
        actions: [...newResource.actions, action]
      });
    }
  };
  
  // تجميع الصلاحيات حسب المورد
  const groupPermissionsByResource = (): Record<string, Permission[]> => {
    const grouped: Record<string, Permission[]> = {};
    
    permissions.forEach(permission => {
      if (!grouped[permission.resource]) {
        grouped[permission.resource] = [];
      }
      grouped[permission.resource].push(permission);
    });
    
    return grouped;
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
      <h1 className="text-3xl font-bold mb-6">إدارة الصلاحيات والأدوار</h1>
      
      <Tabs defaultValue="roles" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            الأدوار والصلاحيات
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            صلاحيات المستخدمين
          </TabsTrigger>
          <TabsTrigger value="resources" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            موارد النظام
          </TabsTrigger>
        </TabsList>
        
        {/* محتوى علامة تبويب الأدوار والصلاحيات */}
        <TabsContent value="roles">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* إحصائيات سريعة */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                  <span>الأدوار</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{roles.length}</div>
                <p className="text-sm text-muted-foreground">دور وظيفي في النظام</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                  <span>الصلاحيات</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{permissions.length}</div>
                <p className="text-sm text-muted-foreground">صلاحية متاحة في النظام</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-muted-foreground" />
                  <span>المستخدمين ذوي الصلاحيات المخصصة</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{users.filter(u => u.customPermissions && u.customPermissions.length > 0).length}</div>
                <p className="text-sm text-muted-foreground">مستخدم لديه صلاحيات مخصصة</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* قائمة الأدوار */}
            <div className="md:col-span-1">
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>الأدوار</CardTitle>
                  <CardDescription>
                    إدارة الأدوار الوظيفية في النظام
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {roles.map(role => (
                      <div
                        key={role.id}
                        className={`flex justify-between items-center p-3 rounded-md cursor-pointer transition-colors ${editingRoleId === role.id ? 'bg-muted' : 'hover:bg-muted/50'}`}
                        onClick={() => setEditingRoleId(role.id)}
                      >
                        <div className="flex-1">
                          <div className="font-medium flex items-center">
                            {role.name}
                            {role.isSystem && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge variant="outline" className="mr-2 text-xs">نظام</Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>هذا دور نظام أساسي ولا يمكن حذفه</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {role.description}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {role.permissions.length} صلاحية
                          </div>
                        </div>
                        
                        {!role.isSystem && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                              >
                                <Trash className="h-4 w-4 text-red-500" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>هل أنت متأكد من حذف هذا الدور؟</AlertDialogTitle>
                                <AlertDialogDescription>
                                  سيتم حذف الدور "{role.name}" ولن يمكن استعادته. تأكد من عدم وجود مستخدمين مرتبطين بهذا الدور قبل الحذف.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction 
                                  className="bg-red-600 hover:bg-red-700"
                                  onClick={() => deleteRole(role.id)}
                                >
                                  حذف
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-6">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        إضافة دور جديد
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>إضافة دور جديد</DialogTitle>
                        <DialogDescription>
                          أضف دورًا جديدًا مع تحديد الصلاحيات الخاصة به.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="role-name">اسم الدور</Label>
                          <Input
                            id="role-name"
                            placeholder="أدخل اسم الدور..."
                            value={newRole.name}
                            onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="role-description">وصف الدور</Label>
                          <Textarea
                            id="role-description"
                            placeholder="أدخل وصف الدور..."
                            value={newRole.description}
                            onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>الصلاحيات الأساسية</Label>
                          <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto p-2 border rounded-md">
                            {Object.entries(groupPermissionsByResource()).map(([resourceId, resourcePermissions]) => (
                              <div key={resourceId} className="space-y-2">
                                <div className="font-medium text-sm">{resources.find(r => r.id === resourceId)?.name || resourceId}</div>
                                <div className="grid grid-cols-2 gap-2">
                                  {resourcePermissions
                                    .sort((a, b) => {
                                      const actionOrder = { read: 1, create: 2, update: 3, delete: 4, manage: 5 };
                                      return actionOrder[a.action] - actionOrder[b.action];
                                    })
                                    .map(permission => (
                                      <div key={permission.id} className="flex items-center space-x-2 space-x-reverse">
                                        <Checkbox
                                          id={`new-role-${permission.id}`}
                                          checked={newRole.permissions.some(p => p.id === permission.id)}
                                          onCheckedChange={(checked) => {
                                            if (checked) {
                                              setNewRole({
                                                ...newRole,
                                                permissions: [...newRole.permissions, permission]
                                              });
                                            } else {
                                              setNewRole({
                                                ...newRole,
                                                permissions: newRole.permissions.filter(p => p.id !== permission.id)
                                              });
                                            }
                                          }}
                                        />
                                        <Label
                                          htmlFor={`new-role-${permission.id}`}
                                          className="text-xs flex items-center gap-1"
                                        >
                                          {getActionIcon(permission.action)}
                                          {translateAction(permission.action)}
                                        </Label>
                                      </div>
                                    ))
                                  }
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="outline">إلغاء</Button>
                        </DialogClose>
                        <Button 
                          onClick={saveNewRole} 
                          disabled={saving || !newRole.name}
                        >
                          {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                          حفظ الدور
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardFooter>
              </Card>
            </div>
            
            {/* تفاصيل الدور وصلاحياته */}
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    {editingRoleId ? (
                      <>
                        <span>صلاحيات دور: </span>
                        <span className="font-bold mr-2">
                          {roles.find(r => r.id === editingRoleId)?.name || editingRoleId}
                        </span>
                      </>
                    ) : (
                      "صلاحيات الدور"
                    )}
                  </CardTitle>
                  <CardDescription>
                    {editingRoleId ? (
                      roles.find(r => r.id === editingRoleId)?.description || ""
                    ) : (
                      "اختر دورًا من القائمة المجاورة لعرض وتعديل صلاحياته"
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!editingRoleId ? (
                    <div className="text-center py-16 text-muted-foreground">
                      <ShieldAlert className="h-16 w-16 mx-auto mb-4 opacity-20" />
                      <p>يرجى اختيار دور من القائمة لعرض وتعديل صلاحياته</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        {Object.entries(groupPermissionsByResource()).map(([resourceId, resourcePermissions]) => {
                          const resource = resources.find(r => r.id === resourceId);
                          if (!resource) return null;
                          
                          return (
                            <Accordion
                              key={resourceId}
                              type="single"
                              collapsible
                              className="border rounded-md"
                            >
                              <AccordionItem value="item-1" className="border-none">
                                <AccordionTrigger className="px-4 py-2 hover:no-underline">
                                  <div className="flex flex-col items-start">
                                    <div className="font-medium">{resource.name}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {resource.description}
                                    </div>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-4 pb-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                    {resourcePermissions
                                      .sort((a, b) => {
                                        const actionOrder = { read: 1, create: 2, update: 3, delete: 4, manage: 5 };
                                        return actionOrder[a.action] - actionOrder[b.action];
                                      })
                                      .map(permission => {
                                        const role = roles.find(r => r.id === editingRoleId);
                                        if (!role) return null;
                                        
                                        const isChecked = isPermissionChecked(role, permission.id);
                                        const isDisabled = role.isSystem && permission.isSystem;
                                        
                                        return (
                                          <div
                                            key={permission.id}
                                            className={`flex items-center justify-between border rounded-md p-3 ${isChecked ? 'bg-muted/30' : ''}`}
                                          >
                                            <div className="flex items-center gap-4">
                                              <div className="p-2 rounded-md bg-muted">
                                                {getActionIcon(permission.action)}
                                              </div>
                                              <div>
                                                <div className="font-medium text-sm">{permission.name}</div>
                                                <div className="text-xs text-muted-foreground">{permission.description}</div>
                                              </div>
                                            </div>
                                            <Switch
                                              checked={isChecked}
                                              disabled={isDisabled}
                                              onCheckedChange={(checked) => {
                                                updateRolePermissions(editingRoleId, permission, checked);
                                              }}
                                            />
                                          </div>
                                        );
                                      })
                                    }
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        {/* محتوى علامة تبويب صلاحيات المستخدمين */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>صلاحيات المستخدمين</CardTitle>
              <CardDescription>
                إدارة الصلاحيات المخصصة للمستخدمين بشكل مستقل عن أدوارهم
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* قائمة المستخدمين */}
                <div className="md:col-span-1">
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>المستخدم</TableHead>
                          <TableHead>الدور</TableHead>
                          <TableHead className="text-center">إجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.length > 0 ? (
                          users.map((user) => (
                            <TableRow key={user.id} className={selectedUserId === user.id ? 'bg-muted/40' : ''}>
                              <TableCell>
                                <div className="font-medium">{user.username}</div>
                                <div className="text-xs text-muted-foreground">{user.email}</div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{getRoleName(user.role)}</Badge>
                                {user.customPermissions && user.customPermissions.length > 0 && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    + {user.customPermissions.length} صلاحية مخصصة
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => loadUserPermissions(user.id)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                              لا يوجد مستخدمين
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                
                {/* تفاصيل صلاحيات المستخدم */}
                <div className="md:col-span-2">
                  <div className="border rounded-md p-4">
                    {!selectedUserId ? (
                      <div className="text-center py-16 text-muted-foreground">
                        <UserPlus className="h-16 w-16 mx-auto mb-4 opacity-20" />
                        <p>يرجى اختيار مستخدم من القائمة لعرض وتعديل صلاحياته</p>
                      </div>
                    ) : (
                      <>
                        {/* معلومات المستخدم */}
                        <div className="mb-6">
                          <h3 className="text-lg font-bold mb-2">
                            {users.find(u => u.id === selectedUserId)?.username || 'المستخدم'}
                          </h3>
                          <div className="text-sm text-muted-foreground mb-2">
                            {users.find(u => u.id === selectedUserId)?.email || ''}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">الدور الأساسي:</span>
                            <Badge variant="outline">
                              {getRoleName(users.find(u => u.id === selectedUserId)?.role || '')}
                            </Badge>
                          </div>
                        </div>
                        
                        <Separator className="my-4" />
                        
                        {/* صلاحيات إضافية */}
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-medium">الصلاحيات المخصصة</h3>
                            <Button 
                              onClick={updateUserPermissions} 
                              disabled={saving}
                              size="sm"
                            >
                              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                              <Save className="h-4 w-4 mr-2" />
                              حفظ التغييرات
                            </Button>
                          </div>
                          
                          <div className="space-y-4">
                            {Object.entries(groupPermissionsByResource()).map(([resourceId, resourcePermissions]) => {
                              const resource = resources.find(r => r.id === resourceId);
                              if (!resource) return null;
                              
                              return (
                                <Accordion
                                  key={resourceId}
                                  type="single"
                                  collapsible
                                  className="border rounded-md"
                                >
                                  <AccordionItem value="item-1" className="border-none">
                                    <AccordionTrigger className="px-4 py-2 hover:no-underline">
                                      <div className="font-medium">{resource.name}</div>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-4 pb-4">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                        {resourcePermissions
                                          .sort((a, b) => {
                                            const actionOrder = { read: 1, create: 2, update: 3, delete: 4, manage: 5 };
                                            return actionOrder[a.action] - actionOrder[b.action];
                                          })
                                          .map(permission => {
                                            const isChecked = isUserPermissionChecked(permission.id);
                                            
                                            return (
                                              <div
                                                key={permission.id}
                                                className={`flex items-center justify-between border rounded-md p-3 ${isChecked ? 'bg-muted/30' : ''}`}
                                              >
                                                <div className="flex items-center gap-4">
                                                  <div className="p-2 rounded-md bg-muted">
                                                    {getActionIcon(permission.action)}
                                                  </div>
                                                  <div>
                                                    <div className="font-medium text-sm">{permission.name}</div>
                                                    <div className="text-xs text-muted-foreground">{permission.description}</div>
                                                  </div>
                                                </div>
                                                <Switch
                                                  checked={isChecked}
                                                  onCheckedChange={(checked) => {
                                                    toggleUserPermission(permission, checked);
                                                  }}
                                                />
                                              </div>
                                            );
                                          })
                                        }
                                      </div>
                                    </AccordionContent>
                                  </AccordionItem>
                                </Accordion>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* محتوى علامة تبويب موارد النظام */}
        <TabsContent value="resources">
          <Card>
            <CardHeader>
              <CardTitle>موارد النظام</CardTitle>
              <CardDescription>
                عرض وإضافة موارد النظام التي يمكن تطبيق الصلاحيات عليها
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <Button onClick={() => setShowAddResource(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  إضافة مورد جديد
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {resources.map(resource => (
                  <Card key={resource.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">
                        {resource.name}
                        {resource.isSystem && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="outline" className="mr-2 text-xs">نظام</Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>هذا مورد نظام أساسي ولا يمكن تعديله</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </CardTitle>
                      <CardDescription>{resource.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {resource.actions.map(action => (
                          <Badge key={action} variant="secondary" className="flex items-center gap-1">
                            {getActionIcon(action)}
                            {translateAction(action)}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* حوار إضافة مورد جديد */}
      <Dialog open={showAddResource} onOpenChange={setShowAddResource}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة مورد جديد</DialogTitle>
            <DialogDescription>
              أضف موردًا جديدًا مع تحديد الإجراءات المتاحة عليه.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="resource-name">اسم المورد</Label>
              <Input
                id="resource-name"
                placeholder="أدخل اسم المورد..."
                value={newResource.name}
                onChange={(e) => setNewResource({ ...newResource, name: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="resource-description">وصف المورد</Label>
              <Textarea
                id="resource-description"
                placeholder="أدخل وصف المورد..."
                value={newResource.description}
                onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>الإجراءات المتاحة</Label>
              <div className="grid grid-cols-2 gap-4">
                {getAvailableActions().map(action => (
                  <div key={action} className="flex items-center space-x-2 space-x-reverse">
                    <Checkbox
                      id={`action-${action}`}
                      checked={newResource.actions.includes(action)}
                      onCheckedChange={() => toggleResourceAction(action)}
                    />
                    <Label
                      htmlFor={`action-${action}`}
                      className="flex items-center gap-1"
                    >
                      {getActionIcon(action)}
                      {translateAction(action)}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">إلغاء</Button>
            </DialogClose>
            <Button 
              onClick={saveNewResource} 
              disabled={saving || !newResource.name || newResource.actions.length === 0}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              حفظ المورد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoleBasedAccessControl;