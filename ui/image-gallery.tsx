import React, { useState, useEffect, useRef, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { BlurImage } from './blur-image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface ImageGalleryImage {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  blurDataURL?: string;
}

interface ImageGalleryProps {
  images: ImageGalleryImage[];
  className?: string;
  galleryClassName?: string;
  thumbnailClassName?: string;
  aspectRatio?: string;
  enableLightbox?: boolean;
  enableZoom?: boolean;
  thumbnailsPosition?: 'bottom' | 'top' | 'left' | 'right';
  thumbnailsToShow?: number;
  autoplay?: boolean;
  autoplayInterval?: number;
  showArrows?: boolean;
  showDots?: boolean;
  initialIndex?: number;
}

/**
 * مكون معرض الصور المحسن للأداء
 * يدعم التحميل البطيء وصندوق الضوء والتكبير وعرض الصور المصغرة
 */
export function ImageGallery({
  images,
  className,
  galleryClassName,
  thumbnailClassName,
  aspectRatio = '16/9',
  enableLightbox = true,
  enableZoom = true,
  thumbnailsPosition = 'bottom',
  thumbnailsToShow = 5,
  autoplay = false,
  autoplayInterval = 5000,
  showArrows = true,
  showDots = true,
  initialIndex = 0,
}: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(initialIndex || 0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const galleryRef = useRef<HTMLDivElement>(null);
  const thumbnailsRef = useRef<HTMLDivElement>(null);
  
  // تحقق من صحة الصور
  const validImages = useMemo(() => {
    return images.filter(img => img.src && typeof img.src === 'string');
  }, [images]);
  
  // التأكد من أن المؤشر النشط ضمن النطاق الصحيح
  useEffect(() => {
    if (activeIndex >= validImages.length) {
      setActiveIndex(0);
    }
  }, [validImages.length, activeIndex]);
  
  // التشغيل التلقائي
  useEffect(() => {
    if (!autoplay || lightboxOpen) return;
    
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % validImages.length);
    }, autoplayInterval);
    
    return () => clearInterval(interval);
  }, [autoplay, autoplayInterval, validImages.length, lightboxOpen]);
  
  // الانتقال إلى الصورة السابقة
  const prevImage = () => {
    setActiveIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
    resetZoom();
  };
  
  // الانتقال إلى الصورة التالية
  const nextImage = () => {
    setActiveIndex((prev) => (prev + 1) % validImages.length);
    resetZoom();
  };
  
  // إعادة تعيين التكبير والموضع
  const resetZoom = () => {
    setZoomLevel(1);
    setDragPosition({ x: 0, y: 0 });
  };
  
  // تبديل حالة التكبير
  const toggleZoom = () => {
    setZoomLevel(prev => (prev === 1 ? 2.5 : 1));
    setDragPosition({ x: 0, y: 0 });
  };
  
  // مؤشر الصورة الحالية
  const activeImage = validImages[activeIndex];
  
  // التحقق من اتجاه العرض المصغر للتمرير المناسب
  const isHorizontalThumbnails = thumbnailsPosition === 'bottom' || thumbnailsPosition === 'top';
  
  // تمرير العرض المصغر عند تغيير الصورة النشطة
  useEffect(() => {
    if (!thumbnailsRef.current) return;
    
    const thumbnailsEl = thumbnailsRef.current;
    const activeThumb = thumbnailsEl.querySelector(`[data-index="${activeIndex}"]`) as HTMLElement;
    
    if (!activeThumb) return;
    
    if (isHorizontalThumbnails) {
      const scrollLeft = activeThumb.offsetLeft - (thumbnailsEl.clientWidth / 2) + (activeThumb.clientWidth / 2);
      thumbnailsEl.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    } else {
      const scrollTop = activeThumb.offsetTop - (thumbnailsEl.clientHeight / 2) + (activeThumb.clientHeight / 2);
      thumbnailsEl.scrollTo({ top: scrollTop, behavior: 'smooth' });
    }
  }, [activeIndex, isHorizontalThumbnails]);
  
  // استخدام Framer Motion لحركات سلسة
  const imageVariants = {
    enter: (direction: number) => {
      return {
        x: direction > 0 ? '100%' : '-100%',
        opacity: 0,
      };
    },
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => {
      return {
        zIndex: 0,
        x: direction < 0 ? '100%' : '-100%',
        opacity: 0,
      };
    },
  };
  
  // تحديد اتجاه الحركة
  const [[page, direction], setPage] = useState([0, 0]);
  
  // تحديث الصفحة والاتجاه عند تغيير الصورة النشطة
  useEffect(() => {
    const newDirection = activeIndex > page ? 1 : -1;
    setPage([activeIndex, newDirection]);
  }, [activeIndex, page]);
  
  // عرض الصور المصغرة
  const renderThumbnails = () => (
    <div 
      ref={thumbnailsRef}
      className={cn(
        "relative overflow-auto scrollbar-hide",
        isHorizontalThumbnails 
          ? "flex flex-row space-x-2 py-2 px-1" 
          : "flex flex-col space-y-2 px-2 py-1",
        thumbnailsPosition === 'left' && "order-first",
        thumbnailsPosition === 'right' && "order-last",
        thumbnailsPosition === 'top' && "order-first mb-2",
        thumbnailsPosition === 'bottom' && "order-last mt-2",
      )}
      style={{
        maxHeight: isHorizontalThumbnails ? '100px' : '100%',
        maxWidth: !isHorizontalThumbnails ? '100px' : '100%',
      }}
    >
      {validImages.map((image, idx) => (
        <div 
          key={`thumb-${idx}`}
          data-index={idx}
          className={cn(
            "flex-shrink-0 cursor-pointer rounded-md overflow-hidden transition-all duration-200 border-2",
            idx === activeIndex ? "border-primary" : "border-transparent hover:border-primary/50",
            thumbnailClassName
          )}
          onClick={() => setActiveIndex(idx)}
          style={{
            width: isHorizontalThumbnails ? '80px' : '60px',
            height: isHorizontalThumbnails ? '60px' : '80px',
          }}
        >
          <BlurImage 
            src={image.src}
            alt={image.alt || `Thumbnail ${idx + 1}`}
            objectFit="cover"
            className="w-full h-full"
          />
        </div>
      ))}
    </div>
  );
  
  // عرض نقاط التنقل
  const renderDots = () => (
    <div className="flex justify-center mt-2 space-x-1.5">
      {validImages.map((_, idx) => (
        <button
          key={`dot-${idx}`}
          className={cn(
            "w-2 h-2 rounded-full transition-all duration-300",
            idx === activeIndex ? "bg-primary scale-125" : "bg-muted hover:bg-primary/50"
          )}
          onClick={() => setActiveIndex(idx)}
          aria-label={`Go to image ${idx + 1}`}
        />
      ))}
    </div>
  );
  
  // عرض صندوق الضوء
  const renderLightbox = () => (
    <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
      <DialogContent className="max-w-screen-lg w-[90vw] h-[90vh] p-0 bg-background/95 backdrop-blur-sm">
        <div className="relative w-full h-full flex items-center justify-center">
          {/* زر الإغلاق */}
          <button 
            className="absolute top-4 right-4 z-50 p-2 rounded-full bg-background/80 hover:bg-background text-foreground"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close lightbox"
          >
            <X className="w-5 h-5" />
          </button>
          
          {/* زر التكبير */}
          {enableZoom && (
            <button 
              className="absolute top-4 left-4 z-50 p-2 rounded-full bg-background/80 hover:bg-background text-foreground"
              onClick={toggleZoom}
              aria-label={zoomLevel > 1 ? "Zoom out" : "Zoom in"}
            >
              {zoomLevel > 1 ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
            </button>
          )}
          
          {/* أزرار التنقل */}
          {showArrows && validImages.length > 1 && (
            <>
              <button 
                className="absolute left-4 z-30 p-2 rounded-full bg-background/80 hover:bg-background text-foreground"
                onClick={prevImage}
                aria-label="Previous image"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                className="absolute right-4 z-30 p-2 rounded-full bg-background/80 hover:bg-background text-foreground"
                onClick={nextImage}
                aria-label="Next image"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
          
          {/* الصورة المكبرة */}
          <motion.div
            className="w-full h-full relative flex items-center justify-center overflow-hidden"
            drag={zoomLevel > 1}
            dragConstraints={{
              left: -200 * (zoomLevel - 1),
              right: 200 * (zoomLevel - 1),
              top: -200 * (zoomLevel - 1),
              bottom: 200 * (zoomLevel - 1),
            }}
            animate={{
              x: dragPosition.x,
              y: dragPosition.y,
            }}
            onDragEnd={(_, info) => {
              setDragPosition({
                x: dragPosition.x + info.offset.x,
                y: dragPosition.y + info.offset.y,
              });
            }}
          >
            <img 
              src={activeImage.src}
              alt={activeImage.alt || `Image ${activeIndex + 1}`}
              className="max-w-full max-h-full object-contain"
              style={{
                transform: `scale(${zoomLevel})`,
                transition: 'transform 0.3s ease',
              }}
              loading="lazy"
              onDoubleClick={enableZoom ? toggleZoom : undefined}
            />
          </motion.div>
          
          {/* عرض العداد */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-background/80 px-3 py-1 rounded-full text-sm">
            {activeIndex + 1} / {validImages.length}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
  
  // الحماية من الحالات الشاذة
  if (validImages.length === 0) {
    return (
      <div className={cn("border rounded-lg p-4 flex items-center justify-center bg-muted", className)}>
        <p className="text-muted-foreground">لا توجد صور للعرض</p>
      </div>
    );
  }
  
  return (
    <div 
      ref={galleryRef}
      className={cn(
        "gallery-container relative",
        thumbnailsPosition === 'left' || thumbnailsPosition === 'right' 
          ? "flex flex-row" 
          : "flex flex-col",
        className
      )}
    >
      {/* عرض العرض المصغر في الأعلى إذا تم تحديده */}
      {thumbnailsPosition === 'top' && validImages.length > 1 && renderThumbnails()}
      {thumbnailsPosition === 'left' && validImages.length > 1 && renderThumbnails()}
      
      {/* عرض المعرض الرئيسي */}
      <div 
        className={cn(
          "relative overflow-hidden rounded-lg flex-grow",
          galleryClassName
        )}
        style={{ aspectRatio }}
      >
        {/* عرض أزرار التنقل */}
        {showArrows && validImages.length > 1 && (
          <>
            <button 
              className="absolute left-4 top-1/2 transform -translate-y-1/2 z-30 p-2 rounded-full bg-background/80 hover:bg-background text-foreground"
              onClick={prevImage}
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              className="absolute right-4 top-1/2 transform -translate-y-1/2 z-30 p-2 rounded-full bg-background/80 hover:bg-background text-foreground"
              onClick={nextImage}
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
        
        {/* عرض الصورة النشطة مع تأثير الانتقال */}
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={activeIndex}
            custom={direction}
            variants={imageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className="absolute inset-0 w-full h-full"
            onClick={() => enableLightbox && setLightboxOpen(true)}
          >
            <BlurImage 
              src={activeImage.src}
              alt={activeImage.alt || `Image ${activeIndex + 1}`}
              placeholderSrc={activeImage.blurDataURL}
              objectFit="cover"
              width={activeImage.width}
              height={activeImage.height}
              className={cn(
                "w-full h-full cursor-pointer",
                enableLightbox && "hover:opacity-95 transition-opacity"
              )}
              priority={activeIndex === 0}
            />
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* عرض العرض المصغر في الأسفل إذا تم تحديده */}
      {thumbnailsPosition === 'bottom' && validImages.length > 1 && renderThumbnails()}
      {thumbnailsPosition === 'right' && validImages.length > 1 && renderThumbnails()}
      
      {/* عرض نقاط التنقل */}
      {showDots && validImages.length > 1 && renderDots()}
      
      {/* عرض صندوق الضوء */}
      {enableLightbox && renderLightbox()}
    </div>
  );
}

export default ImageGallery;