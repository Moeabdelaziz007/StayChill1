import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface PropertyCardProps {
  id: number;
  title: string;
  location: string;
  description: string;
  price: number;
  images: string[];
  rating?: number;
  featured?: boolean;
  pointsEarnable?: number;
}

const PropertyCard = ({
  id,
  title,
  location,
  description,
  price,
  images,
  rating,
  featured,
  pointsEarnable,
}: PropertyCardProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  
  // التأكد من تعريف مصفوفة الصور ووجود عناصر فيها
  const safeImages = Array.isArray(images) && images.length > 0 ? images : ["https://placehold.co/600x400?text=No+Image"];

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % safeImages.length);
  };
  
  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + safeImages.length) % safeImages.length);
  };
  
  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };
  
  return (
    <Link href={`/property/${id}`}>
      <div className="property-card rounded-xl overflow-hidden transition duration-200 ease-in-out cursor-pointer hover:shadow-md">
        <div className="relative">
          <div className="aspect-w-4 aspect-h-3 bg-gray-200">
            <img
              src={safeImages[currentImageIndex] || safeImages[0] || "https://placehold.co/600x400?text=No+Image"}
              alt={title}
              className="w-full h-full object-cover rounded-t-xl"
              loading="lazy"
            />
          </div>
          
          {/* Controls */}
          <button
            onClick={toggleFavorite}
            className="absolute top-3 right-3 text-gray-700 hover:text-brand focus:outline-none z-10 h-8 w-8 flex items-center justify-center bg-white bg-opacity-70 rounded-full"
          >
            {isFavorite ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-brand">
                <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            )}
          </button>
          
          {/* Image navigation */}
          {safeImages.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-70 rounded-full p-1 focus:outline-none z-10"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
              
              <button
                onClick={handleNext}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-70 rounded-full p-1 focus:outline-none z-10"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </>
          )}
          
          {/* Carousel indicators */}
          {safeImages.length > 1 && (
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1">
              {safeImages.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full ${
                    idx === currentImageIndex ? "bg-white" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          )}
          
          {/* Featured badge */}
          {featured && (
            <div className="absolute top-3 left-3 bg-brand text-white text-xs font-semibold px-2 py-1 rounded-md">
              Featured
            </div>
          )}
        </div>
        
        <CardContent className="p-3">
          <div className="flex justify-between items-start mt-1">
            <h3 className="font-medium text-dark-gray">{title}</h3>
            {rating && (
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-yellow-500">
                  <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                </svg>
                <span className="ml-1 text-dark-gray text-sm">{rating.toFixed(1)}</span>
              </div>
            )}
          </div>
          
          <p className="text-medium-gray text-sm mt-1">{location}</p>
          <p className="text-medium-gray text-sm truncate">{description}</p>
          <p className="mt-2">
            <span className="font-semibold text-dark-gray">${price}</span>
            <span className="text-medium-gray"> night</span>
          </p>
          
          {/* Points badge */}
          {pointsEarnable && (
            <div className="mt-2 inline-flex items-center px-2 py-1 bg-brand-orange bg-opacity-10 rounded-md">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-brand-orange mr-1">
                <path d="M9.375 3a1.875 1.875 0 000 3.75h1.875v4.5H3.375A1.875 1.875 0 011.5 9.375v-.75c0-1.036.84-1.875 1.875-1.875h3.193A3.375 3.375 0 0112 2.753a3.375 3.375 0 015.432 3.997h3.943c1.035 0 1.875.84 1.875 1.875v.75c0 1.036-.84 1.875-1.875 1.875H12.75v-4.5h1.875a1.875 1.875 0 10-1.875-1.875V6.75h-1.5V4.875C11.25 3.839 10.41 3 9.375 3zM11.25 12.75H3v6.75a2.25 2.25 0 002.25 2.25h6v-9zM12.75 12.75v9h6.75a2.25 2.25 0 002.25-2.25v-6.75h-9z" />
              </svg>
              <span className="text-xs text-brand-orange font-medium">
                Earn {pointsEarnable} points
              </span>
            </div>
          )}
        </CardContent>
      </div>
    </Link>
  );
};

export default PropertyCard;
