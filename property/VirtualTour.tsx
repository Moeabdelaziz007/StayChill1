import { useState, useEffect } from "react";
import { getVirtualTour, VirtualTour as VirtualTourType } from "@/lib/gemini";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight, Eye, MapPin, Star } from "lucide-react";
import { VirtualTourSkeleton } from "@/components/ui/advanced-skeleton";

interface VirtualTourProps {
  propertyId: number;
  propertyTitle: string;
}

const VirtualTour = ({ propertyId, propertyTitle }: VirtualTourProps) => {
  const [virtualTour, setVirtualTour] = useState<VirtualTourType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVirtualTour = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const tour = await getVirtualTour(propertyId);
        setVirtualTour(tour);
      } catch (err) {
        console.error("Error fetching virtual tour:", err);
        setError("Failed to load virtual tour experience. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchVirtualTour();
  }, [propertyId]);

  if (isLoading) {
    return <VirtualTourSkeleton />;
  }

  if (error) {
    return (
      <Card className="my-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Eye className="mr-2 h-5 w-5" />
            Virtual Tour Experience
          </CardTitle>
          <CardDescription>
            Experience this property through our AI-powered virtual tour
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-6 text-center">
            <p className="text-destructive">{error}</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!virtualTour) return null;

  return (
    <Card className="my-6 border-none shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Sparkles className="mr-2 h-5 w-5 text-brand" />
            AI-Powered Virtual Tour
          </CardTitle>
          <Badge variant="outline" className="bg-brand/10 text-brand">
            Gemini AI
          </Badge>
        </div>
        <CardDescription>
          Experience {propertyTitle} through our immersive AI-generated virtual tour
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Highlights Section */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center">
            <Star className="mr-2 h-5 w-5 text-yellow-500" />
            Property Highlights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {virtualTour.highlights.map((highlight, index) => (
              <div 
                key={index} 
                className="flex items-start p-3 bg-muted/50 rounded-md"
              >
                <ArrowRight className="h-4 w-4 mr-2 mt-1 text-brand" />
                <p className="text-sm">{highlight}</p>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Room Descriptions */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Detailed Room Tour</h3>
          <Accordion type="single" collapsible className="w-full">
            {virtualTour.detailedRoomDescriptions.map((room, index) => (
              <AccordionItem key={index} value={`room-${index}`}>
                <AccordionTrigger className="hover:text-brand">
                  {room.room}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed">
                  {room.description}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <Separator />

        {/* Surrounding Area */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center">
            <MapPin className="mr-2 h-5 w-5 text-red-500" />
            Surrounding Area
          </h3>
          <div className="p-4 bg-muted/50 rounded-md">
            <p className="text-sm leading-relaxed">{virtualTour.surroundingArea}</p>
          </div>
        </div>

        {/* Experiences */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Recommended Experiences</h3>
          <div className="flex flex-wrap gap-2">
            {virtualTour.recommendedExperiences.map((experience, index) => (
              <Badge 
                key={index} 
                variant="secondary"
                className="py-2 text-xs"
              >
                {experience}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-2 pb-4 flex justify-center">
        <p className="text-xs text-center text-muted-foreground max-w-md">
          This virtual tour is generated by Gemini AI based on property details and location information.
          The actual property may differ from descriptions.
        </p>
      </CardFooter>
    </Card>
  );
};

export default VirtualTour;