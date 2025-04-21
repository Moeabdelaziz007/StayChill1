import React, { useState, useRef, useEffect } from 'react';
import { BlurImage } from './blur-image';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, X } from 'lucide-react';
import { useMobile } from '@/hooks/use-mobile';

interface SwipeablePropertyGalleryProps {
  images: string[];
  alt: string;
  className?: string;
}

const SwipeablePropertyGallery: React.FC<SwipeablePropertyGalleryProps> = ({ 
  images, 
  alt,
  className 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startX, setStartX] = useState<number | null>(null);
  const [zoomed, setZoomed] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);
  const isMobile = useMobile();

  // Handle touch events for swiping on mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startX === null) return;
    
    const currentX = e.touches[0].clientX;
    const diff = startX - currentX;
    
    // Prevent default scrolling when swiping the gallery
    if (Math.abs(diff) > 5) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (startX === null) return;
    
    const currentX = e.changedTouches[0].clientX;
    const diff = startX - currentX;
    
    // If the swipe is significant enough (more than 50px), change the slide
    if (diff > 50 && currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (diff < -50 && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
    
    setStartX(null);
  };

  // Navigate to previous image
  const prevImage = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Navigate to next image
  const nextImage = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  // Toggle zoom state
  const toggleZoom = () => {
    setZoomed(!zoomed);
  };

  // Open the fullscreen modal
  const openModal = () => {
    setModalOpen(true);
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  };

  // Close the fullscreen modal
  const closeModal = () => {
    setModalOpen(false);
    document.body.style.overflow = 'auto'; // Restore scrolling
    setZoomed(false);
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!modalOpen) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          prevImage();
          break;
        case 'ArrowRight':
          nextImage();
          break;
        case 'Escape':
          closeModal();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalOpen, currentIndex]);

  return (
    <>
      {/* Main gallery component */}
      <div 
        ref={galleryRef}
        className={cn(
          "relative overflow-hidden rounded-lg", 
          className
        )}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Current image */}
        <div 
          className="cursor-pointer" 
          onClick={openModal}
        >
          <BlurImage
            src={images[currentIndex]}
            alt={`${alt} - Image ${currentIndex + 1}`}
            containerClassName="w-full"
            className="w-full h-full object-cover transition-transform"
            style={{ aspectRatio: "16/9" }}
          />
        </div>

        {/* Navigation buttons - only on desktop or if there's more than one image */}
        {images.length > 1 && !isMobile && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 hover:bg-black/60 text-white p-1.5"
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 hover:bg-black/60 text-white p-1.5"
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
              disabled={currentIndex === images.length - 1}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </>
        )}

        {/* Image counter indicator */}
        {images.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/60 text-white px-2 py-1 rounded-md text-sm">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Image thumbnails for desktop */}
      {images.length > 1 && !isMobile && (
        <div className="flex gap-2 mt-2 overflow-x-auto hide-scrollbar">
          {images.map((image, index) => (
            <div
              key={index}
              className={cn(
                "cursor-pointer rounded-md overflow-hidden flex-shrink-0 transition-all",
                currentIndex === index 
                  ? "ring-2 ring-primary" 
                  : "opacity-70 hover:opacity-100"
              )}
              style={{ width: '80px', height: '60px' }}
              onClick={() => setCurrentIndex(index)}
            >
              <BlurImage
                src={image}
                alt={`${alt} - Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-black/40 hover:bg-black/60 text-white"
              onClick={toggleZoom}
            >
              {zoomed ? <ZoomOut className="h-5 w-5" /> : <ZoomIn className="h-5 w-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-black/40 hover:bg-black/60 text-white"
              onClick={closeModal}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div 
            className="w-full h-full flex items-center justify-center"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <img
              src={images[currentIndex]}
              alt={`${alt} - Fullscreen ${currentIndex + 1}`}
              className={cn(
                "max-h-screen max-w-full object-contain transition-transform duration-300",
                zoomed ? "scale-150" : "scale-100"
              )}
            />
          </div>

          {/* Modal navigation buttons */}
          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/40 hover:bg-black/60 text-white"
                onClick={prevImage}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/40 hover:bg-black/60 text-white"
                onClick={nextImage}
                disabled={currentIndex === images.length - 1}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}

          {/* Image counter indicator in modal */}
          {images.length > 1 && (
            <div className="absolute bottom-6 inset-x-0 flex justify-center">
              <div className="bg-black/60 text-white px-3 py-1.5 rounded-full">
                {currentIndex + 1} / {images.length}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default SwipeablePropertyGallery;