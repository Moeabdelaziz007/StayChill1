import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { SlidersHorizontal, Calendar as CalendarIcon, X, Check } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

const AMENITIES = [
  { id: "wifi", label: "WiFi" },
  { id: "pool", label: "Pool" },
  { id: "beach", label: "Beach Access" },
  { id: "ac", label: "Air Conditioning" },
  { id: "parking", label: "Free Parking" },
  { id: "gym", label: "Gym" },
  { id: "kitchen", label: "Kitchen" },
  { id: "tv", label: "TV" },
  { id: "workspace", label: "Workspace" },
  { id: "pets", label: "Pets Allowed" }
];

const PROPERTY_TYPES = [
  { id: "all", label: "All Types" },
  { id: "house", label: "House" },
  { id: "apartment", label: "Apartment" },
  { id: "villa", label: "Villa" },
  { id: "chalet", label: "Chalet" }
];

interface MobilePropertyFiltersProps {
  onApplyFilters: (filters: any) => void;
  activeFilters?: Record<string, any>;
}

export default function MobilePropertyFilters({ 
  onApplyFilters,
  activeFilters = {}
}: MobilePropertyFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([
    activeFilters.minPrice || 0, 
    activeFilters.maxPrice || 5000
  ]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    activeFilters.amenities || []
  );
  const [propertyType, setPropertyType] = useState<string>(
    activeFilters.propertyType || "all"
  );
  const [dateRange, setDateRange] = useState<[Date | undefined, Date | undefined]>([
    activeFilters.startDate ? new Date(activeFilters.startDate) : undefined, 
    activeFilters.endDate ? new Date(activeFilters.endDate) : undefined
  ]);
  const [bedrooms, setBedrooms] = useState<number>(activeFilters.bedrooms || 0);
  const [bathrooms, setBathrooms] = useState<number>(activeFilters.bathrooms || 0);
  const [capacity, setCapacity] = useState<number>(activeFilters.capacity || 1);

  // Count active filters
  const getActiveFiltersCount = () => {
    let count = 0;
    if (priceRange[0] > 0 || priceRange[1] < 5000) count++;
    if (selectedAmenities.length > 0) count++;
    if (propertyType !== "all") count++;
    if (dateRange[0] || dateRange[1]) count++;
    if (bedrooms > 0) count++;
    if (bathrooms > 0) count++;
    if (capacity > 1) count++;
    return count;
  };

  const applyFilters = () => {
    onApplyFilters({
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
      amenities: selectedAmenities,
      propertyType,
      startDate: dateRange[0],
      endDate: dateRange[1],
      bedrooms,
      bathrooms,
      capacity
    });
    setIsOpen(false);
  };

  const resetFilters = () => {
    setPriceRange([0, 5000]);
    setSelectedAmenities([]);
    setPropertyType("all");
    setDateRange([undefined, undefined]);
    setBedrooms(0);
    setBathrooms(0);
    setCapacity(1);
  };

  const toggleAmenity = (amenityId: string) => {
    if (selectedAmenities.includes(amenityId)) {
      setSelectedAmenities(selectedAmenities.filter(id => id !== amenityId));
    } else {
      setSelectedAmenities([...selectedAmenities, amenityId]);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-2 rounded-full border-gray-300"
        onClick={() => setIsOpen(true)}
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filters
        {getActiveFiltersCount() > 0 && (
          <Badge variant="secondary" className="h-5 w-5 p-0 text-xs flex items-center justify-center rounded-full">
            {getActiveFiltersCount()}
          </Badge>
        )}
      </Button>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-xl p-0">
          <SheetHeader className="px-4 py-3 border-b sticky top-0 bg-white z-10">
            <div className="flex justify-between items-center">
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                Clear all
              </Button>
              <SheetTitle className="text-center">Filters</SheetTitle>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </SheetHeader>
          
          <ScrollArea className="h-[calc(90vh-10rem)] overflow-y-auto px-4 pt-4">
            {/* Price Range Section */}
            <div className="mb-8">
              <h3 className="font-medium text-lg mb-4">Price Range</h3>
              <div className="mb-6">
                <Slider
                  value={priceRange}
                  min={0}
                  max={5000}
                  step={100}
                  onValueChange={(value) => setPriceRange(value as [number, number])}
                  className="my-6"
                />
                <div className="flex justify-between">
                  <span>{formatCurrency(priceRange[0])}</span>
                  <span>{formatCurrency(priceRange[1])}</span>
                </div>
              </div>
            </div>

            {/* Property Type */}
            <div className="mb-8">
              <h3 className="font-medium text-lg mb-4">Property Type</h3>
              <RadioGroup value={propertyType} onValueChange={setPropertyType}>
                <div className="grid grid-cols-2 gap-3">
                  {PROPERTY_TYPES.map((type) => (
                    <div key={type.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={type.id} id={`type-${type.id}`} />
                      <Label htmlFor={`type-${type.id}`}>{type.label}</Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>

            {/* Date Range */}
            <div className="mb-8">
              <h3 className="font-medium text-lg mb-4">Dates</h3>
              <div className="flex justify-center">
                <Calendar
                  mode="range"
                  selected={{
                    from: dateRange[0],
                    to: dateRange[1]
                  }}
                  onSelect={(range) => {
                    setDateRange([range?.from, range?.to]);
                  }}
                  numberOfMonths={1}
                  className="rounded-md border"
                />
              </div>
            </div>

            {/* Rooms and Capacity */}
            <div className="mb-8 grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="bedrooms" className="block mb-2">Bedrooms</Label>
                <div className="flex flex-row items-center">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8 rounded-l-md" 
                    onClick={() => setBedrooms(Math.max(0, bedrooms - 1))}
                  >
                    -
                  </Button>
                  <div className="h-8 px-4 flex items-center justify-center border-y">
                    {bedrooms}+
                  </div>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8 rounded-r-md" 
                    onClick={() => setBedrooms(bedrooms + 1)}
                  >
                    +
                  </Button>
                </div>
              </div>
              
              <div>
                <Label htmlFor="bathrooms" className="block mb-2">Bathrooms</Label>
                <div className="flex flex-row items-center">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8 rounded-l-md" 
                    onClick={() => setBathrooms(Math.max(0, bathrooms - 1))}
                  >
                    -
                  </Button>
                  <div className="h-8 px-4 flex items-center justify-center border-y">
                    {bathrooms}+
                  </div>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8 rounded-r-md" 
                    onClick={() => setBathrooms(bathrooms + 1)}
                  >
                    +
                  </Button>
                </div>
              </div>
              
              <div>
                <Label htmlFor="capacity" className="block mb-2">Guests</Label>
                <div className="flex flex-row items-center">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8 rounded-l-md" 
                    onClick={() => setCapacity(Math.max(1, capacity - 1))}
                  >
                    -
                  </Button>
                  <div className="h-8 px-4 flex items-center justify-center border-y">
                    {capacity}
                  </div>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8 rounded-r-md" 
                    onClick={() => setCapacity(capacity + 1)}
                  >
                    +
                  </Button>
                </div>
              </div>
            </div>

            {/* Amenities */}
            <div className="mb-8">
              <h3 className="font-medium text-lg mb-4">Amenities</h3>
              <div className="grid grid-cols-2 gap-3">
                {AMENITIES.map((amenity) => (
                  <div key={amenity.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`amenity-${amenity.id}`} 
                      checked={selectedAmenities.includes(amenity.id)}
                      onCheckedChange={() => toggleAmenity(amenity.id)}
                    />
                    <label
                      htmlFor={`amenity-${amenity.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {amenity.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>

          <div className="px-4 py-3 border-t sticky bottom-0 bg-white">
            <Button className="w-full" onClick={applyFilters}>
              Show {getActiveFiltersCount() > 0 ? "Results" : "All Properties"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}