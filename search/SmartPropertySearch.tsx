import { useState } from "react";
import { useLocation } from "wouter";
import { 
  enhanceSearchQuery, 
  PropertyPreferences, 
  getPropertyRecommendations,
  PropertyRecommendation 
} from "@/lib/gemini";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sparkles, Search, Lightbulb, ArrowRight } from "lucide-react";
import { ShimmerWrapper } from "@/components/ui/advanced-skeleton";

interface SmartPropertySearchProps {
  onRecommendationsReceived?: (recommendations: PropertyRecommendation[]) => void;
}

const SmartPropertySearch = ({ onRecommendationsReceived }: SmartPropertySearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [enhancedPreferences, setEnhancedPreferences] = useState<PropertyPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogStep, setDialogStep] = useState<"enhancing" | "enhanced" | "recommendations">("enhancing");
  const [recommendations, setRecommendations] = useState<PropertyRecommendation[]>([]);
  const [, navigate] = useLocation();

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setShowDialog(true);
    setDialogStep("enhancing");
    setIsLoading(true);
    
    try {
      // Enhance search query to extract preferences
      const preferences = await enhanceSearchQuery(searchQuery);
      setEnhancedPreferences(preferences);
      setDialogStep("enhanced");
      
      // Get recommendations based on enhanced preferences
      const recommendations = await getPropertyRecommendations(preferences);
      setRecommendations(recommendations);
      setDialogStep("recommendations");
      
      // Notify parent component if needed
      if (onRecommendationsReceived) {
        onRecommendationsReceived(recommendations);
      }
    } catch (error) {
      console.error("Error in smart search:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplySearch = () => {
    setShowDialog(false);
    
    if (!enhancedPreferences) return;
    
    // Build URL search params
    const params = new URLSearchParams();
    
    if (enhancedPreferences.location) {
      params.set("location", enhancedPreferences.location);
    }
    
    if (enhancedPreferences.guests) {
      params.set("guests", enhancedPreferences.guests.toString());
    }
    
    if (enhancedPreferences.priceRange) {
      params.set("priceMin", enhancedPreferences.priceRange.min.toString());
      params.set("priceMax", enhancedPreferences.priceRange.max.toString());
    }
    
    if (enhancedPreferences.amenities && enhancedPreferences.amenities.length > 0) {
      params.set("amenities", enhancedPreferences.amenities.join(","));
    }
    
    // Navigate to search page with params
    navigate(`/search?${params.toString()}`);
  };

  return (
    <>
      <div className="relative w-full max-w-3xl flex">
        <Input
          placeholder="Try 'Luxury beachfront villa for a family vacation in Sharm El Sheikh'"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-12"
        />
        <Button 
          className="absolute right-0 m-1 px-3" 
          variant="ghost"
          onClick={handleSearch}
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>
      
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Sparkles className="mr-2 h-5 w-5 text-brand" />
              AI-Powered Smart Search
            </DialogTitle>
            <DialogDescription>
              Let our AI find the perfect properties based on your needs
            </DialogDescription>
          </DialogHeader>
          
          {dialogStep === "enhancing" && (
            <div className="py-6 space-y-6">
              <div className="flex justify-center">
                <div className="w-12 h-12 rounded-full border-4 border-brand border-t-transparent animate-spin"></div>
              </div>
              <p className="text-center">
                Gemini AI is analyzing your search query...
              </p>
              <div>
                <p className="font-medium">Your search:</p>
                <p className="text-muted-foreground italic">"{searchQuery}"</p>
              </div>
            </div>
          )}
          
          {dialogStep === "enhanced" && enhancedPreferences && (
            <div className="py-4 space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center">
                    <Lightbulb className="mr-2 h-4 w-4 text-yellow-500" />
                    I understood you're looking for:
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {enhancedPreferences.location && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Location</Badge>
                      <span>{enhancedPreferences.location}</span>
                    </div>
                  )}
                  
                  {enhancedPreferences.guests && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Guests</Badge>
                      <span>{enhancedPreferences.guests} people</span>
                    </div>
                  )}
                  
                  {enhancedPreferences.priceRange && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Price Range</Badge>
                      <span>${enhancedPreferences.priceRange.min} - ${enhancedPreferences.priceRange.max} per night</span>
                    </div>
                  )}
                  
                  {enhancedPreferences.amenities && enhancedPreferences.amenities.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline">Amenities</Badge>
                      <div className="flex flex-wrap gap-1">
                        {enhancedPreferences.amenities.map((amenity, index) => (
                          <Badge key={index} variant="secondary">{amenity}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {enhancedPreferences.travelPurpose && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Purpose</Badge>
                      <span>{enhancedPreferences.travelPurpose}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <div className="flex justify-center">
                <div className="w-10 h-10 rounded-full border-4 border-brand border-t-transparent animate-spin"></div>
              </div>
              <p className="text-center text-sm">
                Finding perfect matches for you...
              </p>
            </div>
          )}
          
          {dialogStep === "recommendations" && (
            <div className="py-4 space-y-4 max-h-96 overflow-y-auto pr-2">
              <p className="text-center text-sm font-medium">
                Based on your search, we found these perfect matches:
              </p>
              
              {recommendations.slice(0, 3).map((rec, index) => (
                <Card key={index} className="overflow-hidden">
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{rec.property.title}</h4>
                        <p className="text-xs text-muted-foreground">{rec.property.location}</p>
                      </div>
                      <Badge className="bg-brand text-white">
                        {rec.matchScore}% Match
                      </Badge>
                    </div>
                    
                    <Separator className="my-3" />
                    
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium">Why this is perfect for you:</h5>
                      <ul className="space-y-1">
                        {rec.reasonsToBook.map((reason, idx) => (
                          <li key={idx} className="text-sm flex items-start">
                            <ArrowRight className="h-3 w-3 mr-2 mt-1 text-brand" />
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleApplySearch} disabled={dialogStep !== "recommendations"}>
              Apply Search
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SmartPropertySearch;