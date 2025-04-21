import { Switch, Route, Redirect } from "wouter";
import { lazy, Suspense } from "react";
import { useAuth } from "@/hooks/use-auth";
import MainLayout from "@/components/layout/MainLayout";
import AdminLayout from "@/components/layout/AdminLayout";
import NotFound from "@/pages/not-found";
import { AIQuickGuide } from "@/components/ai/AIQuickGuide";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from '@/components/layout/Header';
import { LocaleProvider } from "@/lib/i18n";
import { A11yProvider } from "@/components/a11y";
import { TwoFactorAuthChallenge } from "@/components/auth/TwoFactorAuthChallenge";
import MicroInteractionProvider from "@/components/animations/MicroInteractionContext";
import { NetworkErrorProvider } from "@/contexts/network-error-context";
import NetworkErrorContainer from "@/components/ui/network-error-container";
import AccessGuard from "@/components/auth/access-guard";
import { ACCESS_TIERS } from "@/lib/access-control";
import { RoleBasedRedirect } from "@/components/auth/RoleBasedRedirect";

// Lazy-loaded pages
const Home = lazy(() => import("@/pages/home"));
const PropertyDetails = lazy(() => import("@/pages/property"));
const Checkout = lazy(() => import("@/pages/checkout"));
const SearchResults = lazy(() => import("@/pages/search"));
const Profile = lazy(() => import("@/pages/profile"));
const MyBookings = lazy(() => import("@/pages/my-bookings"));
const Rewards = lazy(() => import("@/pages/rewards"));
const PropertyAnalytics = lazy(() => import("@/pages/property-analytics"));
const Services = lazy(() => import("@/pages/services"));
const Restaurant = lazy(() => import("@/pages/restaurant"));
const ComingSoon = lazy(() => import("@/pages/coming-soon"));
const TripPlanning = lazy(() => import("@/pages/trip-planning"));
const JourneyTrackerDemo = lazy(() => import("@/pages/journey-tracker-demo"));
const Translate = lazy(() => import("@/pages/translate"));
const AuthPage = lazy(() => import("@/pages/auth-page"));
const AccessibilitySettings = lazy(() => import("@/pages/accessibility-settings"));
const AnimationDemo = lazy(() => import("@/pages/animation-demo"));
const ErrorTesting = lazy(() => import("@/pages/error-testing"));

// Performance Optimized Pages
const OptimizedProperties = lazy(() => import("@/pages/optimized-properties"));

// Admin pages
const AdminProperties = lazy(() => import("@/pages/admin/properties"));
const AdminPropertyForm = lazy(() => import("@/pages/admin/property-form"));
const AdminUsers = lazy(() => import("@/pages/admin/users"));
const AdminBookings = lazy(() => import("@/pages/admin/bookings"));
const PaymentAnalytics = lazy(() => import("@/pages/admin/payment-analytics"));
const PropertyDashboard = lazy(() => import("@/pages/admin/property-dashboard"));
const PropertyForm = lazy(() => import("@/pages/admin/property-form"));
const SuperAdminDashboard = lazy(() => import("@/pages/admin/SuperAdminDashboard"));
const UserManagement = lazy(() => import("@/pages/admin/UserManagement"));
const PropertyBookingManagement = lazy(() => import("@/pages/admin/PropertyBookingManagement"));
const AppSettings = lazy(() => import("@/pages/admin/AppSettings"));
const NotificationsPanel = lazy(() => import("@/pages/admin/NotificationsPanel"));
const RoleBasedAccessControl = lazy(() => import("@/pages/admin/RoleBasedAccessControl"));
const SEODashboard = lazy(() => import("@/pages/admin/seo-dashboard"));
const LocationsManagement = lazy(() => import("@/pages/admin/LocationsManagement"));
const PropertyManagement = lazy(() => import("@/pages/admin/PropertyManagement"));

// Loading component
const Loading = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="w-10 h-10 border-4 border-light-gray rounded-full border-t-brand animate-spin"></div>
  </div>
);

// استخدام AccessGuard بدلاً من الوظيفة المخصصة
function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode, requiredRole?: string }) {
  // تحديد المستوى المطلوب بناءً على الدور المطلوب
  let requiredTier = ACCESS_TIERS.TIER_1; // المستوى الافتراضي للمستخدمين المسجلين
  
  if (requiredRole === 'Property_admin') {
    requiredTier = ACCESS_TIERS.TIER_2;
  } else if (requiredRole === 'super_admin') {
    requiredTier = ACCESS_TIERS.TIER_3;
  }
  
  return (
    <AccessGuard
      requiredTier={requiredTier}
      redirectTo="/auth"
      showToast={true}
      loadingComponent={<Loading />}
    >
      {children}
    </AccessGuard>
  );
}

function App() {
  const auth = useAuth();
  
  return (
    <ThemeProvider defaultTheme="system">
      <A11yProvider>
        <NetworkErrorProvider>
          <MicroInteractionProvider>
            <div>
            {/* AI Quick Guide - Floating button for AI features */}
            <AIQuickGuide />
            <Toaster />
            
            {/* نظام عرض أخطاء الشبكة */}
            <NetworkErrorContainer />
            
            {/* عرض مكون التحقق بخطوتين عند الحاجة */}
            {auth?.mfaChallenge?.isShowing && auth?.mfaChallenge?.resolver && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="max-w-md w-full">
                  <TwoFactorAuthChallenge 
                    resolver={auth.mfaChallenge.resolver}
                    onSuccess={auth.handleMfaCompletion}
                    onCancel={() => auth.setMfaChallenge({ resolver: null, isShowing: false })}
                  />
                </div>
              </div>
            )}
          
          {/* إضافة مكون التوجيه التلقائي حسب الدور ليعمل في جميع الصفحات */}
          <RoleBasedRedirect disabledPaths={["/auth", "/admin-login", "/login", "/register"]} />
          
          <Suspense fallback={<Loading />}>
            <Switch>
          {/* Public routes */}
          <Route path="/">
            <MainLayout>
              <Home />
            </MainLayout>
          </Route>
          
          <Route path="/property/:id">
            {(params) => (
              <MainLayout>
                <PropertyDetails id={parseInt(params.id)} />
              </MainLayout>
            )}
          </Route>
          
          <Route path="/search">
            <MainLayout>
              <SearchResults />
            </MainLayout>
          </Route>
          
          <Route path="/optimized-properties">
            <MainLayout>
              <OptimizedProperties />
            </MainLayout>
          </Route>

          <Route path="/services">
            <MainLayout>
              <Services />
            </MainLayout>
          </Route>
          
          {/* Redirect from old restaurants route to new services route */}
          <Route path="/restaurants">
            <Redirect to="/services" />
          </Route>

          <Route path="/restaurant/:id">
            {(params) => (
              <MainLayout>
                <Restaurant id={parseInt(params.id)} />
              </MainLayout>
            )}
          </Route>

          <Route path="/coming-soon">
            <MainLayout>
              <ComingSoon />
            </MainLayout>
          </Route>
          
          <Route path="/journey-tracker-demo">
            <MainLayout>
              <JourneyTrackerDemo />
            </MainLayout>
          </Route>
          
          <Route path="/login">
            <MainLayout>
              <AuthPage />
            </MainLayout>
          </Route>
          
          <Route path="/register">
            <MainLayout>
              <AuthPage />
            </MainLayout>
          </Route>
          
          <Route path="/auth">
            <MainLayout>
              <AuthPage />
            </MainLayout>
          </Route>
          
          <Route path="/admin-login">
            <Redirect to="/auth?tab=admin" />
          </Route>
          
          {/* Emergency login route removed as requested */}
          
          <Route path="/accessibility-settings">
            <MainLayout>
              <AccessibilitySettings />
            </MainLayout>
          </Route>
          
          <Route path="/animation-demo">
            <MainLayout>
              <AnimationDemo />
            </MainLayout>
          </Route>
          
          <Route path="/error-testing">
            <MainLayout>
              <ErrorTesting />
            </MainLayout>
          </Route>
          
          {/* Protected user routes */}
          <Route path="/profile">
            <ProtectedRoute>
              <MainLayout>
                <Profile />
              </MainLayout>
            </ProtectedRoute>
          </Route>
          
          <Route path="/bookings">
            <ProtectedRoute>
              <MainLayout>
                <MyBookings />
              </MainLayout>
            </ProtectedRoute>
          </Route>
          
          <Route path="/checkout/:propertyId">
            {(params) => (
              <ProtectedRoute>
                <MainLayout>
                  <Checkout propertyId={parseInt(params.propertyId)} />
                </MainLayout>
              </ProtectedRoute>
            )}
          </Route>
          
          <Route path="/rewards">
            <ProtectedRoute>
              <MainLayout>
                <Rewards />
              </MainLayout>
            </ProtectedRoute>
          </Route>
          
          <Route path="/trip-planning">
            <ProtectedRoute>
              <MainLayout>
                <TripPlanning />
              </MainLayout>
            </ProtectedRoute>
          </Route>
          
          <Route path="/trip-planning/:id">
            {(params) => (
              <ProtectedRoute>
                <MainLayout>
                  <TripPlanning />
                </MainLayout>
              </ProtectedRoute>
            )}
          </Route>
          
          <Route path="/trip-planning/invite/:code">
            {(params) => (
              <ProtectedRoute>
                <MainLayout>
                  <TripPlanning />
                </MainLayout>
              </ProtectedRoute>
            )}
          </Route>
          
          {/* Property admin routes */}
          <Route path="/admin/properties">
            <ProtectedRoute requiredRole="Property_admin">
              <AdminLayout>
                <AdminProperties />
              </AdminLayout>
            </ProtectedRoute>
          </Route>
          
          <Route path="/admin/properties/new">
            <ProtectedRoute requiredRole="Property_admin">
              <AdminLayout>
                <AdminPropertyForm />
              </AdminLayout>
            </ProtectedRoute>
          </Route>
          
          <Route path="/admin/properties/edit/:id">
            {(params) => (
              <ProtectedRoute requiredRole="Property_admin">
                <AdminLayout>
                  <AdminPropertyForm id={parseInt(params.id)} />
                </AdminLayout>
              </ProtectedRoute>
            )}
          </Route>
          
          <Route path="/property/:id/analytics">
            {(params) => (
              <ProtectedRoute requiredRole="Property_admin">
                <AdminLayout>
                  <PropertyAnalytics propertyId={parseInt(params.id)} />
                </AdminLayout>
              </ProtectedRoute>
            )}
          </Route>

          {/* Property Owner Dashboard */}
          <Route path="/admin/property-dashboard">
            <ProtectedRoute requiredRole="Property_admin">
              <PropertyDashboard />
            </ProtectedRoute>
          </Route>

          <Route path="/admin/property/new">
            <ProtectedRoute requiredRole="Property_admin">
              <PropertyForm />
            </ProtectedRoute>
          </Route>

          <Route path="/admin/property/edit/:id">
            {(params) => (
              <ProtectedRoute requiredRole="Property_admin">
                <PropertyForm />
              </ProtectedRoute>
            )}
          </Route>
          
          {/* Super admin routes */}
          
          <Route path="/admin/users">
            <ProtectedRoute requiredRole="super_admin">
              <AdminLayout>
                <AdminUsers />
              </AdminLayout>
            </ProtectedRoute>
          </Route>
          
          <Route path="/admin/bookings">
            <ProtectedRoute requiredRole="super_admin">
              <AdminLayout>
                <AdminBookings />
              </AdminLayout>
            </ProtectedRoute>
          </Route>
          
          <Route path="/admin/payment-analytics">
            <ProtectedRoute requiredRole="super_admin">
              <AdminLayout>
                <PaymentAnalytics />
              </AdminLayout>
            </ProtectedRoute>
          </Route>
          
          <Route path="/admin/super-dashboard">
            <ProtectedRoute requiredRole="super_admin">
              <AdminLayout>
                <SuperAdminDashboard />
              </AdminLayout>
            </ProtectedRoute>
          </Route>
          
          <Route path="/admin/user-management">
            <ProtectedRoute requiredRole="super_admin">
              <AdminLayout>
                <UserManagement />
              </AdminLayout>
            </ProtectedRoute>
          </Route>

          <Route path="/admin/property-booking-management">
            <ProtectedRoute requiredRole="super_admin">
              <AdminLayout>
                <PropertyBookingManagement />
              </AdminLayout>
            </ProtectedRoute>
          </Route>

          <Route path="/admin/app-settings">
            <ProtectedRoute requiredRole="super_admin">
              <AdminLayout>
                <AppSettings />
              </AdminLayout>
            </ProtectedRoute>
          </Route>

          <Route path="/admin/notifications">
            <ProtectedRoute requiredRole="super_admin">
              <AdminLayout>
                <NotificationsPanel />
              </AdminLayout>
            </ProtectedRoute>
          </Route>

          <Route path="/admin/access-control">
            <ProtectedRoute requiredRole="super_admin">
              <AdminLayout>
                <RoleBasedAccessControl />
              </AdminLayout>
            </ProtectedRoute>
          </Route>

          <Route path="/admin/seo-dashboard">
            <ProtectedRoute requiredRole="super_admin">
              <AdminLayout>
                <SEODashboard />
              </AdminLayout>
            </ProtectedRoute>
          </Route>

          <Route path="/admin/locations-management">
            <ProtectedRoute requiredRole="super_admin">
              <AdminLayout>
                <LocationsManagement />
              </AdminLayout>
            </ProtectedRoute>
          </Route>

          <Route path="/admin/property-management">
            <ProtectedRoute requiredRole="super_admin">
              <AdminLayout>
                <PropertyManagement />
              </AdminLayout>
            </ProtectedRoute>
          </Route>
          
          {/* Fallback to 404 */}
          <Route>
            <MainLayout>
              <NotFound />
            </MainLayout>
          </Route>
        </Switch>
      </Suspense>
      </div>
          </MicroInteractionProvider>
        </NetworkErrorProvider>
      </A11yProvider>
    </ThemeProvider>
  );
}

export default App;