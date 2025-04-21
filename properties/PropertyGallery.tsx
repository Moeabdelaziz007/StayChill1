import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PropertyGalleryProps {
  images: string[];
  title: string;
}

const PropertyGallery = ({ images, title }: PropertyGalleryProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showGalleryModal, setShowGalleryModal] = useState(false);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleThumbnailClick = (index: number) => {
    setCurrentIndex(index);
  };

  if (!images || images.length === 0) {
    return (
      <div className="aspect-w-16 aspect-h-9 bg-gray-200 rounded-lg flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  const MainGallery = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
      <div className="md:col-span-2 aspect-w-16 aspect-h-9 relative">
        <img
          src={images[0]}
          alt={`${title} - Main Image`}
          className="w-full h-full object-cover rounded-tl-xl rounded-tr-xl md:rounded-tr-none md:rounded-tl-xl"
          loading="lazy"
        />
        {images.length > 3 && (
          <button
            onClick={() => setShowGalleryModal(true)}
            className="absolute bottom-4 right-4 bg-white text-dark-gray rounded-md px-3 py-2 text-sm font-medium shadow-sm hover:bg-gray-100 transition"
          >
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
              </svg>
              Show all photos
            </div>
          </button>
        )}
      </div>
      
      {images.length > 1 && (
        <div className="aspect-w-1 aspect-h-1 relative">
          <img
            src={images[1]}
            alt={`${title} - Image 2`}
            className="w-full h-full object-cover md:rounded-none"
            loading="lazy"
          />
        </div>
      )}

      {images.length > 2 && (
        <div className="aspect-w-1 aspect-h-1 relative">
          <img
            src={images[2]}
            alt={`${title} - Image 3`}
            className="w-full h-full object-cover rounded-bl-xl rounded-br-xl md:rounded-bl-none md:rounded-tr-xl md:rounded-br-xl"
            loading="lazy"
          />
        </div>
      )}
    </div>
  );

  return (
    <div>
      <div className="cursor-pointer" onClick={() => setShowGalleryModal(true)}>
        <MainGallery />
      </div>

      <Dialog open={showGalleryModal} onOpenChange={setShowGalleryModal}>
        <DialogContent className="sm:max-w-[800px] h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className="flex-grow flex flex-col md:flex-row gap-4 overflow-hidden">
            <div className="flex-grow relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <img
                  src={images[currentIndex]}
                  alt={`${title} - Gallery Image ${currentIndex + 1}`}
                  className="max-w-full max-h-full object-contain"
                  loading="lazy"
                />
              </div>
              
              <Button
                variant="outline"
                size="icon"
                className="absolute left-2 top-1/2 transform -translate-y-1/2 h-8 w-8 rounded-full bg-white"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 rounded-full bg-white"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            </div>
            
            <div className="md:w-24 h-full overflow-y-auto flex md:flex-col gap-2 p-2">
              {images.map((image, index) => (
                <div 
                  key={index}
                  className={`relative cursor-pointer ${
                    currentIndex === index ? 'ring-2 ring-brand' : ''
                  }`}
                  onClick={() => handleThumbnailClick(index)}
                >
                  <img
                    src={image}
                    alt={`${title} - Thumbnail ${index + 1}`}
                    className="h-16 w-24 md:w-20 md:h-16 object-cover rounded"
                    loading="lazy"
                  />
                  <div className={`absolute inset-0 bg-white bg-opacity-50 ${
                    currentIndex === index ? 'hidden' : 'hover:bg-opacity-30'
                  }`} />
                </div>
              ))}
            </div>
          </div>
          <div className="mt-2 text-center text-sm text-gray-500">
            {currentIndex + 1} / {images.length}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PropertyGallery;
