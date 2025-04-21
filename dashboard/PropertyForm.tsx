import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useProperties } from "@/hooks/useProperties";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

const formSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters" }),
  description: z.string().min(20, { message: "Description must be at least 20 characters" }),
  location: z.string().min(1, { message: "Location is required" }),
  address: z.string().min(5, { message: "Address must be at least 5 characters" }),
  price: z.number().min(1, { message: "Price must be greater than 0" }),
  beds: z.number().min(1, { message: "Must have at least 1 bed" }),
  baths: z.number().min(1, { message: "Must have at least 1 bathroom" }),
  guests: z.number().min(1, { message: "Must accommodate at least 1 guest" }),
  images: z.array(z.string()).min(1, { message: "At least one image is required" }),
  amenities: z.array(z.string()).optional(),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

const locations = [
  "Ras El Hekma",
  "Sharm El Sheikh",
  "El Sahel",
  "Marina",
  "Marsa Matrouh"
];

const amenitiesList = [
  { id: "wifi", label: "Wifi" },
  { id: "air_conditioning", label: "Air Conditioning" },
  { id: "kitchen", label: "Kitchen" },
  { id: "pool", label: "Pool" },
  { id: "parking", label: "Free Parking" },
  { id: "tv", label: "TV" },
  { id: "washer", label: "Washer" },
  { id: "beachfront", label: "Beachfront" },
  { id: "waterfront", label: "Waterfront" },
  { id: "amazing_views", label: "Amazing Views" }
];

interface PropertyFormProps {
  propertyId?: number;
}

const PropertyForm = ({ propertyId }: PropertyFormProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { getProperty, createProperty, updateProperty } = useProperties();
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  
  const isEditMode = !!propertyId;
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      address: "",
      price: 0,
      beds: 1,
      baths: 1,
      guests: 1,
      images: [],
      amenities: [],
      featured: false,
      active: true,
    },
  });
  
  useEffect(() => {
    const loadProperty = async () => {
      if (!propertyId) return;
      
      setIsLoading(true);
      try {
        const property = await getProperty(propertyId);
        if (property) {
          form.reset({
            title: property.title,
            description: property.description,
            location: property.location,
            address: property.address,
            price: property.price,
            beds: property.beds,
            baths: property.baths,
            guests: property.guests,
            images: property.images,
            amenities: property.amenities || [],
            featured: property.featured || false,
            active: property.active || true,
          });
          setImageUrls(property.images);
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load property",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProperty();
  }, [propertyId, getProperty, form, toast]);
  
  const handleAddImage = () => {
    if (!newImageUrl.trim()) return;
    
    // Simple image URL validation
    try {
      new URL(newImageUrl);
      const updatedUrls = [...imageUrls, newImageUrl];
      setImageUrls(updatedUrls);
      form.setValue("images", updatedUrls);
      setNewImageUrl("");
    } catch (error) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid image URL",
        variant: "destructive",
      });
    }
  };
  
  const handleRemoveImage = (index: number) => {
    const updatedUrls = imageUrls.filter((_, i) => i !== index);
    setImageUrls(updatedUrls);
    form.setValue("images", updatedUrls);
  };
  
  const onSubmit = async (data: FormValues) => {
    if (!user) {
      toast({
        title: "Unauthorized",
        description: "You must be logged in to perform this action",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (isEditMode) {
        await updateProperty(propertyId, data);
        toast({
          title: "Success",
          description: "Property updated successfully",
        });
      } else {
        const newProperty = await createProperty({
          ...data,
          userId: user.id,
        });
        toast({
          title: "Success",
          description: "Property created successfully",
        });
      }
      
      navigate("/admin/properties");
    } catch (error) {
      toast({
        title: "Error",
        description: isEditMode 
          ? "Failed to update property" 
          : "Failed to create property",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Property Title</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter a descriptive title" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Describe your property, its features, and surroundings"
                      className="min-h-[150px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Full address" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price per night ($)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    min="0"
                    step="1"
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="beds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beds</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min="1"
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="baths"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Baths</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min="1"
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="guests"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Guests</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min="1"
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="images"
              render={() => (
                <FormItem>
                  <FormLabel>Property Images</FormLabel>
                  <FormDescription>
                    Add image URLs for your property (at least one image is required)
                  </FormDescription>
                  
                  <div className="flex items-center space-x-2 mb-2">
                    <Input
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      placeholder="Enter image URL"
                    />
                    <Button
                      type="button"
                      onClick={handleAddImage}
                      variant="outline"
                    >
                      Add
                    </Button>
                  </div>
                  
                  {imageUrls.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                      {imageUrls.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`Property image ${index + 1}`}
                            className="h-24 w-full object-cover rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="absolute top-1 right-1 bg-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 border border-dashed rounded-md text-center text-gray-500">
                      No images added yet
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="amenities"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel>Amenities</FormLabel>
                    <FormDescription>
                      Select the amenities available at your property
                    </FormDescription>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {amenitiesList.map((amenity) => (
                      <FormField
                        key={amenity.id}
                        control={form.control}
                        name="amenities"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={amenity.id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(amenity.id)}
                                  onCheckedChange={(checked) => {
                                    const currentValue = field.value || [];
                                    return checked
                                      ? field.onChange([...currentValue, amenity.id])
                                      : field.onChange(
                                          currentValue.filter((value) => value !== amenity.id)
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
                                {amenity.label}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="featured"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Feature this property</FormLabel>
                  <FormDescription>
                    Featured properties appear on the homepage and get more visibility
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="active"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Active listing</FormLabel>
                  <FormDescription>
                    Inactive properties won't appear in search results
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-end space-x-4">
          <Button 
            type="button" 
            variant="outline" 
            disabled={isLoading}
            onClick={() => navigate("/admin/properties")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : isEditMode ? "Update Property" : "Create Property"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default PropertyForm;
