import { useState, useEffect } from "react";
import { getAreaGuide, AreaGuide as AreaGuideType, AreaGuidePreferences } from "@/lib/gemini";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sparkles,
  MapPin,
  Utensils,
  Bus,
  Star,
  LampDesk,
  LocateFixed,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AreaGuideSkeleton } from "@/components/ui/advanced-skeleton";

interface AreaGuideProps {
  propertyId: number;
  propertyLocation: string;
}

const AreaGuide = ({ propertyId, propertyLocation }: AreaGuideProps) => {
  const [areaGuide, setAreaGuide] = useState<AreaGuideType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<AreaGuidePreferences>({
    travelStyle: "leisure",
    interests: ["sightseeing", "food", "culture"],
    transportMode: "walking",
    travelingWith: ["partner"],
  });

  useEffect(() => {
    const fetchAreaGuide = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const guide = await getAreaGuide(propertyId, preferences);
        setAreaGuide(guide);
      } catch (err) {
        console.error("Error fetching area guide:", err);
        setError("Failed to load area guide. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAreaGuide();
  }, [propertyId, preferences]);

  const handlePreferenceChange = (key: keyof AreaGuidePreferences, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (isLoading) {
    return <AreaGuideSkeleton />;
  }

  if (error) {
    return (
      <Card className="my-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="mr-2 h-5 w-5" />
            Area Guide
          </CardTitle>
          <CardDescription>
            Discover the area around {propertyLocation}
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

  if (!areaGuide) return null;

  return (
    <Card className="my-6 border-none shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Sparkles className="mr-2 h-5 w-5 text-brand" />
            AI-Powered Area Guide
          </CardTitle>
          <Badge variant="outline" className="bg-brand/10 text-brand">
            Gemini AI
          </Badge>
        </div>
        <CardDescription>
          Discover the best of {propertyLocation} tailored to your preferences
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Preferences */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Customize Your Guide</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Travel Style</label>
              <Select 
                value={preferences.travelStyle} 
                onValueChange={(value) => handlePreferenceChange("travelStyle", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select travel style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="luxury">Luxury</SelectItem>
                  <SelectItem value="leisure">Leisure</SelectItem>
                  <SelectItem value="adventure">Adventure</SelectItem>
                  <SelectItem value="budget">Budget Friendly</SelectItem>
                  <SelectItem value="culture">Cultural</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Traveling With</label>
              <Select 
                value={preferences.travelingWith?.join(",")} 
                onValueChange={(value) => handlePreferenceChange("travelingWith", value.split(","))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select companions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solo">Solo</SelectItem>
                  <SelectItem value="partner">Partner</SelectItem>
                  <SelectItem value="family">Family</SelectItem>
                  <SelectItem value="friends">Friends</SelectItem>
                  <SelectItem value="family,children">Family with Children</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Transportation</label>
              <Select 
                value={preferences.transportMode} 
                onValueChange={(value) => handlePreferenceChange("transportMode", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="How you'll get around" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="walking">Walking</SelectItem>
                  <SelectItem value="public">Public Transport</SelectItem>
                  <SelectItem value="taxi">Taxi/Rideshare</SelectItem>
                  <SelectItem value="rental">Rental Car</SelectItem>
                  <SelectItem value="tour">Guided Tours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Interests</label>
              <Select 
                value={preferences.interests?.join(",")} 
                onValueChange={(value) => handlePreferenceChange("interests", value.split(","))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select interests" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="food,culture,sightseeing">Sightseeing & Culture</SelectItem>
                  <SelectItem value="adventure,outdoors">Adventure & Outdoors</SelectItem>
                  <SelectItem value="relaxation,beach">Relaxation & Beaches</SelectItem>
                  <SelectItem value="nightlife,entertainment">Nightlife & Entertainment</SelectItem>
                  <SelectItem value="shopping,food">Shopping & Dining</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Separator />

        {/* Overview */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center">
            <LocateFixed className="mr-2 h-5 w-5 text-brand" />
            Area Overview
          </h3>
          <div className="p-4 bg-muted/50 rounded-md">
            <p className="text-sm leading-relaxed">{areaGuide.overview}</p>
          </div>
        </div>

        <Separator />

        {/* Tabbed Content */}
        <Tabs defaultValue="attractions" className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="attractions" className="flex items-center">
              <LampDesk className="mr-2 h-4 w-4" />
              Attractions
            </TabsTrigger>
            <TabsTrigger value="dining" className="flex items-center">
              <Utensils className="mr-2 h-4 w-4" />
              Dining
            </TabsTrigger>
            <TabsTrigger value="tips" className="flex items-center">
              <Star className="mr-2 h-4 w-4" />
              Local Tips
            </TabsTrigger>
          </TabsList>
          
          {/* Attractions Tab */}
          <TabsContent value="attractions" className="space-y-4">
            {areaGuide.localAttractions.map((attraction, index) => (
              <Card key={index} className="overflow-hidden">
                <div className="p-4">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-semibold">{attraction.name}</h4>
                    <Badge variant="outline" className="text-xs">
                      {attraction.distance}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{attraction.description}</p>
                </div>
              </Card>
            ))}
          </TabsContent>
          
          {/* Dining Tab */}
          <TabsContent value="dining" className="space-y-4">
            {areaGuide.diningOptions.map((restaurant, index) => (
              <Card key={index} className="overflow-hidden">
                <div className="p-4">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <h4 className="font-semibold">{restaurant.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {restaurant.cuisine} • {restaurant.priceRange}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {restaurant.distance}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>
          
          {/* Tips Tab */}
          <TabsContent value="tips" className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center mb-2">
                <Bus className="mr-2 h-4 w-4" />
                Transportation Tips
              </h4>
              <ul className="space-y-2">
                {areaGuide.transportationTips.map((tip, index) => (
                  <li key={index} className="text-sm flex items-start">
                    <span className="text-brand mr-2">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center mb-2">
                <Star className="mr-2 h-4 w-4" />
                Insider Tips
              </h4>
              <ul className="space-y-2">
                {areaGuide.insiderTips.map((tip, index) => (
                  <li key={index} className="text-sm flex items-start">
                    <span className="text-brand mr-2">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      <CardFooter className="pt-2 pb-4 flex justify-center">
        <p className="text-xs text-center text-muted-foreground max-w-md">
          This area guide is generated by Gemini AI based on the property location and your preferences.
          Information may change over time. Check with local sources for the most current details.
        </p>
      </CardFooter>
    </Card>
  );
};



export default AreaGuide;