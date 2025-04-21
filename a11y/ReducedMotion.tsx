import React, { useEffect, useState } from 'react';

/**
 * Hook to detect if the user prefers reduced motion
 * This respects the user's operating system preferences
 */
export const useReducedMotion = () => {
  // Default to false if SSR, will be updated on client side
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check if the browser supports matchMedia and prefers-reduced-motion
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      // Set initial value
      setPrefersReducedMotion(mediaQuery.matches);

      // Listen for changes
      const handleChange = (event: MediaQueryListEvent) => {
        setPrefersReducedMotion(event.matches);
      };

      // Modern browsers
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
      } 
      // Legacy support for Safari
      else if (mediaQuery.addListener) {
        mediaQuery.addListener(handleChange);
        return () => mediaQuery.removeListener(handleChange);
      }
    }
  }, []);

  return prefersReducedMotion;
};

/**
 * Reduced Motion Context - Provides both system preference and user override
 */
interface ReducedMotionContextType {
  prefersReducedMotion: boolean;
  setReducedMotion: React.Dispatch<React.SetStateAction<boolean | null>>;
}

const ReducedMotionContext = React.createContext<ReducedMotionContextType | undefined>(undefined);

/**
 * ReducedMotionProvider - Provider component for reduced motion preferences
 * Combines system preference with potential user override
 */
export const ReducedMotionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemPreference = useReducedMotion();
  // null means use system preference, true/false means user override
  const [userPreference, setUserPreference] = useState<boolean | null>(null);

  // The effective preference is user preference if set, otherwise system preference
  const prefersReducedMotion = userPreference !== null ? userPreference : systemPreference;

  return (
    <ReducedMotionContext.Provider
      value={{
        prefersReducedMotion,
        setReducedMotion: setUserPreference,
      }}
    >
      {children}
    </ReducedMotionContext.Provider>
  );
};

/**
 * Hook to access and modify reduced motion preferences
 */
export const useReducedMotionContext = () => {
  const context = React.useContext(ReducedMotionContext);
  if (context === undefined) {
    throw new Error('useReducedMotionContext must be used within a ReducedMotionProvider');
  }
  return context;
};

/**
 * ReducedMotionToggle - Toggle button for users to control animation preferences
 */
interface ReducedMotionToggleProps {
  className?: string;
  enabledLabel?: string;
  disabledLabel?: string;
}

export const ReducedMotionToggle: React.FC<ReducedMotionToggleProps> = ({
  className = '',
  enabledLabel = 'تقليل الحركة مُفعّل',
  disabledLabel = 'تقليل الحركة مُعطّل',
}) => {
  const { prefersReducedMotion, setReducedMotion } = useReducedMotionContext();
  const systemPreference = useReducedMotion();

  // Toggle between true, false, and null (system preference)
  const toggleReducedMotion = () => {
    if (prefersReducedMotion === true) {
      setReducedMotion(false); // Explicitly disable
    } else if (prefersReducedMotion === false) {
      setReducedMotion(null); // Use system preference
    } else {
      setReducedMotion(true); // Explicitly enable
    }
  };

  return (
    <button
      className={`inline-flex items-center px-3 py-1.5 border rounded-md ${className}`}
      onClick={toggleReducedMotion}
      aria-pressed={prefersReducedMotion}
    >
      <span className="mr-2">
        {prefersReducedMotion ? enabledLabel : disabledLabel}
      </span>
      {prefersReducedMotion !== null && (
        <span className="text-xs text-muted-foreground">
          {prefersReducedMotion === systemPreference ? '(وفق إعدادات النظام)' : '(إعداد مخصص)'}
        </span>
      )}
    </button>
  );
};

export default useReducedMotion;