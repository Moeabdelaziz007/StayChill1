import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  User,
  UserPlus,
  MoreVertical,
  Edit,
  Trash2,
  Shield,
  Mail,
  Key,
  Home,
  Award,
  Search,
  Filter,
  ArrowUpDown,
  Loader2
} from "lucide-react";

type UserData = {
  id: number;
  username: string;
  email: string;
  role: string;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
  createdAt: string;
  rewardPoints: number;
};

export function UsersManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get all users
  const { 
    data: users = [], 
    isLoading, 
    error 
  } = useQuery<UserData[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    }
  });
  
  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("DELETE", `/api/admin/users/${userId}`);
      if (!res.ok) throw new Error("Failed to delete user");
      return userId;
    },
    onSuccess: () => {
      toast({
        title: "تم حذف المستخدم بنجاح",
        variant: "default"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "فشل حذف المستخدم",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (userData: Partial<UserData> & { id: number }) => {
      const { id, ...data } = userData;
      const res = await apiRequest("PATCH", `/api/admin/users/${id}`, data);
      if (!res.ok) throw new Error("Failed to update user");
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "تم تحديث بيانات المستخدم بنجاح",
        variant: "default"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "فشل تحديث بيانات المستخدم",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: Omit<UserData, "id" | "createdAt">) => {
      const res = await apiRequest("POST", "/api/admin/users", userData);
      if (!res.ok) throw new Error("Failed to create user");
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "تم إنشاء المستخدم بنجاح",
        variant: "default"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsCreateDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "فشل إنشاء المستخدم",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.firstName?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (user.lastName?.toLowerCase() || "").includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });
  
  // Sort users
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (!sortBy) return 0;
    
    let valueA, valueB;
    
    switch(sortBy) {
      case "username":
        valueA = a.username.toLowerCase();
        valueB = b.username.toLowerCase();
        break;
      case "email":
        valueA = a.email.toLowerCase();
        valueB = b.email.toLowerCase();
        break;
      case "role":
        valueA = a.role.toLowerCase();
        valueB = b.role.toLowerCase();
        break;
      case "rewardPoints":
        valueA = a.rewardPoints;
        valueB = b.rewardPoints;
        break;
      case "createdAt":
        valueA = new Date(a.createdAt).getTime();
        valueB = new Date(b.createdAt).getTime();
        break;
      default:
        return 0;
    }
    
    const result = valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
    return sortOrder === "asc" ? result : -result;
  });
  
  // Toggle sort
  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };
  
  // Format date function
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };
  
  const getRoleBadgeColor = (role: string) => {
    switch(role) {
      case "super_admin":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "property_admin":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };
  
  const getRoleLabel = (role: string) => {
    switch(role) {
      case "super_admin":
        return "مشرف عام";
      case "property_admin":
        return "مشرف عقارات";
      case "user":
        return "مستخدم";
      default:
        return role;
    }
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>جاري تحميل بيانات المستخدمين...</CardTitle>
          <CardDescription>يرجى الانتظار</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-10 w-[250px]" />
              <Skeleton className="h-10 w-[120px]" />
            </div>
            <div className="space-y-2">
              {Array(7).fill(null).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>خطأ في تحميل بيانات المستخدمين</CardTitle>
          <CardDescription>حدث خطأ أثناء محاولة جلب بيانات المستخدمين</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] })}>
            إعادة المحاولة
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  const handleDeleteUser = (user: UserData) => {
    setEditingUser(user);
    setIsDeleteDialogOpen(true);
  };
  
  const handleEditUser = (user: UserData) => {
    setEditingUser(user);
    setIsEditDialogOpen(true);
  };
  
  const handleCreateUser = () => {
    setIsCreateDialogOpen(true);
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              إدارة المستخدمين
            </CardTitle>
            <CardDescription>
              عرض وإدارة جميع المستخدمين في النظام
            </CardDescription>
          </div>
          <Button onClick={handleCreateUser} className="bg-[#00182A] hover:bg-[#002D4A]">
            <UserPlus className="h-4 w-4 mr-2" />
            إضافة مستخدم جديد
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="البحث عن مستخدم..."
              className="pl-3 pr-10 rounded-md"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              className="border rounded-md border-gray-200 p-2 text-sm"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">جميع الأدوار</option>
              <option value="user">مستخدم</option>
              <option value="property_admin">مشرف عقارات</option>
              <option value="super_admin">مشرف عام</option>
            </select>
          </div>
        </div>
        
        {/* Table */}
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>
                  <div className="flex items-center cursor-pointer" onClick={() => toggleSort("username")}>
                    المستخدم
                    {sortBy === "username" && (
                      <ArrowUpDown className={`mr-2 h-4 w-4 transition-transform ${sortOrder === "desc" ? "rotate-180" : ""}`} />
                    )}
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center cursor-pointer" onClick={() => toggleSort("email")}>
                    البريد الإلكتروني
                    {sortBy === "email" && (
                      <ArrowUpDown className={`mr-2 h-4 w-4 transition-transform ${sortOrder === "desc" ? "rotate-180" : ""}`} />
                    )}
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center cursor-pointer" onClick={() => toggleSort("role")}>
                    الدور
                    {sortBy === "role" && (
                      <ArrowUpDown className={`mr-2 h-4 w-4 transition-transform ${sortOrder === "desc" ? "rotate-180" : ""}`} />
                    )}
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center cursor-pointer" onClick={() => toggleSort("rewardPoints")}>
                    نقاط المكافآت
                    {sortBy === "rewardPoints" && (
                      <ArrowUpDown className={`mr-2 h-4 w-4 transition-transform ${sortOrder === "desc" ? "rotate-180" : ""}`} />
                    )}
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center cursor-pointer" onClick={() => toggleSort("createdAt")}>
                    تاريخ التسجيل
                    {sortBy === "createdAt" && (
                      <ArrowUpDown className={`mr-2 h-4 w-4 transition-transform ${sortOrder === "desc" ? "rotate-180" : ""}`} />
                    )}
                  </div>
                </TableHead>
                <TableHead className="text-left">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">
                    <div className="flex flex-col items-center justify-center">
                      <User className="h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-gray-500 text-sm">لا توجد نتائج مطابقة</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                sortedUsers.map((user, index) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.username}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="h-4 w-4 text-gray-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{user.username}</p>
                          <p className="text-xs text-gray-500">
                            {user.firstName} {user.lastName}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge className={`${getRoleBadgeColor(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.rewardPoints.toLocaleString()}</TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditUser(user)}>
                            <Edit className="mr-2 h-4 w-4" />
                            تعديل
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteUser(user)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            حذف
                          </DropdownMenuItem>
                          {user.role === "user" && (
                            <DropdownMenuItem
                              onClick={() => updateUserMutation.mutate({ 
                                id: user.id, 
                                role: "property_admin" 
                              })}
                            >
                              <Home className="mr-2 h-4 w-4" />
                              ترقية إلى مشرف عقارات
                            </DropdownMenuItem>
                          )}
                          {user.role === "property_admin" && (
                            <DropdownMenuItem
                              onClick={() => updateUserMutation.mutate({ 
                                id: user.id, 
                                role: "user" 
                              })}
                            >
                              <Shield className="mr-2 h-4 w-4" />
                              تنزيل إلى مستخدم
                            </DropdownMenuItem>
                          )}
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
            <DialogTitle>تأكيد حذف المستخدم</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من رغبتك في حذف المستخدم{" "}
              <span className="font-semibold">{editingUser?.username}</span>؟
              لا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (editingUser) {
                  deleteUserMutation.mutate(editingUser.id);
                }
              }}
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              حذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تعديل بيانات المستخدم</DialogTitle>
            <DialogDescription>
              تعديل بيانات المستخدم {editingUser?.username}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-username">اسم المستخدم</Label>
              <Input
                id="edit-username"
                value={editingUser?.username || ""}
                onChange={(e) => setEditingUser(prev => prev ? {...prev, username: e.target.value} : null)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">البريد الإلكتروني</Label>
              <Input
                id="edit-email"
                type="email"
                value={editingUser?.email || ""}
                onChange={(e) => setEditingUser(prev => prev ? {...prev, email: e.target.value} : null)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-firstName">الاسم الأول</Label>
                <Input
                  id="edit-firstName"
                  value={editingUser?.firstName || ""}
                  onChange={(e) => setEditingUser(prev => prev ? {...prev, firstName: e.target.value} : null)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-lastName">الاسم الأخير</Label>
                <Input
                  id="edit-lastName"
                  value={editingUser?.lastName || ""}
                  onChange={(e) => setEditingUser(prev => prev ? {...prev, lastName: e.target.value} : null)}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-role">الدور</Label>
              <select
                id="edit-role"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={editingUser?.role || "user"}
                onChange={(e) => setEditingUser(prev => prev ? {...prev, role: e.target.value} : null)}
              >
                <option value="user">مستخدم</option>
                <option value="property_admin">مشرف عقارات</option>
                <option value="super_admin">مشرف عام</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-rewardPoints">نقاط المكافآت</Label>
              <Input
                id="edit-rewardPoints"
                type="number"
                value={editingUser?.rewardPoints || 0}
                onChange={(e) => setEditingUser(prev => prev ? {...prev, rewardPoints: parseInt(e.target.value)} : null)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              إلغاء
            </Button>
            <Button
              onClick={() => {
                if (editingUser) {
                  updateUserMutation.mutate({
                    id: editingUser.id,
                    username: editingUser.username,
                    email: editingUser.email,
                    firstName: editingUser.firstName,
                    lastName: editingUser.lastName,
                    role: editingUser.role,
                    rewardPoints: editingUser.rewardPoints
                  });
                }
              }}
              disabled={updateUserMutation.isPending}
              className="bg-[#00182A] hover:bg-[#002D4A]"
            >
              {updateUserMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              حفظ التغييرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>إضافة مستخدم جديد</DialogTitle>
            <DialogDescription>
              أدخل بيانات المستخدم الجديد
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="basic">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">معلومات أساسية</TabsTrigger>
              <TabsTrigger value="additional">معلومات إضافية</TabsTrigger>
            </TabsList>
            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid gap-2">
                <Label htmlFor="new-username">اسم المستخدم*</Label>
                <Input
                  id="new-username"
                  placeholder="example_user"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-email">البريد الإلكتروني*</Label>
                <Input
                  id="new-email"
                  type="email"
                  placeholder="user@example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-password">كلمة المرور*</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="********"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-role">الدور*</Label>
                <select
                  id="new-role"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  defaultValue="user"
                >
                  <option value="user">مستخدم</option>
                  <option value="property_admin">مشرف عقارات</option>
                  <option value="super_admin">مشرف عام</option>
                </select>
              </div>
            </TabsContent>
            <TabsContent value="additional" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="new-firstName">الاسم الأول</Label>
                  <Input
                    id="new-firstName"
                    placeholder="محمد"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="new-lastName">الاسم الأخير</Label>
                  <Input
                    id="new-lastName"
                    placeholder="أحمد"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-rewardPoints">نقاط المكافآت</Label>
                <Input
                  id="new-rewardPoints"
                  type="number"
                  defaultValue={0}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-avatar">صورة الملف الشخصي (URL)</Label>
                <Input
                  id="new-avatar"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              إلغاء
            </Button>
            <Button
              onClick={() => {
                // في الواقع، سنجمع البيانات من النموذج هنا
                // ولكن هذا مجرد مثال توضيحي
                createUserMutation.mutate({
                  username: (document.getElementById('new-username') as HTMLInputElement).value,
                  email: (document.getElementById('new-email') as HTMLInputElement).value,
                  password: (document.getElementById('new-password') as HTMLInputElement).value,
                  role: (document.getElementById('new-role') as HTMLSelectElement).value,
                  firstName: (document.getElementById('new-firstName') as HTMLInputElement)?.value || null,
                  lastName: (document.getElementById('new-lastName') as HTMLInputElement)?.value || null,
                  avatar: (document.getElementById('new-avatar') as HTMLInputElement)?.value || null,
                  rewardPoints: parseInt((document.getElementById('new-rewardPoints') as HTMLInputElement)?.value || '0')
                } as any);
              }}
              disabled={createUserMutation.isPending}
              className="bg-[#00182A] hover:bg-[#002D4A]"
            >
              {createUserMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              إنشاء المستخدم
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}