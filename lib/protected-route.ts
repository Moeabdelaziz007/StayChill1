import React from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';

/**
 * Higher-order component for protecting routes that require authentication
 * @param Component The component to render if user is authenticated
 * @returns A wrapped component that checks authentication before rendering
 */
export function ProtectedRoute<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> {
  return (props: P) => {
    const { user, isLoading } = useAuth();
    const [_, setLocation] = useLocation();

    // Check auth and redirect when component mounts
    React.useEffect(() => {
      if (!isLoading && !user) {
        setLocation('/login');
      }
    }, [user, isLoading, setLocation]);

    // Show loading state while checking auth
    if (isLoading) {
      return React.createElement('div', { 
        className: "flex items-center justify-center min-h-screen" 
      }, React.createElement('div', {
        className: "w-8 h-8 border-4 border-gray-300 border-t-primary rounded-full animate-spin"
      }));
    }

    // Don't render anything if not authenticated (will redirect in useEffect)
    if (!user) {
      return null;
    }

    // Render the protected component if authenticated
    return React.createElement(Component, props);
  };
}