import React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const glassCardVariants = cva(
  'rounded-lg overflow-hidden transition-all backdrop-blur-sm border',
  {
    variants: {
      variant: {
        default: 'bg-black/50 border-white/10',
        accent: 'bg-black/60 border-primary/20',
        minimal: 'bg-black/30 border-white/5',
        dark: 'bg-card/90 border-border/50',
        premium: 'bg-gradient-to-br from-black/80 to-black/50 border-primary/30',
      },
      hover: {
        true: 'hover:border-primary/40 hover:shadow-glow',
        false: '',
      },
      shadow: {
        none: '',
        sm: 'shadow-sm',
        md: 'shadow-md',
        lg: 'shadow-lg',
        xl: 'shadow-xl',
        glow: 'shadow-glow',
      }
    },
    defaultVariants: {
      variant: 'default',
      hover: false,
      shadow: 'md',
    },
  }
);

export interface GlassCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassCardVariants> {
  asChild?: boolean;
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant, hover, shadow, children, ...props }, ref) => {
    return (
      <div
        className={cn(glassCardVariants({ variant, hover, shadow, className }))}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';

export { GlassCard, glassCardVariants };