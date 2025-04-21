import React from 'react';

// Calculate relative luminance for a given RGB color
const getLuminance = (r: number, g: number, b: number): number => {
  const [R, G, B] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
};

// Calculate contrast ratio between two colors
const getContrastRatio = (
  foreground: [number, number, number], 
  background: [number, number, number]
): number => {
  const foregroundLuminance = getLuminance(foreground[0], foreground[1], foreground[2]);
  const backgroundLuminance = getLuminance(background[0], background[1], background[2]);
  
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  
  return (lighter + 0.05) / (darker + 0.05);
};

// Convert hex color to RGB
const hexToRgb = (hex: string): [number, number, number] | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    : null;
};

// Check if a color combination meets WCAG contrast requirements
interface ContrastResult {
  ratio: number;
  AA: {
    normal: boolean;
    large: boolean;
  };
  AAA: {
    normal: boolean;
    large: boolean;
  };
}

export const checkContrast = (
  foregroundColor: string,
  backgroundColor: string
): ContrastResult | null => {
  const foregroundRgb = hexToRgb(foregroundColor);
  const backgroundRgb = hexToRgb(backgroundColor);
  
  if (!foregroundRgb || !backgroundRgb) return null;
  
  const ratio = getContrastRatio(foregroundRgb, backgroundRgb);
  
  return {
    ratio,
    AA: {
      normal: ratio >= 4.5,
      large: ratio >= 3,
    },
    AAA: {
      normal: ratio >= 7,
      large: ratio >= 4.5,
    },
  };
};

/**
 * ColorContrastCheck - Determine if text meets WCAG accessibility contrast requirements
 */
interface ContrastCheckProps {
  foregroundColor: string;
  backgroundColor: string;
  fontSize?: number;
  isBold?: boolean;
  children?: React.ReactNode;
  showWarning?: boolean;
  className?: string;
}

export const ColorContrastCheck: React.FC<ContrastCheckProps> = ({
  foregroundColor,
  backgroundColor,
  fontSize = 16,
  isBold = false,
  children,
  showWarning = true,
  className = '',
}) => {
  const contrast = checkContrast(foregroundColor, backgroundColor);
  
  if (!contrast) return <>{children}</>;
  
  // Large text is defined as 18pt (24px) or 14pt (18.5px) if bold
  const isLargeText = fontSize >= 24 || (fontSize >= 18.5 && isBold);
  
  const levelToCheck = isLargeText ? 'large' : 'normal';
  const passesAA = contrast.AA[levelToCheck];
  const passesAAA = contrast.AAA[levelToCheck];
  
  // If it passes AA standard or we're not showing warnings, just render the children
  if (passesAA || !showWarning) {
    return <>{children}</>;
  }
  
  // Otherwise show the warning
  return (
    <div className={`relative ${className}`}>
      {children}
      <div className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white text-xs" title={`Contrast ratio: ${contrast.ratio.toFixed(2)}:1 - Does not meet WCAG AA standards`}>
        !
      </div>
    </div>
  );
};

/**
 * A11yColors - A hook to get accessible color pairs for different UI states
 */
export const useA11yColors = () => {
  return {
    // Main colors
    primary: {
      default: {
        bg: 'bg-primary',
        text: 'text-white',
      },
      subtle: {
        bg: 'bg-primary/10',
        text: 'text-primary-dark',
      },
    },
    // Success colors
    success: {
      default: {
        bg: 'bg-emerald-700',
        text: 'text-white',
      },
      subtle: {
        bg: 'bg-emerald-100',
        text: 'text-emerald-800',
      },
    },
    // Warning colors
    warning: {
      default: {
        bg: 'bg-green-500',
        text: 'text-white',
      },
      subtle: {
        bg: 'bg-green-100',
        text: 'text-green-900',
      },
    },
    // Error colors
    error: {
      default: {
        bg: 'bg-destructive',
        text: 'text-white',
      },
      subtle: {
        bg: 'bg-red-100',
        text: 'text-red-900',
      },
    },
    // Neutral colors
    neutral: {
      default: {
        bg: 'bg-slate-800',
        text: 'text-white',
      },
      subtle: {
        bg: 'bg-slate-100',
        text: 'text-slate-900',
      },
    }
  };
};

export default ColorContrastCheck;