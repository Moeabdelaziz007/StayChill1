import { type Restaurant } from "@shared/schema";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { MapPin, Clock, Utensils, Star } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface RestaurantCardProps {
  restaurant: Restaurant;
  className?: string;
}

export function RestaurantCard({ restaurant, className = "" }: RestaurantCardProps) {
  const {
    id,
    name,
    location,
    cuisineType,
    priceRange,
    images,
    openingTime,
    closingTime,
    rating,
    featured,
  } = restaurant;

  return (
    <Card className={`overflow-hidden transition-all hover:shadow-md ${className}`}>
      <div className="relative h-48 overflow-hidden">
        <img
          src={images?.[0] || "/placeholder-restaurant.jpg"}
          alt={name}
          className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
          loading="lazy"
        />
        {featured && (
          <Badge className="absolute top-3 right-3 bg-brand text-white" variant="secondary">
            Featured
          </Badge>
        )}
      </div>
      
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-xl font-semibold line-clamp-1">{name}</h3>
          <div className="flex items-center gap-1 text-amber-500">
            {rating ? (
              <>
                <Star className="w-4 h-4 fill-current" />
                <span className="font-medium">{rating.toFixed(1)}</span>
              </>
            ) : (
              <span className="text-sm text-muted-foreground">New</span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4" />
          <span>{location}</span>
          <Separator orientation="vertical" className="h-3" />
          <Utensils className="w-4 h-4" />
          <span>{cuisineType}</span>
        </div>
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1 text-sm">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span>
              {openingTime.substring(0, 5)} - {closingTime.substring(0, 5)}
            </span>
          </div>
          <Badge variant="outline">{priceRange}</Badge>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        <Link href={`/restaurant/${id}`}>
          <a className="w-full px-4 py-2 text-center text-white transition-colors rounded-md bg-brand hover:bg-brand/90">
            View Details
          </a>
        </Link>
      </CardFooter>
    </Card>
  );
}