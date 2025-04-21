import React from "react";
import { cn } from "@/lib/utils";

/**
 * A customizable animated loading skeleton component.
 * 
 * @param className - Additional CSS classes to customize the appearance
 * @param height - The height of the skeleton, default is "h-4"
 * @param width - The width of the skeleton, default is "w-full"
 * @param rounded - The border radius, default is "rounded-md"
 * @param animated - Whether the skeleton should have a loading animation, default is true
 * @param type - Type of skeleton element ("text", "image", "card", "button"), default is "text"
 */
export function LoadingSkeleton({
  className,
  height = "h-4",
  width = "w-full",
  rounded = "rounded-md",
  animated = true,
  type = "text",
}: {
  className?: string;
  height?: string;
  width?: string;
  rounded?: string;
  animated?: boolean;
  type?: "text" | "image" | "card" | "button";
}) {
  // Default class names for the skeleton
  let skeletonClass = cn(
    "bg-gray-200 dark:bg-gray-700", 
    height, 
    width, 
    rounded,
    animated && "animate-pulse",
    className
  );

  // Different types of skeletons
  switch (type) {
    case "image":
      return (
        <div className={cn(skeletonClass, "flex items-center justify-center")}>
          <svg
            className="w-10 h-10 text-gray-300"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            fill="currentColor"
            viewBox="0 0 640 512"
          >
            <path d="M480 80C480 35.82 515.8 0 560 0C604.2 0 640 35.82 640 80C640 124.2 604.2 160 560 160C515.8 160 480 124.2 480 80zM0 456.1C0 445.6 2.964 435.3 8.551 426.4L225.3 81.01C231.9 70.42 243.5 64 256 64C268.5 64 280.1 70.42 286.8 81.01L412.7 281.7L460.9 202.7C464.1 196.1 472.2 192 480 192C487.8 192 495 196.1 499.1 202.7L631.1 419.1C636.9 428.6 640 439.7 640 450.9C640 484.6 612.6 512 578.9 512H55.91C25.03 512 .0006 486.1 .0006 456.1L0 456.1z" />
          </svg>
        </div>
      );
    case "card":
      return (
        <div className={cn(skeletonClass, "p-4 border border-gray-200 dark:border-gray-700")}>
          <div className="h-32 mb-4 bg-gray-300 dark:bg-gray-600 rounded-md"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded-md mb-2"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded-md w-2/3"></div>
        </div>
      );
    case "button":
      return (
        <div className={cn(skeletonClass, "py-2 px-4")}>
          <div className="invisible">Button</div>
        </div>
      );
    default:
      return <div className={skeletonClass}></div>;
  }
}

/**
 * A booking card skeleton used for loading states
 */
export function BookingCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("border rounded-lg p-4 space-y-3", className)}>
      <div className="flex justify-between">
        <LoadingSkeleton width="w-1/3" height="h-6" />
        <LoadingSkeleton width="w-20" height="h-6" />
      </div>
      <div className="space-y-2">
        <LoadingSkeleton height="h-4" />
        <LoadingSkeleton width="w-2/3" height="h-4" />
      </div>
      <div className="flex justify-between items-center mt-4">
        <LoadingSkeleton width="w-24" height="h-8" type="button" rounded="rounded-full" />
        <LoadingSkeleton width="w-20" height="h-6" />
      </div>
    </div>
  );
}

/**
 * A property card skeleton used for loading states
 */
export function PropertyCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("border rounded-lg overflow-hidden", className)}>
      <LoadingSkeleton height="h-40" type="image" rounded="rounded-t-lg" />
      <div className="p-4 space-y-3">
        <LoadingSkeleton height="h-6" />
        <LoadingSkeleton width="w-2/3" height="h-4" />
        <div className="flex justify-between">
          <LoadingSkeleton width="w-1/4" height="h-5" />
          <LoadingSkeleton width="w-1/4" height="h-5" />
        </div>
      </div>
    </div>
  );
}

/**
 * A restaurant card skeleton used for loading states
 */
export function RestaurantCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("border rounded-lg overflow-hidden", className)}>
      <LoadingSkeleton height="h-32" type="image" rounded="rounded-t-lg" />
      <div className="p-4 space-y-2">
        <LoadingSkeleton height="h-6" />
        <LoadingSkeleton width="w-3/4" height="h-4" />
        <div className="flex items-center space-x-2 mt-2">
          <LoadingSkeleton width="w-20" height="h-5" rounded="rounded-full" />
          <LoadingSkeleton width="w-16" height="h-5" rounded="rounded-full" />
        </div>
      </div>
    </div>
  );
}

/**
 * A booking form skeleton used for loading states
 */
export function BookingFormSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4 p-4 border rounded-lg", className)}>
      <LoadingSkeleton height="h-7" width="w-1/2" />
      
      <div className="space-y-2">
        <LoadingSkeleton height="h-5" width="w-1/4" />
        <LoadingSkeleton height="h-10" />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <LoadingSkeleton height="h-5" width="w-1/2" />
          <LoadingSkeleton height="h-10" />
        </div>
        <div className="space-y-2">
          <LoadingSkeleton height="h-5" width="w-1/2" />
          <LoadingSkeleton height="h-10" />
        </div>
      </div>
      
      <div className="space-y-2">
        <LoadingSkeleton height="h-5" width="w-1/4" />
        <LoadingSkeleton height="h-10" />
      </div>
      
      <div className="space-y-2">
        <LoadingSkeleton height="h-5" width="w-1/3" />
        <LoadingSkeleton height="h-24" />
      </div>
      
      <LoadingSkeleton height="h-10" type="button" />
    </div>
  );
}

/**
 * A grid of property card skeletons
 */
export function PropertyGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {Array(count)
        .fill(0)
        .map((_, i) => (
          <PropertyCardSkeleton key={i} />
        ))}
    </div>
  );
}

/**
 * A list of booking card skeletons
 */
export function BookingListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array(count)
        .fill(0)
        .map((_, i) => (
          <BookingCardSkeleton key={i} />
        ))}
    </div>
  );
}

/**
 * A grid of restaurant card skeletons
 */
export function RestaurantGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {Array(count)
        .fill(0)
        .map((_, i) => (
          <RestaurantCardSkeleton key={i} />
        ))}
    </div>
  );
}

/**
 * A full page loading skeleton with logo
 */
export function FullPageLoadingSkeleton() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-white dark:bg-gray-900">
      <div className="w-20 h-20 mb-4 animate-bounce">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="text-yellow-500"
        >
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      </div>
      <div className="text-2xl font-bold text-yellow-500 mb-2">StayChill</div>
      <div className="w-12 h-1 bg-yellow-500 animate-pulse rounded mb-4"></div>
      <div className="text-gray-400 text-sm">جاري التحميل...</div>
    </div>
  );
}

/**
 * A page transition component that fades in content
 */
export function PageTransition({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div 
      className={cn("animate-fadeIn", className)}
      style={{ 
        animationDuration: '0.5s',
        animationFillMode: 'both'
      }}
    >
      {children}
    </div>
  );
}