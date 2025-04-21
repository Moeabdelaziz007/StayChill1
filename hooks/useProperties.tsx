import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export interface Property {
  id: number;
  title: string;
  description: string;
  location: string;
  address: string;
  price: number;
  beds: number;
  baths: number;
  guests: number;
  images: string[];
  amenities?: string[];
  rating?: number;
  reviewsCount?: number;
  userId: number;
  featured?: boolean;
  active?: boolean;
  createdAt: string | Date;
}

interface PropertyFilters {
  location?: string;
  priceMin?: number;
  priceMax?: number;
  beds?: number;
  baths?: number;
  guests?: number;
  amenities?: string[];
  limit?: number;
  offset?: number;
}

export const useProperties = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get all properties with optional filters
  const getProperties = async (filters: PropertyFilters = {}): Promise<Property[]> => {
    const params = new URLSearchParams();
    
    // Add filters to query params
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v));
        } else {
          params.append(key, value.toString());
        }
      }
    });
    
    const queryString = params.toString();
    const url = `/api/properties${queryString ? `?${queryString}` : ''}`;
    
    try {
      const response = await apiRequest("GET", url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch properties: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast({
        title: "Error fetching properties",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
      return []; // Return empty array to prevent UI crashes
    }
  };
  
  // Get properties owned by the current user
  const fetchUserProperties = async (): Promise<Property[]> => {
    try {
      const response = await apiRequest("GET", '/api/me/properties');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch user properties: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching user properties:', error);
      toast({
        title: "Error fetching your properties",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
      return []; // Return empty array to prevent UI crashes
    }
  };
  
  // Get featured properties
  const getFeaturedProperties = async (limit = 6): Promise<Property[]> => {
    try {
      const response = await apiRequest("GET", `/api/properties/featured?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch featured properties: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching featured properties:', error);
      toast({
        title: "Error fetching featured properties",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
      return []; // Return empty array to prevent UI crashes
    }
  };
  
  // Get a single property by ID
  const getProperty = async (id: number): Promise<Property> => {
    try {
      const response = await apiRequest("GET", `/api/properties/${id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch property: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching property ${id}:`, error);
      toast({
        title: "Error fetching property details",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
      // Return an empty property object to prevent UI crashes
      return {
        id: 0,
        title: "Error loading property",
        description: "Could not load property details",
        location: "",
        address: "",
        price: 0,
        beds: 0,
        baths: 0,
        guests: 0,
        images: [],
        userId: 0,
        createdAt: new Date()
      };
    }
  };
  
  // Create a new property
  const createProperty = async (propertyData: Omit<Property, 'id' | 'createdAt'>): Promise<Property> => {
    try {
      const response = await apiRequest("POST", "/api/properties", propertyData);
      
      if (!response.ok) {
        throw new Error(`Failed to create property: ${response.statusText}`);
      }
      
      const newProperty = await response.json();
      
      // Invalidate property queries
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      queryClient.invalidateQueries({ queryKey: ['/api/properties/featured'] });
      
      toast({
        title: "Property created",
        description: "Your property has been created successfully",
      });
      
      return newProperty;
    } catch (error) {
      console.error('Error creating property:', error);
      toast({
        title: "Error",
        description: "Failed to create property. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };
  
  // Update a property
  const updateProperty = async (id: number, propertyData: Partial<Property>): Promise<Property> => {
    try {
      const response = await apiRequest("PUT", `/api/properties/${id}`, propertyData);
      
      if (!response.ok) {
        throw new Error(`Failed to update property: ${response.statusText}`);
      }
      
      const updatedProperty = await response.json();
      
      // Invalidate property queries
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      queryClient.invalidateQueries({ queryKey: [`/api/properties/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/properties/featured'] });
      
      toast({
        title: "Property updated",
        description: "Your property has been updated successfully",
      });
      
      return updatedProperty;
    } catch (error) {
      console.error(`Error updating property ${id}:`, error);
      toast({
        title: "Error",
        description: "Failed to update property. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };
  
  // Delete a property
  const deleteProperty = async (id: number): Promise<boolean> => {
    try {
      const response = await apiRequest("DELETE", `/api/properties/${id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to delete property: ${response.statusText}`);
      }
      
      // Invalidate property queries
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      queryClient.invalidateQueries({ queryKey: ['/api/properties/featured'] });
      
      toast({
        title: "Property deleted",
        description: "Your property has been deleted successfully",
      });
      
      return true;
    } catch (error) {
      console.error(`Error deleting property ${id}:`, error);
      toast({
        title: "Error",
        description: "Failed to delete property. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };
  
  // React Query hook for getting user's properties
  const getUserProperties = () => {
    return useQuery({
      queryKey: ['/api/me/properties'],
      queryFn: async () => {
        try {
          const properties = await fetchUserProperties();
          // Validate response is an array
          if (!Array.isArray(properties)) {
            throw new Error('Invalid response format from API');
          }
          return properties;
        } catch (error) {
          console.error('Error in getUserProperties query:', error);
          toast({
            title: "Error",
            description: "Failed to load your properties. Please try again.",
            variant: "destructive",
          });
          // Return empty array instead of throwing to prevent UI crashes
          return [];
        }
      },
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    });
  };

  return {
    getProperties,
    getFeaturedProperties,
    getProperty,
    createProperty,
    updateProperty,
    deleteProperty,
    getUserProperties,
  };
};
