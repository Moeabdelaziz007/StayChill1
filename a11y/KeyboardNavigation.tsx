import React, { useRef, useEffect, useState, createContext, useContext } from 'react';

// Create a context for keyboard navigation
interface KeyboardNavigationContextProps {
  registerItem: (id: string, ref: React.RefObject<HTMLElement>) => void;
  unregisterItem: (id: string) => void;
  activeId: string | null;
  setActiveId: (id: string | null) => void;
}

const KeyboardNavigationContext = createContext<KeyboardNavigationContextProps | undefined>(
  undefined
);

/**
 * KeyboardNavigationProvider - Enables keyboard navigation within a group of elements
 */
interface KeyboardNavigationProviderProps {
  children: React.ReactNode;
  vertical?: boolean;
  horizontal?: boolean;
  loopNavigation?: boolean;
  initialActiveId?: string | null;
}

export const KeyboardNavigationProvider: React.FC<KeyboardNavigationProviderProps> = ({
  children,
  vertical = true,
  horizontal = true,
  loopNavigation = true,
  initialActiveId = null,
}) => {
  const [items, setItems] = useState<Record<string, React.RefObject<HTMLElement>>>({});
  const [activeId, setActiveId] = useState<string | null>(initialActiveId);

  const registerItem = (id: string, ref: React.RefObject<HTMLElement>) => {
    setItems((prevItems) => ({ ...prevItems, [id]: ref }));
  };

  const unregisterItem = (id: string) => {
    setItems((prevItems) => {
      const newItems = { ...prevItems };
      delete newItems[id];
      return newItems;
    });
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const itemIds = Object.keys(items);
      if (itemIds.length === 0) return;

      const currentIndex = activeId ? itemIds.indexOf(activeId) : -1;
      let nextIndex: number | null = null;

      // Navigation logic
      if (vertical && e.key === 'ArrowDown') {
        e.preventDefault();
        if (currentIndex === -1 || currentIndex === itemIds.length - 1) {
          nextIndex = loopNavigation ? 0 : Math.min(currentIndex + 1, itemIds.length - 1);
        } else {
          nextIndex = currentIndex + 1;
        }
      } else if (vertical && e.key === 'ArrowUp') {
        e.preventDefault();
        if (currentIndex <= 0) {
          nextIndex = loopNavigation ? itemIds.length - 1 : 0;
        } else {
          nextIndex = currentIndex - 1;
        }
      } else if (horizontal && e.key === 'ArrowRight') {
        e.preventDefault();
        if (currentIndex === -1 || currentIndex === itemIds.length - 1) {
          nextIndex = loopNavigation ? 0 : Math.min(currentIndex + 1, itemIds.length - 1);
        } else {
          nextIndex = currentIndex + 1;
        }
      } else if (horizontal && e.key === 'ArrowLeft') {
        e.preventDefault();
        if (currentIndex <= 0) {
          nextIndex = loopNavigation ? itemIds.length - 1 : 0;
        } else {
          nextIndex = currentIndex - 1;
        }
      } else if (e.key === 'Home') {
        e.preventDefault();
        nextIndex = 0;
      } else if (e.key === 'End') {
        e.preventDefault();
        nextIndex = itemIds.length - 1;
      }

      // Update focus if a new index was determined
      if (nextIndex !== null) {
        const nextId = itemIds[nextIndex];
        setActiveId(nextId);
        items[nextId]?.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, activeId, vertical, horizontal, loopNavigation]);

  return (
    <KeyboardNavigationContext.Provider
      value={{ registerItem, unregisterItem, activeId, setActiveId }}
    >
      {children}
    </KeyboardNavigationContext.Provider>
  );
};

// Hook to use keyboard navigation
export const useKeyboardNavigation = () => {
  const context = useContext(KeyboardNavigationContext);
  if (!context) {
    throw new Error('useKeyboardNavigation must be used within a KeyboardNavigationProvider');
  }
  return context;
};

/**
 * NavigationItem - An item that can be navigated to via keyboard
 */
interface NavigationItemProps {
  id: string;
  children: (props: {
    ref: React.RefObject<HTMLElement>;
    tabIndex: number;
    'aria-selected': boolean;
    onClick: () => void;
  }) => React.ReactElement;
}

export const NavigationItem: React.FC<NavigationItemProps> = ({ id, children }) => {
  const ref = useRef<HTMLElement>(null);
  const { registerItem, unregisterItem, activeId, setActiveId } = useKeyboardNavigation();

  useEffect(() => {
    registerItem(id, ref);
    return () => unregisterItem(id);
  }, [id, registerItem, unregisterItem]);

  const handleClick = () => {
    setActiveId(id);
  };

  return children({
    ref,
    tabIndex: activeId === id ? 0 : -1,
    'aria-selected': activeId === id,
    onClick: handleClick,
  });
};

/**
 * AccessibleMenu - A menu component with proper keyboard navigation
 */
interface AccessibleMenuProps {
  children: React.ReactNode;
  orientation?: 'horizontal' | 'vertical';
  label: string;
  className?: string;
}

export const AccessibleMenu: React.FC<AccessibleMenuProps> = ({
  children,
  orientation = 'vertical',
  label,
  className = '',
}) => {
  return (
    <KeyboardNavigationProvider
      vertical={orientation === 'vertical'}
      horizontal={orientation === 'horizontal'}
    >
      <div
        role="menu"
        aria-label={label}
        className={`outline-none ${className}`}
        tabIndex={0}
      >
        {children}
      </div>
    </KeyboardNavigationProvider>
  );
};

/**
 * AccessibleMenuItem - A menu item with proper keyboard support
 */
interface AccessibleMenuItemProps {
  id: string;
  children: React.ReactNode;
  onSelect?: () => void;
  disabled?: boolean;
  className?: string;
}

export const AccessibleMenuItem: React.FC<AccessibleMenuItemProps> = ({
  id,
  children,
  onSelect,
  disabled = false,
  className = '',
}) => {
  const handleSelect = () => {
    if (!disabled && onSelect) {
      onSelect();
    }
  };

  return (
    <NavigationItem id={id}>
      {({ ref, tabIndex, ...props }) => (
        <div
          ref={ref as React.RefObject<HTMLDivElement>}
          role="menuitem"
          tabIndex={disabled ? -1 : tabIndex}
          aria-disabled={disabled}
          onClick={handleSelect}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleSelect();
            }
          }}
          className={`${className} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          {...props}
        >
          {children}
        </div>
      )}
    </NavigationItem>
  );
};

export default {
  KeyboardNavigationProvider,
  useKeyboardNavigation,
  NavigationItem,
  AccessibleMenu,
  AccessibleMenuItem,
};