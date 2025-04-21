import React, { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

type SkeletonVariant = 'text' | 'circle' | 'rect' | 'card' | 'avatar' | 'button' | 'input';

interface AdvancedSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
  quantity?: number;
  gap?: string;
  inline?: boolean;
  rounded?: boolean | string;
  withShadow?: boolean;
  lines?: number;
  lineHeight?: string | number;
  layout?: 'grid' | 'flex';
  gridCols?: number;
  itemClassName?: string;
}

/**
 * Advanced Skeleton component with more options for content loading states
 */
export function AdvancedSkeleton({
  variant = 'rect',
  width,
  height,
  animation = 'pulse',
  quantity = 1,
  gap = '1rem',
  inline = false,
  rounded = false,
  withShadow = false,
  lines = 1,
  lineHeight = '1rem',
  layout = 'flex',
  gridCols = 3,
  className,
  itemClassName,
  ...props
}: AdvancedSkeletonProps) {
  const [items, setItems] = useState<number[]>([]);

  // Initialize items array
  useEffect(() => {
    setItems(Array.from({ length: quantity }, (_, i) => i));
  }, [quantity]);
  
  // Handle rounded prop formatting
  const roundedClass = rounded === true 
    ? 'rounded-full' 
    : typeof rounded === 'string' 
      ? rounded 
      : '';
  
  // Generate variant-specific classes
  const getVariantClasses = () => {
    switch (variant) {
      case 'circle':
        return 'rounded-full aspect-square';
      case 'card':
        return 'w-full rounded-lg overflow-hidden';
      case 'avatar':
        return 'rounded-full aspect-square';
      case 'button':
        return 'h-10 rounded';
      case 'input':
        return 'h-10 rounded-md';
      default:
        return '';
    }
  };
  
  // Generate animations
  const getAnimationClasses = () => {
    switch (animation) {
      case 'pulse':
        return 'animate-pulse';
      case 'wave':
        return 'animate-shimmer';
      default:
        return '';
    }
  };
  
  // Render multiple lines of text skeleton
  const renderLines = () => {
    return (
      <div className="flex flex-col" style={{ gap: gap }}>
        {Array.from({ length: lines }, (_, i) => (
          <Skeleton 
            key={i} 
            className={cn(
              'w-full', 
              i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full',
              itemClassName
            )} 
            style={{ 
              height: lineHeight,
            }}
          />
        ))}
      </div>
    );
  };
  
  // Generate container layout classes
  const containerClasses = cn(
    layout === 'flex' ? 'flex flex-col' : `grid grid-cols-1 md:grid-cols-${gridCols}`,
    getAnimationClasses(),
    className
  );
  
  // Item level classes
  const itemClasses = cn(
    getVariantClasses(), 
    roundedClass,
    withShadow && 'shadow-md',
    itemClassName
  );
  
  // Styles
  const itemStyles = {
    width: width,
    height: height,
    display: inline ? 'inline-block' : 'block',
  };
  
  return (
    <div className={containerClasses} style={{ gap: gap }} {...props}>
      {variant === 'text' ? (
        renderLines()
      ) : (
        items.map((i) => (
          <Skeleton 
            key={i} 
            className={itemClasses} 
            style={itemStyles}
          />
        ))
      )}
    </div>
  );
}

// ShimmerWrapper component for consistent animated loading states
export const ShimmerWrapper: React.FC<React.PropsWithChildren<{className?: string}>> = ({ 
  children, 
  className 
}) => {
  return (
    <div className={cn("animate-pulse", className)}>
      {children}
    </div>
  );
};

// PropertyCardSkeleton component for loading property cards
export const PropertyCardSkeleton: React.FC<{className?: string}> = ({ className }) => {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="relative">
        <Skeleton className="w-full h-48" />
        <div className="absolute top-3 right-3">
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </div>
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
        <div className="flex justify-between items-center pt-2">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
};

// VirtualTourSkeleton component for loading virtual tours
export const VirtualTourSkeleton: React.FC<{className?: string}> = ({ className }) => {
  return (
    <Card className={cn("my-6 border-none shadow-sm", className)}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-5 w-40" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-md" />
            ))}
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-3">
          <Skeleton className="h-5 w-36" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-16 w-full rounded-md" />
              </div>
            ))}
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-20 w-full rounded-md" />
        </div>
        
        <div className="space-y-3">
          <Skeleton className="h-5 w-48" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-24 rounded-full" />
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2 pb-4 flex justify-center">
        <Skeleton className="h-3 w-4/5" />
      </CardFooter>
    </Card>
  );
};

// AreaGuideSkeleton component for loading area guides
export const AreaGuideSkeleton: React.FC<{className?: string}> = ({ className }) => {
  return (
    <Card className={cn("my-6 border-none shadow-sm", className)}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-5 w-40" />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            ))}
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-24 w-full rounded-md" />
        </div>
        
        <Separator />
        
        {/* Tabs skeleton */}
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 rounded-md" />
            ))}
          </div>
          
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-1">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-full mt-2" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2 pb-4 flex justify-center">
        <Skeleton className="h-3 w-4/5" />
      </CardFooter>
    </Card>
  );
};

// PropertyDetailSkeleton component for property detail pages
export const PropertyDetailSkeleton: React.FC<{className?: string}> = ({ className }) => {
  return (
    <div className={cn("space-y-8", className)}>
      {/* Header */}
      <div className="space-y-3">
        <Skeleton className="h-8 w-3/4" />
        <div className="flex items-center space-x-2">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>
      
      {/* Gallery */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-80 col-span-2 rounded-lg" />
        <div className="space-y-4">
          <Skeleton className="h-[152px] rounded-lg" />
          <Skeleton className="h-[152px] rounded-lg" />
        </div>
      </div>
      
      {/* Main content and sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="space-y-3">
            <Skeleton className="h-6 w-40" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
          
          {/* Features */}
          <div className="space-y-3">
            <Skeleton className="h-6 w-32" />
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Sidebar */}
        <div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-5 w-1/3" />
                </div>
                <Separator />
              </div>
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-12 w-full rounded-md" />
              <div className="text-center">
                <Skeleton className="h-4 w-3/4 mx-auto" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// PropertyRecommendationSkeleton component for AI property recommendations
export const PropertyRecommendationSkeleton: React.FC<{className?: string}> = ({ className }) => {
  return (
    <div className={cn("my-8", className)}>
      <div className="flex items-center mb-4">
        <Skeleton className="h-5 w-5 rounded-full mr-2" />
        <Skeleton className="h-7 w-48" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <ShimmerWrapper key={i}>
            <Card className="overflow-hidden">
              <div className="h-40 bg-gray-200"></div>
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-40 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent className="pb-2">
                <Skeleton className="h-5 w-36 mb-3" />
                <div className="space-y-2">
                  <div className="flex items-start">
                    <Skeleton className="h-3 w-3 rounded-full mr-2 mt-1" />
                    <Skeleton className="flex-1 h-4" />
                  </div>
                  <div className="flex items-start">
                    <Skeleton className="h-3 w-3 rounded-full mr-2 mt-1" />
                    <Skeleton className="flex-1 h-4" />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          </ShimmerWrapper>
        ))}
      </div>
    </div>
  );
};

export default AdvancedSkeleton;