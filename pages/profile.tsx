import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShieldCheck, ShieldAlert, Info } from "lucide-react";
import { auth, isEmailVerified } from "@/lib/firebase";
import { MultiFactorAuth } from "@/components/auth/MultiFactorAuth";
import { EmailVerification } from "@/components/auth/EmailVerification";

const profileFormSchema = z.object({
  firstName: z.string().min(2, {
    message: "First name must be at least 2 characters.",
  }),
  lastName: z.string().min(2, {
    message: "Last name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  avatar: z.string().url().optional().or(z.literal("")),
});

const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(6, {
      message: "Current password is required.",
    }),
    newPassword: z.string().min(6, {
      message: "New password must be at least 6 characters.",
    }),
    confirmPassword: z.string().min(6, {
      message: "Confirm password is required.",
    }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ["confirmPassword"],
  });

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;

const Profile = () => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isMfaSetupVisible, setIsMfaSetupVisible] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  
  // Check if MFA is enabled whenever the component mounts or auth state changes
  useEffect(() => {
    const checkMfaStatus = async () => {
      if (auth.currentUser) {
        // Firebase multiFactor auth feature is removed due to compatibility issues
        // Will be implemented in a future update
        setMfaEnabled(false);
      }
    };
    
    checkMfaStatus();
  }, [user]);
  
  // Force refresh of the user when the security tab is selected
  // This will get the latest email verification status
  useEffect(() => {
    if (activeTab === "security" && auth.currentUser) {
      auth.currentUser.reload().catch(error => {
        console.error("Error refreshing user auth state:", error);
      });
    }
  }, [activeTab]);
  
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      avatar: user?.avatar || "",
    },
  });
  
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  const onProfileSubmit = async (data: ProfileFormValues) => {
    if (!user) return;
    
    setIsUpdatingProfile(true);
    
    try {
      await updateUser({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        avatar: data.avatar,
      });
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };
  
  const onPasswordSubmit = async (data: PasswordFormValues) => {
    setIsUpdatingPassword(true);
    
    try {
      // In a real app, this would make an API call to update the password
      // Simulating an API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      toast({
        title: "Password updated",
        description: "Your password has been updated successfully.",
      });
      
      passwordForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update password. Please check your current password and try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };
  
  if (!user) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p>Please log in to view your profile.</p>
      </div>
    );
  }
  
  const getInitials = () => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user.username.substring(0, 2).toUpperCase();
  };
  
  const getRoleBadge = () => {
    switch (user.role) {
      case "superadmin":
        return <Badge className="bg-red-500">Super Admin</Badge>;
      case "propertyadmin":
        return <Badge className="bg-blue-500">Property Admin</Badge>;
      default:
        return <Badge variant="outline">User</Badge>;
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8 flex flex-col sm:flex-row items-center sm:items-end gap-4">
        <Avatar className="h-24 w-24">
          <AvatarImage src={user.avatar} alt={user.username} />
          <AvatarFallback className="text-2xl">{getInitials()}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold">{user.firstName} {user.lastName}</h1>
          <div className="flex flex-wrap gap-2 items-center mt-1">
            <p className="text-gray-500">{user.email}</p>
            <span className="text-gray-300">•</span>
            {getRoleBadge()}
          </div>
        </div>
      </div>
      
      <Tabs 
        defaultValue="profile" 
        className="space-y-6"
        onValueChange={setActiveTab}
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={profileForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Your first name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Your last name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={profileForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Your email address" type="email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={profileForm.control}
                    name="avatar"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Avatar URL</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://example.com/avatar.jpg" />
                        </FormControl>
                        <FormDescription>
                          Enter a URL for your avatar image
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Account Status</div>
                    <div className="flex gap-2 items-center">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      <span className="text-sm text-gray-500">Active</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Reward Points</div>
                    <div className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-brand-orange">
                        <path d="M9.375 3a1.875 1.875 0 000 3.75h1.875v4.5H3.375A1.875 1.875 0 011.5 9.375v-.75c0-1.036.84-1.875 1.875-1.875h3.193A3.375 3.375 0 0112 2.753a3.375 3.375 0 015.432 3.997h3.943c1.035 0 1.875.84 1.875 1.875v.75c0 1.036-.84 1.875-1.875 1.875H12.75v-4.5h1.875a1.875 1.875 0 10-1.875-1.875V6.75h-1.5V4.875C11.25 3.839 10.41 3 9.375 3zM11.25 12.75H3v6.75a2.25 2.25 0 002.25 2.25h6v-9zM12.75 12.75v9h6.75a2.25 2.25 0 002.25-2.25v-6.75h-9z" />
                      </svg>
                      <span className="text-lg font-semibold">{user.rewardPoints}</span>
                      <Button variant="link" className="text-brand-orange p-0 h-auto text-sm" onClick={() => window.location.href = "/rewards"}>
                        View Rewards
                      </Button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button type="submit" disabled={isUpdatingProfile}>
                    {isUpdatingProfile ? "Saving..." : "Save Changes"}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </TabsContent>
        
        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>Password</CardTitle>
              <CardDescription>Update your password</CardDescription>
            </CardHeader>
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
                <CardContent className="space-y-4">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button type="submit" disabled={isUpdatingPassword}>
                    {isUpdatingPassword ? "Updating..." : "Update Password"}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </TabsContent>
        
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Enhance your account security with additional protection measures.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isMfaSetupVisible ? (
                <MultiFactorAuth 
                  onComplete={() => {
                    setIsMfaSetupVisible(false);
                    setMfaEnabled(true);
                    toast({
                      title: "Two-Factor Authentication Enabled",
                      description: "Your account is now more secure.",
                    });
                  }} 
                  onCancel={() => setIsMfaSetupVisible(false)} 
                />
              ) : (
                <div className="space-y-6">
                  {/* Email Verification Section */}
                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-3">Email Verification</h3>
                    <EmailVerification />
                  </div>
                  
                  <Separator />
                  
                  {/* Two-Factor Authentication Section */}
                  <div className="flex items-start space-x-4">
                    {mfaEnabled ? (
                      <ShieldCheck className="h-10 w-10 text-green-500 flex-shrink-0" />
                    ) : (
                      <ShieldAlert className="h-10 w-10 text-amber-500 flex-shrink-0" />
                    )}
                    <div className="flex-1 space-y-2">
                      <h3 className="text-lg font-medium">Two-Factor Authentication (2FA)</h3>
                      <p className="text-sm text-muted-foreground">
                        {mfaEnabled 
                          ? "Your account is protected with two-factor authentication. You'll need your phone to sign in."
                          : "Add an extra layer of security to your account by enabling two-factor authentication. You'll need access to your phone when signing in."}
                      </p>
                      <Button 
                        variant={mfaEnabled ? "outline" : "default"}
                        onClick={() => setIsMfaSetupVisible(true)}
                        disabled={mfaEnabled}
                      >
                        {mfaEnabled ? "Enabled" : "Enable 2FA"}
                      </Button>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Account Activity</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Review your recent sign-in activity and verify your account hasn't been compromised.
                    </p>
                    <div className="bg-muted p-4 rounded-md">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <Info className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Last login</span>
                        </div>
                        <span className="text-sm">{new Date().toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        For enhanced security, we recommend changing your password regularly and enabling two-factor authentication.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;
