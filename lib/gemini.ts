// Advanced Gemini AI features for StayChill
// Interfaces
export interface PropertyPreferences {
  location?: string;
  guests?: number;
  priceRange?: { min: number; max: number };
  amenities?: string[];
  startDate?: Date;
  endDate?: Date;
  travelPurpose?: string;
  travelStyle?: string;
  preferredActivities?: string[];
  accessibility?: string[];
  travelingWith?: string[];
}

export interface PropertyRecommendation {
  property: any;
  matchScore: number;
  reasonsToBook: string[];
}

export interface VirtualTour {
  highlights: string[];
  detailedRoomDescriptions: { room: string; description: string }[];
  surroundingArea: string;
  recommendedExperiences: string[];
}

export interface AreaGuidePreferences {
  travelStyle?: string;
  interests?: string[];
  dietaryRestrictions?: string[];
  transportMode?: string;
  travelingWith?: string[];
}

export interface AreaGuide {
  overview: string;
  localAttractions: { name: string; description: string; distance: string }[];
  diningOptions: { name: string; cuisine: string; priceRange: string; distance: string }[];
  transportationTips: string[];
  insiderTips: string[];
}

// Function to get AI-powered property recommendations based on user preferences
export const getPropertyRecommendations = async (preferences: PropertyPreferences): Promise<PropertyRecommendation[]> => {
  try {
    const response = await fetch('/api/recommendations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ preferences }),
    });

    if (!response.ok) {
      throw new Error('Failed to get recommendations');
    }

    return await response.json();
  } catch (error) {
    // Only log critical errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error getting recommendations:', error);
    }
    throw error;
  }
};

// Function to get AI-generated virtual tour for a property
export const getVirtualTour = async (propertyId: number): Promise<VirtualTour> => {
  try {
    const response = await fetch(`/api/properties/${propertyId}/virtual-tour`);

    if (!response.ok) {
      throw new Error('Failed to get virtual tour');
    }

    return await response.json();
  } catch (error) {
    // Only log critical errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error getting virtual tour:', error);
    }
    throw error;
  }
};

// Function to get AI-generated area guide for a property
export const getAreaGuide = async (propertyId: number, preferences: AreaGuidePreferences): Promise<AreaGuide> => {
  try {
    const response = await fetch(`/api/properties/${propertyId}/area-guide`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ preferences }),
    });

    if (!response.ok) {
      throw new Error('Failed to get area guide');
    }

    return await response.json();
  } catch (error) {
    // Only log critical errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error getting area guide:', error);
    }
    throw error;
  }
};

// Function to enhance search queries with AI to understand natural language
export const enhanceSearchQuery = async (naturalLanguageQuery: string): Promise<PropertyPreferences> => {
  try {
    // This would typically call a server endpoint, but for now we'll parse locally
    const preferences: PropertyPreferences = {};
    
    // Simple parsing logic (would be replaced with AI)
    if (naturalLanguageQuery.toLowerCase().includes('beach')) {
      preferences.location = 'beach';
    }
    
    if (naturalLanguageQuery.toLowerCase().includes('family')) {
      preferences.travelingWith = ['family'];
      preferences.guests = 4;
    }
    
    if (naturalLanguageQuery.toLowerCase().includes('luxury')) {
      preferences.priceRange = { min: 300, max: 1000 };
      preferences.amenities = ['pool', 'spa', 'wifi'];
    }
    
    return preferences;
  } catch (error) {
    // Only log critical errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error enhancing search query:', error);
    }
    return {};
  }
};
