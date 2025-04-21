import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import type { Property } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, Sparkles, Star } from "lucide-react";
import { PropertyRecommendationSkeleton } from "@/components/ui/advanced-skeleton";

// Define PropertyRecommendation type
export interface PropertyRecommendation {
  property: Property;
  matchScore: number;
  reasonsToBook: string[];
}

interface AIPropertyRecommendationsProps {
  currentProperty: Property;
}

// Helper function to get property recommendations based on preferences
const getPropertyRecommendations = async (preferences: any): Promise<PropertyRecommendation[]> => {
  try {
    // API request to get recommendations
    const response = await fetch('/api/properties/recommendations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preferences),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch property recommendations');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting property recommendations:', error);
    return []; // Return empty array on error
  }
};

const AIPropertyRecommendations = ({ currentProperty }: AIPropertyRecommendationsProps) => {
  const [, setLocation] = useLocation();
  const [recommendations, setRecommendations] = useState<PropertyRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = (path: string) => {
    setLocation(path);
  };

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Generate preferences based on the current property
        const preferences = {
          location: currentProperty.location,
          guests: currentProperty.guests,
          amenities: currentProperty.amenities || [],
          priceRange: { 
            min: Math.max(currentProperty.price * 0.7, 1000), 
            max: currentProperty.price * 1.3 
          }
        };
        
        // Fetch similar property recommendations
        const recs = await getPropertyRecommendations(preferences);
        
        // Filter out the current property
        const filteredRecs = recs.filter((rec: PropertyRecommendation) => rec.property.id !== currentProperty.id);
        
        // Take only the top 3 recommendations
        setRecommendations(filteredRecs.slice(0, 3));
      } catch (err) {
        console.error("Error fetching property recommendations:", err);
        setError("Could not load similar properties. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    if (currentProperty) {
      fetchRecommendations();
    }
  }, [currentProperty]);

  if (isLoading) {
    return <PropertyRecommendationSkeleton />;
  }

  if (error) {
    return null; // Hide this section if there's an error
  }

  if (!recommendations.length) {
    return null; // Hide this section if there are no recommendations
  }

  return (
    <div className="my-8">
      <div className="flex items-center mb-4">
        <Sparkles className="h-5 w-5 text-brand mr-2" />
        <h2 className="text-xl font-bold">You May Also Like</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations.map((rec, index) => (
          <Card key={index} className="overflow-hidden hover:shadow-md transition-shadow duration-300">
            <div 
              className="h-40 bg-cover bg-center cursor-pointer" 
              style={{ backgroundImage: `url(${rec.property.images?.[0] || ''})` }}
              onClick={() => navigate(`/property/${rec.property.id}`)}
            >
              <div className="flex justify-end p-2">
                <Badge className="bg-brand/90 text-white">
                  {rec.matchScore}% Match
                </Badge>
              </div>
            </div>
            
            <CardHeader className="pb-2">
              <CardTitle className="text-lg line-clamp-1">{rec.property.title}</CardTitle>
              <CardDescription className="flex items-center text-sm">
                {rec.property.rating && (
                  <>
                    <Star className="h-3 w-3 text-yellow-500 mr-1" />
                    <span className="mr-1">{rec.property.rating.toFixed(1)}</span>
                    <span className="mx-1">•</span>
                  </>
                )}
                <span>{rec.property.location}</span>
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pb-2">
              <p className="text-sm font-medium mb-2">Why you might like it:</p>
              <ul className="space-y-1 text-sm">
                {rec.reasonsToBook.slice(0, 2).map((reason, idx) => (
                  <li key={idx} className="flex items-start">
                    <ArrowRight className="h-3 w-3 mr-1 mt-1 text-brand" />
                    <span className="line-clamp-2">{reason}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            
            <CardFooter className="pt-0">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => navigate(`/property/${rec.property.id}`)}
              >
                View Property
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AIPropertyRecommendations;