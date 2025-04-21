import React, { useEffect, useState } from 'react';

/**
 * Utility to detect if the user is navigating with a keyboard
 * This helps show focus indicators only when relevant (keyboard navigation)
 */
export const useKeyboardNavigation = () => {
  const [isKeyboardUser, setIsKeyboardUser] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setIsKeyboardUser(true);
      }
    };

    const handleMouseDown = () => {
      setIsKeyboardUser(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('touchstart', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('touchstart', handleMouseDown);
    };
  }, []);

  return isKeyboardUser;
};

/**
 * FocusRing - Enhanced focus styles for interactive elements
 * Wraps children with proper focus ring that only appears during keyboard navigation
 */
interface FocusRingProps {
  children: React.ReactElement;
  color?: string;
  width?: string;
  rounded?: string;
  offset?: string;
  className?: string;
}

export const FocusRing: React.FC<FocusRingProps> = ({
  children,
  color = 'ring-primary',
  width = 'ring-2',
  rounded = 'rounded-md',
  offset = 'ring-offset-2',
  className = '',
}) => {
  const isKeyboardUser = useKeyboardNavigation();

  // Clone the child element to add our focus classes conditionally
  return React.cloneElement(children, {
    className: `${children.props.className || ''} ${
      isKeyboardUser
        ? `focus:outline-none focus:${width} focus:${color} focus:${offset} focus:${rounded} ${className}`
        : 'focus:outline-none'
    }`,
  });
};

/**
 * FocusScope - Creates a focus trap for modals and similar components
 * Ensures keyboard focus remains within a specific component and can't tab out
 */
interface FocusScopeProps {
  children: React.ReactNode;
  active?: boolean;
  initialFocus?: React.RefObject<HTMLElement>;
  returnFocus?: boolean;
}

export const FocusScope: React.FC<FocusScopeProps> = ({
  children,
  active = true,
  initialFocus,
  returnFocus = true,
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const previousFocusRef = React.useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;

    // Save current focus to restore later if returnFocus is true
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Set initial focus if specified, otherwise focus the first focusable element
    if (initialFocus?.current) {
      initialFocus.current.focus();
    } else {
      const focusableElements = containerRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements && focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus();
      }
    }

    // Restore previous focus when component unmounts
    return () => {
      if (returnFocus && previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [active, initialFocus, returnFocus]);

  // Handle keyboard navigation within the scope
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!active || e.key !== 'Tab' || !containerRef.current) return;

    const focusableElements = containerRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    // If going backward and at the first element, wrap to the last
    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    }
    // If going forward and at the last element, wrap to the first
    else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  };

  return (
    <div ref={containerRef} onKeyDown={handleKeyDown}>
      {children}
    </div>
  );
};

export default FocusRing;