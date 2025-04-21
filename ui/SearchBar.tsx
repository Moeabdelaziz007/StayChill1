import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { format } from "date-fns";

const SearchBar = () => {
  const [, setLocation] = useLocation();
  const [searchLocation, setSearchLocation] = useState("");
  const [checkInDate, setCheckInDate] = useState<Date | undefined>();
  const [checkOutDate, setCheckOutDate] = useState<Date | undefined>();
  const [guests, setGuests] = useState("1");
  
  const locations = [
    "Anywhere",
    "Ras El Hekma",
    "Sharm El Sheikh",
    "El Sahel",
    "Marina",
    "Marsa Matrouh"
  ];

  const handleSearch = () => {
    const params = new URLSearchParams();
    
    if (searchLocation && searchLocation !== "Anywhere") {
      params.set("location", searchLocation);
    }
    
    if (checkInDate) {
      params.set("checkIn", checkInDate.toISOString().split('T')[0]);
    }
    
    if (checkOutDate) {
      params.set("checkOut", checkOutDate.toISOString().split('T')[0]);
    }
    
    if (guests) {
      params.set("guests", guests);
    }
    
    const queryString = params.toString();
    setLocation(`/search${queryString ? `?${queryString}` : ''}`);
  };

  return (
    <div className="relative w-full">
      <div className="flex items-center border border-gray-300 rounded-full px-4 py-2 shadow-sm hover:shadow-md transition">
        <div className="border-r pr-3 border-gray-300">
          <span className="text-dark-gray font-medium text-sm">Location</span>
          <Select value={searchLocation} onValueChange={setSearchLocation}>
            <SelectTrigger className="mt-1 block w-full text-sm text-dark-gray border-none p-0 focus:outline-none focus:ring-0 bg-transparent">
              <SelectValue placeholder="Anywhere" />
            </SelectTrigger>
            <SelectContent>
              {locations.map((location) => (
                <SelectItem key={location} value={location}>{location}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="border-r px-3 border-gray-300">
          <span className="text-dark-gray font-medium text-sm">Check in</span>
          <Popover>
            <PopoverTrigger asChild>
              <button className="mt-1 block w-full text-sm text-dark-gray border-none p-0 focus:outline-none focus:ring-0 bg-transparent text-left">
                {checkInDate ? format(checkInDate, "MMM dd, yyyy") : "Add dates"}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={checkInDate}
                onSelect={setCheckInDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="border-r px-3 border-gray-300">
          <span className="text-dark-gray font-medium text-sm">Check out</span>
          <Popover>
            <PopoverTrigger asChild>
              <button className="mt-1 block w-full text-sm text-dark-gray border-none p-0 focus:outline-none focus:ring-0 bg-transparent text-left">
                {checkOutDate ? format(checkOutDate, "MMM dd, yyyy") : "Add dates"}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={checkOutDate}
                onSelect={setCheckOutDate}
                disabled={(date) => (checkInDate ? date < checkInDate : false)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="px-3">
          <span className="text-dark-gray font-medium text-sm">Guests</span>
          <Select value={guests} onValueChange={setGuests}>
            <SelectTrigger className="mt-1 block w-full text-sm text-dark-gray border-none p-0 focus:outline-none focus:ring-0 bg-transparent">
              <SelectValue placeholder="1 guest" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 guest</SelectItem>
              <SelectItem value="2">2 guests</SelectItem>
              <SelectItem value="3">3 guests</SelectItem>
              <SelectItem value="4">4 guests</SelectItem>
              <SelectItem value="5">5+ guests</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button 
          onClick={handleSearch}
          variant="default" 
          className="ml-2 bg-brand text-white p-2 rounded-full h-8 w-8 flex items-center justify-center"
          size="icon"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </Button>
      </div>
    </div>
  );
};

export default SearchBar;
