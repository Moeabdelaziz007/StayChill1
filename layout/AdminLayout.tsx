import { ReactNode, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { BarChart4, Home, Building, Bookmark, Star, Gift, Settings, LogOut, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [location, navigate] = useLocation();
  const { user, logoutMutation } = useAuth();
  
  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  // Check if user is authenticated and has proper role
  useEffect(() => {
    if (!user) {
      navigate('/');
    } else if (user.role !== 'Property_admin' && user.role !== 'super_admin') {
      navigate('/');
    }
  }, [user, navigate]);
  
  // Check if a navigation item is active
  const isActive = (path: string) => {
    return location.startsWith(path);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200">
        <div className="p-6">
          <Link to="/">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-xl">StayChill</span>
            </div>
          </Link>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-1">
          <Link to="/admin">
            <div className={`flex items-center px-4 py-3 text-sm font-medium rounded-md ${
              isActive('/admin') && !isActive('/admin/properties') && !isActive('/admin/bookings')
                ? 'bg-gray-100 text-brand'
                : 'text-gray-700 hover:bg-gray-50'
            }`}>
              <BarChart4 className="mr-3 h-5 w-5" />
              Dashboard
            </div>
          </Link>
          
          <Link to="/admin/properties">
            <div className={`flex items-center px-4 py-3 text-sm font-medium rounded-md ${
              isActive('/admin/properties') || isActive('/property')
                ? 'bg-gray-100 text-brand'
                : 'text-gray-700 hover:bg-gray-50'
            }`}>
              <Building className="mr-3 h-5 w-5" />
              Properties
            </div>
          </Link>
          
          <Link to="/admin/bookings">
            <div className={`flex items-center px-4 py-3 text-sm font-medium rounded-md ${
              isActive('/admin/bookings')
                ? 'bg-gray-100 text-brand'
                : 'text-gray-700 hover:bg-gray-50'
            }`}>
              <Bookmark className="mr-3 h-5 w-5" />
              Bookings
            </div>
          </Link>
          
          <Link to="/admin/reviews">
            <div className={`flex items-center px-4 py-3 text-sm font-medium rounded-md ${
              isActive('/admin/reviews')
                ? 'bg-gray-100 text-brand'
                : 'text-gray-700 hover:bg-gray-50'
            }`}>
              <Star className="mr-3 h-5 w-5" />
              Reviews
            </div>
          </Link>
          
          {user?.role === 'super_admin' && (
            <Link to="/admin/rewards">
              <div className={`flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                isActive('/admin/rewards')
                  ? 'bg-gray-100 text-brand'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}>
                <Gift className="mr-3 h-5 w-5" />
                Rewards Program
              </div>
            </Link>
          )}
          
          <Link to="/admin/settings">
            <div className={`flex items-center px-4 py-3 text-sm font-medium rounded-md ${
              isActive('/admin/settings')
                ? 'bg-gray-100 text-brand'
                : 'text-gray-700 hover:bg-gray-50'
            }`}>
              <Settings className="mr-3 h-5 w-5" />
              Settings
            </div>
          </Link>
        </nav>
        
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
                {user?.firstName?.[0] || user?.username?.[0] || 'U'}
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">
                {user?.firstName || user?.username}
              </p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-4 w-full justify-start text-gray-500 hover:text-gray-700"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
      
      {/* Mobile sidebar button */}
      <div className="md:hidden fixed bottom-4 right-4 z-20">
        <Button
          variant="default"
          size="icon"
          className="rounded-full h-12 w-12 shadow-lg"
          onClick={() => {
            const sidebar = document.getElementById('mobile-sidebar');
            if (sidebar) {
              sidebar.classList.toggle('translate-x-full');
            }
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </Button>
      </div>
      
      {/* Mobile sidebar */}
      <div
        id="mobile-sidebar"
        className="fixed inset-y-0 right-0 z-10 w-64 bg-white shadow-lg transform translate-x-full transition-transform duration-300 ease-in-out md:hidden"
      >
        <div className="p-6 flex justify-between items-center">
          <span className="font-bold text-xl">StayChill</span>
          <button
            onClick={() => {
              const sidebar = document.getElementById('mobile-sidebar');
              if (sidebar) {
                sidebar.classList.add('translate-x-full');
              }
            }}
            className="text-gray-500 focus:outline-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        
        <nav className="px-4 py-4 space-y-1">
          <Link to="/admin">
            <div className={`flex items-center px-4 py-3 text-sm font-medium rounded-md ${
              isActive('/admin') && !isActive('/admin/properties') && !isActive('/admin/bookings')
                ? 'bg-gray-100 text-brand'
                : 'text-gray-700 hover:bg-gray-50'
            }`}>
              <BarChart4 className="mr-3 h-5 w-5" />
              Dashboard
            </div>
          </Link>
          
          <Link to="/admin/properties">
            <div className={`flex items-center px-4 py-3 text-sm font-medium rounded-md ${
              isActive('/admin/properties') || isActive('/property')
                ? 'bg-gray-100 text-brand'
                : 'text-gray-700 hover:bg-gray-50'
            }`}>
              <Building className="mr-3 h-5 w-5" />
              Properties
            </div>
          </Link>
          
          <Link to="/admin/bookings">
            <div className={`flex items-center px-4 py-3 text-sm font-medium rounded-md ${
              isActive('/admin/bookings')
                ? 'bg-gray-100 text-brand'
                : 'text-gray-700 hover:bg-gray-50'
            }`}>
              <Bookmark className="mr-3 h-5 w-5" />
              Bookings
            </div>
          </Link>
          
          <Link to="/admin/reviews">
            <div className={`flex items-center px-4 py-3 text-sm font-medium rounded-md ${
              isActive('/admin/reviews')
                ? 'bg-gray-100 text-brand'
                : 'text-gray-700 hover:bg-gray-50'
            }`}>
              <Star className="mr-3 h-5 w-5" />
              Reviews
            </div>
          </Link>
          
          {user?.role === 'super_admin' && (
            <Link to="/admin/rewards">
              <div className={`flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                isActive('/admin/rewards')
                  ? 'bg-gray-100 text-brand'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}>
                <Gift className="mr-3 h-5 w-5" />
                Rewards Program
              </div>
            </Link>
          )}
          
          <Link to="/admin/settings">
            <div className={`flex items-center px-4 py-3 text-sm font-medium rounded-md ${
              isActive('/admin/settings')
                ? 'bg-gray-100 text-brand'
                : 'text-gray-700 hover:bg-gray-50'
            }`}>
              <Settings className="mr-3 h-5 w-5" />
              Settings
            </div>
          </Link>
          
          <button
            className="flex w-full items-center px-4 py-3 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50"
            onClick={handleLogout}
          >
            <LogOut className="mr-3 h-5 w-5" />
            Logout
          </button>
        </nav>
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;