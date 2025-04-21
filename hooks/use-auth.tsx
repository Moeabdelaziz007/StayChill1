import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  signInWithGoogle, 
  signOutFromFirebase,
  getCurrentUser,
  onAuthStateChanged,
  auth,
  loginWithEmailAndPassword
} from "@/lib/firebase";
import { 
  handleAuthError, 
  isMfaError, 
  getMfaResolver,
  AuthErrorType 
} from "@/lib/firebase-errors";
import { sanitizeFirestoreData } from "@/lib/firestore-collections";
import { MultiFactorResolver } from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  collection,
  query,
  where,
  getDocs,
  updateDoc
} from "firebase/firestore";
import { UserRole } from "@/constants/userRoles";
import { getRedirectPathByRole } from "@/lib/route-protection";

// Define User type based on our application schema
type User = {
  id: number | string;
  email: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
  role: UserRole | string;  // تم تحديثه لدعم enum
  rewardPoints: number;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  firebaseUid: string | null;
};

// Login data types
type LoginData = {
  email: string;
  password: string;
};

// Admin login no longer requires adminKey
type AdminLoginData = LoginData;

type RegisterData = {
  email: string;
  password: string;
  username: string;
  firstName?: string;
  lastName?: string;
};

// Improved type for Firebase auth data with proper validation
type FirebaseAuthData = {
  firebaseUid: string;
  email: string;
  firstName?: string;
  lastName?: string;
  photoURL?: string;
  // Add optional display name for direct usage
  displayName?: string;
};

// Two-factor authentication resolver state
type MFAChallengeState = {
  resolver: MultiFactorResolver | null;
  isShowing: boolean;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  adminLoginMutation: UseMutationResult<User, Error, AdminLoginData>;
  registerMutation: UseMutationResult<User, Error, RegisterData>;
  googleLoginMutation: UseMutationResult<User, Error, void>;
  logoutMutation: UseMutationResult<void, Error, void>;
  // Two-factor authentication state
  mfaChallenge: MFAChallengeState;
  setMfaChallenge: (state: MFAChallengeState) => void;
  handleMfaCompletion: () => void;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  // حالة التحقق بخطوتين
  const [mfaChallenge, setMfaChallenge] = useState<MFAChallengeState>({
    resolver: null,
    isShowing: false
  });
  
  // Get the current user's data from the API with significantly improved caching
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | null, Error>({
    queryKey: ["/api/me"],
    queryFn: async () => {
      try {
        // Check for auth status in sessionStorage first (faster than API call)
        const sessionAuthStatus = sessionStorage.getItem('authStatus');
        
        // If we know for sure the user is not authenticated, don't make the API call
        if (sessionAuthStatus === 'unauthenticated') {
          console.log("Using cached unauthenticated status");
          return null;
        }
        
        // Then check if we already have a cached user in query cache
        const cachedUser = queryClient.getQueryData<User>(["/api/me"]);
        if (cachedUser) {
          console.log("Using cached user data from query cache");
          
          // Also store authenticated status in sessionStorage
          sessionStorage.setItem('authStatus', 'authenticated');
          return cachedUser;
        }

        // As a last resort, make the API call
        console.log("No cached auth data, making API call to /api/me");
        const res = await apiRequest("GET", "/api/me");
        
        if (res.status === 401) {
          // Cache the unauthenticated status to avoid repeated calls
          sessionStorage.setItem('authStatus', 'unauthenticated');
          return null;
        }
        
        const userData = await res.json();
        // Cache the authenticated status
        sessionStorage.setItem('authStatus', 'authenticated');
        return userData;
      } catch (error) {
        console.error("Error fetching user:", error);
        // Don't cache error states to allow retry on network recovery
        return null;
      }
    },
    // These settings are unused because they're overridden by the global defaults
    // for /api/me in queryClient.ts, but we keep them here for documentation
    staleTime: 30 * 60 * 1000, // 30 minutes before refetching
    gcTime: 24 * 60 * 60 * 1000, // Keep in cache for 24 hours
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: false // Don't retry auth requests
  });

  // وظيفة إكمال التحقق بخطوتين
  const handleMfaCompletion = () => {
    // إخفاء مكون التحقق بخطوتين
    setMfaChallenge({
      resolver: null,
      isShowing: false
    });
    
    // إعادة تحميل بيانات المستخدم من الخادم
    queryClient.invalidateQueries({ queryKey: ["/api/me"] });
    
    // تحديث الحالة
    sessionStorage.setItem('authStatus', 'authenticated');
    
    toast({
      title: "التحقق بخطوتين ناجح",
      description: "تم تسجيل الدخول بنجاح!",
    });
  };

  // Standard login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      try {
        // أولاً، محاولة تسجيل الدخول عبر Firebase
        await loginWithEmailAndPassword(credentials.email, credentials.password);
        
        // بعد النجاح، قم بتسجيل الدخول عبر واجهة API
        const res = await apiRequest("POST", "/api/login", credentials);
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || "Login failed");
        }
        return await res.json();
      } catch (error: any) {
        console.error("Login error:", error);
        
        // التحقق إذا كان الخطأ هو خطأ التحقق بخطوتين
        if (isMfaError(error)) {
          console.log("MFA required, showing challenge");
          
          // استخراج الـ resolver وعرض مكون التحقق بخطوتين
          const resolver = getMfaResolver(error);
          if (resolver) {
            setMfaChallenge({
              resolver,
              isShowing: true
            });
            
            // يجب إلقاء خطأ خاص لمنع إكمال تسجيل الدخول التلقائي
            throw new Error("Two-factor authentication required");
          }
        }
        
        // للأخطاء الأخرى، عالجها وأظهر رسالة خطأ
        const authError = handleAuthError(error);
        throw new Error(authError.message);
      }
    },
    onSuccess: (userData: User) => {
      // Update both query cache and session storage
      queryClient.setQueryData(["/api/me"], userData);
      sessionStorage.setItem('authStatus', 'authenticated');
      
      toast({
        title: "Login successful",
        description: `Welcome back${userData.firstName ? ', ' + userData.firstName : ''}!`,
      });
      
      // توجيه المستخدم حسب دوره
      const redirectPath = getRedirectPathByRole(userData.role as UserRole);
      window.location.href = redirectPath;
    },
    onError: (error: Error) => {
      // تجاهل رسالة الخطأ إذا كانت تتعلق بالتحقق بخطوتين وتم عرض التحدي
      if (error.message === "Two-factor authentication required" && mfaChallenge.isShowing) {
        return;
      }
      
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    },
  });

  // Initialize Firestore database
  const db = getFirestore();
  
  // Admin login mutation
  const adminLoginMutation = useMutation<User, Error, { email: string; password: string }>({
    mutationFn: async (credentials) => {
      try {
        console.log("Admin login attempt with:", credentials.email);
        
        // Standard admin login flow through the API
        const res = await apiRequest("POST", "/api/admin-login", credentials);
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || "Admin login failed");
        }
        return await res.json();
      } catch (error: any) {
        console.error("Admin login error:", error);
        throw new Error(error.message || "Admin login failed");
      }
    },
    onSuccess: (userData: User) => {
      // Update both query cache and session storage
      queryClient.setQueryData(["/api/me"], userData);
      sessionStorage.setItem('authStatus', 'authenticated');
      
      toast({
        title: "Admin login successful",
        description: `Welcome back, ${userData.role} ${userData.firstName || userData.username}!`,
      });
      
      // توجيه المستخدم حسب دوره
      const redirectPath = getRedirectPathByRole(userData.role as UserRole);
      window.location.href = redirectPath;
    },
    onError: (error: Error) => {
      toast({
        title: "Admin login failed",
        description: error.message || "Invalid admin credentials",
        variant: "destructive",
      });
    },
  });

  // Registration mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      const res = await apiRequest("POST", "/api/register", userData);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Registration failed");
      }
      return await res.json();
    },
    onSuccess: (userData: User) => {
      // Update both query cache and session storage
      queryClient.setQueryData(["/api/me"], userData);
      sessionStorage.setItem('authStatus', 'authenticated');
      
      toast({
        title: "Registration successful",
        description: "Your account has been created!",
      });
      
      // توجيه المستخدم حسب دوره
      const redirectPath = getRedirectPathByRole(userData.role as UserRole);
      window.location.href = redirectPath;
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Google login mutation
  const googleLoginMutation = useMutation({
    mutationFn: async () => {
      try {
        const userCredential = await signInWithGoogle();
        
        if (!userCredential || !userCredential.user) {
          throw new Error("Google authentication failed");
        }
        
        const { uid, email, displayName, photoURL } = userCredential.user;
        
        if (!uid || !email) {
          throw new Error("Incomplete user data from Google");
        }
        
        const names = displayName?.split(' ') || [];
        const firstName = names.length > 0 ? names[0] : null;
        const lastName = names.length > 1 ? names.slice(1).join(' ') : null;
        
        // Send Firebase authentication data to our backend
        const firebaseAuthData: FirebaseAuthData = {
          firebaseUid: uid,
          email,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          photoURL: photoURL || undefined,
        };
        
        const res = await apiRequest("POST", "/api/firebase-auth", firebaseAuthData);
        
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || "Firebase authentication failed on server");
        }
        
        return await res.json();
      } catch (error: any) {
        console.error("Google login error:", error);
        throw new Error(error.message || "Google login failed");
      }
    },
    onSuccess: (userData: User) => {
      // Update both query cache and session storage
      queryClient.setQueryData(["/api/me"], userData);
      sessionStorage.setItem('authStatus', 'authenticated');
      
      toast({
        title: "Google login successful",
        description: `Welcome, ${userData.firstName || userData.username}!`,
      });
      
      // توجيه المستخدم حسب دوره
      const redirectPath = getRedirectPathByRole(userData.role as UserRole);
      window.location.href = redirectPath;
    },
    onError: (error: Error) => {
      toast({
        title: "Google login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      // Sign out from Firebase if we were using it
      try {
        const currentUser = getCurrentUser();
        if (currentUser) {
          await signOutFromFirebase();
        }
      } catch (error) {
        console.error("Firebase sign out error:", error);
      }
      
      // Sign out from our backend
      const res = await apiRequest("POST", "/api/logout");
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Logout failed");
      }
    },
    onSuccess: () => {
      // Clear both query cache and session storage
      queryClient.setQueryData(["/api/me"], null);
      sessionStorage.setItem('authStatus', 'unauthenticated');
      
      toast({
        title: "Logout successful",
        description: "You have been logged out",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // استرجاع بيانات المستخدم المخزنة مؤقتًا عند تحميل التطبيق
  useEffect(() => {
    const cachedUser = localStorage.getItem('cachedUser');
    const timestamp = localStorage.getItem('userCacheTimestamp');

    if (cachedUser && timestamp && (Date.now() - parseInt(timestamp)) < 3600000) { // صالح لمدة ساعة
      try {
        const userData = JSON.parse(cachedUser);
        queryClient.setQueryData(["/api/me"], userData);
        console.log("Loaded user data from localStorage cache");
      } catch (e) {
        console.warn("خطأ في استرجاع بيانات المستخدم من التخزين المؤقت");
        localStorage.removeItem('cachedUser');
        localStorage.removeItem('userCacheTimestamp');
      }
    }
  }, []);

  // تخزين بيانات المستخدم في التخزين المؤقت عند تغييرها
  useEffect(() => {
    if (user) {
      localStorage.setItem('cachedUser', JSON.stringify(user));
      localStorage.setItem('userCacheTimestamp', Date.now().toString());
      console.log("Cached user data to localStorage");
    } else {
      localStorage.removeItem('cachedUser');
      localStorage.removeItem('userCacheTimestamp');
    }
  }, [user]);

  // Listen for Firebase auth state changes with improved synchronization
  useEffect(() => {
    // Maintain a processing flag to prevent multiple simultaneous requests
    let isProcessingAuth = false;
    
    // Keep track of the last attempted timestamp to implement backoff
    let lastAuthAttempt = 0;
    const MIN_AUTH_INTERVAL = 5000; // 5 seconds minimum between auth attempts
    
    const unsubscribe = onAuthStateChanged(async (firebaseUser) => {
      // Skip if we're already processing or if user is already loaded
      if (isProcessingAuth || (user && user.firebaseUid)) {
        return;
      }
      
      // Implement basic rate limiting
      const now = Date.now();
      if (now - lastAuthAttempt < MIN_AUTH_INTERVAL) {
        console.log("Skipping frequent auth attempt, will try later");
        return;
      }
      
      // Handle Firebase authentication
      if (firebaseUser) {
        try {
          isProcessingAuth = true;
          lastAuthAttempt = now;
          
          // If we have a Firebase user but no session, try to authenticate with the backend
          const { uid, email, displayName, photoURL } = firebaseUser;
          
          if (!uid || !email) {
            console.error("Incomplete user data from Firebase");
            isProcessingAuth = false;
            return;
          }
          
          // Check if we already have a cached user with this Firebase UID
          const existingUser = queryClient.getQueryData<User>(["/api/me"]);
          if (existingUser && existingUser.firebaseUid === uid) {
            console.log("Using cached Firebase auth user");
            isProcessingAuth = false;
            return;
          }
          
          // Process name information
          const names = displayName?.split(' ') || [];
          const firstName = names.length > 0 ? names[0] : null;
          const lastName = names.length > 1 ? names.slice(1).join(' ') : null;
          
          // Send enhanced Firebase authentication data to our backend
          const firebaseAuthData: FirebaseAuthData = {
            firebaseUid: uid,
            email,
            firstName: firstName || undefined,
            lastName: lastName || undefined,
            photoURL: photoURL || undefined,
            displayName: displayName || undefined
          };
          
          const res = await apiRequest("POST", "/api/firebase-auth", firebaseAuthData);
          
          if (res.ok) {
            const userData = await res.json();
            // Update our cache
            queryClient.setQueryData(["/api/me"], userData);
            console.log("Successfully synchronized Firebase user with backend");
          }
        } catch (error) {
          console.error("Firebase auth sync error:", error);
        } finally {
          isProcessingAuth = false;
        }
      }
    });
    
    return () => unsubscribe();
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        error,
        loginMutation,
        adminLoginMutation,
        registerMutation,
        googleLoginMutation,
        logoutMutation,
        mfaChallenge,
        setMfaChallenge,
        handleMfaCompletion
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}