import { useState } from "react";
import { useLocation } from "wouter";

interface LocationOption {
  id: string;
  name: string;
  image: string;
}

const locations: LocationOption[] = [
  {
    id: "ras-el-hekma",
    name: "Ras El Hekma",
    image: "https://images.unsplash.com/photo-1617143207675-e7e6371f5f5d?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "sharm-el-sheikh",
    name: "Sharm El Sheikh",
    image: "https://images.unsplash.com/photo-1575538439014-1b8bc5fcaa1d?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "el-sahel",
    name: "El Sahel",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "marina",
    name: "Marina",
    image: "https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "marsa-matrouh",
    name: "Marsa Matrouh",
    image: "https://images.unsplash.com/photo-1544550581-1bcabf842b77?auto=format&fit=crop&w=600&q=80"
  }
];

const LocationFilter = () => {
  const [, setLocation] = useLocation();
  const [activeLocation, setActiveLocation] = useState<string | null>(null);
  
  const handleLocationClick = (locationName: string) => {
    if (activeLocation === locationName) {
      setActiveLocation(null);
      setLocation('/search');
    } else {
      setActiveLocation(locationName);
      setLocation(`/search?location=${encodeURIComponent(locationName)}`);
    }
  };
  
  return (
    <section className="mt-6">
      <div className="flex flex-no-wrap overflow-x-auto pb-4 scrollbar-hide gap-8">
        {locations.map((location) => (
          <button
            key={location.id}
            className="flex flex-col items-center min-w-[80px] focus:outline-none group"
            onClick={() => handleLocationClick(location.name)}
          >
            <div className="w-6 h-6 mb-2 relative">
              <img 
                src={location.image} 
                alt={location.name} 
                className={`w-full h-full object-cover rounded transition-all duration-200 ${activeLocation === location.name ? 'ring-2 ring-brand' : ''}`}
                loading="lazy"
              />
            </div>
            <span 
              className={`text-sm group-hover:text-brand group-hover:underline ${activeLocation === location.name ? 'text-brand font-medium' : 'text-dark-gray'}`}
            >
              {location.name}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
};

export default LocationFilter;
