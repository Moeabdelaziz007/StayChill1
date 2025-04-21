import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import PropertyShareCard from './property-share-card';

interface PropertyShareButtonProps {
  property: {
    id: number;
    title: string;
    location: string;
    image: string;
    price: number;
    rating?: number;
    description?: string;
  };
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
  label?: string;
  className?: string;
}

/**
 * مكون PropertyShareButton - زر مشاركة العقار
 * 
 * زر يعرض بطاقة مشاركة مخصصة للعقار عند النقر عليه
 */
const PropertyShareButton: React.FC<PropertyShareButtonProps> = ({
  property,
  variant = 'outline',
  size = 'default',
  showLabel = true,
  label = 'مشاركة',
  className
}) => {
  const [isShareCardOpen, setIsShareCardOpen] = useState(false);
  
  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsShareCardOpen(true)}
        className={className}
      >
        <Share2 className={showLabel ? "mr-2 h-4 w-4" : "h-4 w-4"} />
        {showLabel && <span>{label}</span>}
      </Button>
      
      <PropertyShareCard
        property={property}
        isOpen={isShareCardOpen}
        onClose={() => setIsShareCardOpen(false)}
      />
    </>
  );
};

export default PropertyShareButton;