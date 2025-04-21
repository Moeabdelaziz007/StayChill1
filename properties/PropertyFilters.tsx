import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchIcon, FilterIcon, XIcon } from "lucide-react";

export type PropertyFilterValues = {
  location: string;
  priceRange: [number, number];
  bedrooms: number | null;
  guests: number | null;
  amenities: string[];
};

interface PropertyFiltersProps {
  onChange: (filters: PropertyFilterValues) => void;
  defaultValues?: Partial<PropertyFilterValues>;
  className?: string;
  compact?: boolean;
}

const DEFAULT_FILTERS: PropertyFilterValues = {
  location: '',
  priceRange: [0, 5000],
  bedrooms: null,
  guests: null,
  amenities: [],
};

const AMENITIES_OPTIONS = [
  { label: 'واي فاي', value: 'wifi' },
  { label: 'مسبح', value: 'pool' },
  { label: 'إطلالة على البحر', value: 'sea_view' },
  { label: 'مكيف هواء', value: 'ac' },
  { label: 'موقف سيارات', value: 'parking' },
  { label: 'مطبخ', value: 'kitchen' },
  { label: 'تراس', value: 'balcony' },
  { label: 'تلفزيون', value: 'tv' },
];

export function PropertyFilters({ 
  onChange, 
  defaultValues = {}, 
  className = "",
  compact = false
}: PropertyFiltersProps) {
  const [filters, setFilters] = useState<PropertyFilterValues>({
    ...DEFAULT_FILTERS,
    ...defaultValues
  });
  
  const [showFilters, setShowFilters] = useState(!compact);

  const updateFilter = (key: keyof PropertyFilterValues, value: any) => {
    const updated = { ...filters, [key]: value };
    setFilters(updated);
    onChange(updated);
  };
  
  const toggleAmenity = (amenity: string) => {
    const exists = filters.amenities.includes(amenity);
    let updated: string[];
    
    if (exists) {
      updated = filters.amenities.filter(a => a !== amenity);
    } else {
      updated = [...filters.amenities, amenity];
    }
    
    updateFilter('amenities', updated);
  };
  
  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    onChange(DEFAULT_FILTERS);
  };
  
  const activeFiltersCount = Object.entries(filters).reduce((count, [key, value]) => {
    if (key === 'location' && value !== '') return count + 1;
    if (key === 'priceRange' && (value[0] !== DEFAULT_FILTERS.priceRange[0] || value[1] !== DEFAULT_FILTERS.priceRange[1])) return count + 1;
    if (key === 'bedrooms' && value !== null) return count + 1;
    if (key === 'guests' && value !== null) return count + 1;
    if (key === 'amenities' && value.length > 0) return count + 1;
    return count;
  }, 0);

  return (
    <div className={`bg-white shadow-lg rounded-xl p-4 ${className}`}>
      {/* Search Bar - Always Visible */}
      <div className="relative mb-4">
        <div className="absolute inset-y-0 rtl:right-3 ltr:left-3 flex items-center pointer-events-none">
          <SearchIcon className="h-5 w-5 text-gray-400" />
        </div>
        <Input
          placeholder="البحث عن الموقع (الساحل، راس الحكمة، ...)"
          className="pr-10 rtl:pr-10 ltr:pl-10 h-11"
          value={filters.location}
          onChange={(e) => updateFilter('location', e.target.value)}
        />
        
        {compact && (
          <Button
            size="sm"
            variant="outline"
            className="absolute inset-y-0 rtl:left-2 ltr:right-2 inline-flex items-center"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FilterIcon className="h-4 w-4 mr-1" />
            <span>تصفية</span>
            {activeFiltersCount > 0 && (
              <Badge className="bg-[#FFD700] text-[#00182A] h-5 w-5 p-0 flex items-center justify-center ml-1 rounded-full font-bold">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        )}
      </div>
      
      {/* Filters */}
      {showFilters && (
        <div className="space-y-6">
          {/* Price Range */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">نطاق السعر (جنيه/ليلة)</span>
              <span className="text-sm text-gray-500 font-mono">
                {filters.priceRange[0]} - {filters.priceRange[1]}
              </span>
            </div>
            <Slider
              min={0}
              max={10000}
              step={500}
              value={filters.priceRange}
              onValueChange={(val: any) => updateFilter('priceRange', val)}
              className="py-4"
            />
          </div>
          
          {/* Rooms and Guests */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">عدد الغرف</label>
              <Select
                value={filters.bedrooms?.toString() || "any-bedrooms"}
                onValueChange={(val) => updateFilter('bedrooms', val === "any-bedrooms" ? null : parseInt(val, 10))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="أي عدد" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any-bedrooms">أي عدد</SelectItem>
                  {[1, 2, 3, 4, 5, 6].map(n => 
                    <SelectItem key={n} value={n.toString()}>
                      {n} {n === 1 ? 'غرفة' : n < 11 ? 'غرف' : 'غرفة'}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">عدد الضيوف</label>
              <Select
                value={filters.guests?.toString() || "any-guests"}
                onValueChange={(val) => updateFilter('guests', val === "any-guests" ? null : parseInt(val, 10))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="أي عدد" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any-guests">أي عدد</SelectItem>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 20].map(n => 
                    <SelectItem key={n} value={n.toString()}>
                      {n} {n === 1 ? 'ضيف' : n < 11 ? 'ضيوف' : 'ضيف'}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Amenities */}
          <div className="space-y-2">
            <label className="text-sm font-medium">المرافق</label>
            <div className="flex flex-wrap gap-2">
              {AMENITIES_OPTIONS.map((amenity) => {
                const isSelected = filters.amenities.includes(amenity.value);
                return (
                  <Badge
                    key={amenity.value}
                    variant={isSelected ? "default" : "outline"}
                    className={`cursor-pointer transition-all ${
                      isSelected 
                        ? "bg-[#00182A] hover:bg-[#002D4A] text-white"
                        : "hover:bg-gray-100"
                    }`}
                    onClick={() => toggleAmenity(amenity.value)}
                  >
                    {amenity.label}
                    {isSelected && (
                      <XIcon className="h-3 w-3 mr-1 ml-1" />
                    )}
                  </Badge>
                );
              })}
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="text-gray-500"
            >
              إعادة تعيين
            </Button>
            
            <Button 
              size="sm"
              className="bg-[#00182A] hover:bg-[#002D4A] text-white"
            >
              <FilterIcon className="h-4 w-4 mr-2" />
              تطبيق الفلاتر
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}