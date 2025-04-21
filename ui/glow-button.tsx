import React, { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'relative inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        glow: 'bg-black text-primary border border-primary shadow-glow hover:shadow-lg hover:border-primary-light',
        'glow-dark': 'bg-primary text-black border border-primary shadow-glow hover:shadow-lg hover:border-primary-light',
        'glass': 'backdrop-blur-md bg-black/30 border border-white/10 hover:border-primary/20 text-white shadow-md',
      },
      size: {
        default: 'h-10 px-4 py-2',
        xs: 'h-7 rounded-md px-2 text-xs',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        xl: 'h-14 rounded-md px-8 text-lg',
        icon: 'h-10 w-10',
      },
      glow: {
        true: 'after:absolute after:inset-0 after:z-[-1] after:rounded-md after:bg-primary/40 after:blur-md after:transition-all hover:after:bg-primary/60 hover:after:blur-lg',
        false: '',
      },
      pulse: {
        true: 'animate-pulse-slow',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      glow: false,
      pulse: false,
    },
  }
);

export interface GlowButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const GlowButton = React.forwardRef<HTMLButtonElement, GlowButtonProps>(
  ({ className, variant, size, glow, pulse, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, glow, pulse, className }))}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);

GlowButton.displayName = 'GlowButton';

export { GlowButton, buttonVariants };