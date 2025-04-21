import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useProperties, Property } from "@/hooks/useProperties";
import { useAuth } from "@/hooks/useAuth";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AdminProperties = () => {
  const { user } = useAuth();
  const { getProperties, getFeaturedProperties, updateProperty, deleteProperty } = useProperties();
  const [, navigate] = useLocation();
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const isSuperAdmin = user?.role === "superadmin" || user?.role === "super_admin";
  
  useEffect(() => {
    const loadProperties = async () => {
      setIsLoading(true);
      try {
        let propertiesData;
        
        if (isSuperAdmin) {
          // Super admin can see all properties
          propertiesData = await getProperties();
        } else {
          // Property admin can only see their own properties
          propertiesData = await getProperties({ userId: user?.id });
        }
        
        setProperties(propertiesData);
        setFilteredProperties(propertiesData);
      } catch (error) {
        console.error("Error loading properties:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user) {
      loadProperties();
    }
  }, [user, isSuperAdmin, getProperties]);
  
  // Filter properties based on search, location and status
  useEffect(() => {
    let filtered = [...properties];
    
    if (searchQuery) {
      filtered = filtered.filter(property => 
        property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (locationFilter) {
      filtered = filtered.filter(property => property.location === locationFilter);
    }
    
    if (statusFilter) {
      if (statusFilter === "active") {
        filtered = filtered.filter(property => property.active);
      } else if (statusFilter === "inactive") {
        filtered = filtered.filter(property => !property.active);
      } else if (statusFilter === "featured") {
        filtered = filtered.filter(property => property.featured);
      }
    }
    
    setFilteredProperties(filtered);
  }, [properties, searchQuery, locationFilter, statusFilter]);
  
  const handleToggleFeatured = async (property: Property) => {
    try {
      await updateProperty(property.id, {
        featured: !property.featured
      });
      
      // Update local state
      setProperties(properties.map(p => 
        p.id === property.id ? { ...p, featured: !p.featured } : p
      ));
    } catch (error) {
      console.error("Error toggling featured status:", error);
    }
  };
  
  const handleToggleActive = async (property: Property) => {
    try {
      await updateProperty(property.id, {
        active: !property.active
      });
      
      // Update local state
      setProperties(properties.map(p => 
        p.id === property.id ? { ...p, active: !p.active } : p
      ));
    } catch (error) {
      console.error("Error toggling active status:", error);
    }
  };
  
  const openDeleteDialog = (property: Property) => {
    setPropertyToDelete(property);
    setDeleteDialogOpen(true);
  };
  
  const handleDeleteProperty = async () => {
    if (!propertyToDelete) return;
    
    setIsDeleting(true);
    
    try {
      await deleteProperty(propertyToDelete.id);
      
      // Update local state
      setProperties(properties.filter(p => p.id !== propertyToDelete.id));
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting property:", error);
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Get unique locations for filter
  const locations = [...new Set(properties.map(p => p.location))];
  
  if (!user || (user.role !== "propertyadmin" && user.role !== "property_admin" && user.role !== "superadmin" && user.role !== "super_admin")) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p>You don't have permission to access this page.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Property Management</h1>
          <p className="text-muted-foreground">
            {isSuperAdmin ? "Manage all properties" : "Manage your properties"}
          </p>
        </div>
        <Link href="/admin/properties/new">
          <Button>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Property
          </Button>
        </Link>
      </div>
      
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Input
            placeholder="Search properties..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div>
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-locations">All locations</SelectItem>
              {locations.map(location => (
                <SelectItem key={location} value={location}>{location}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-statuses">All properties</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="featured">Featured</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Properties Table */}
      <Card>
        <CardHeader className="px-6 py-4">
          <CardTitle className="text-xl">Properties</CardTitle>
          <CardDescription>
            {filteredProperties.length} {filteredProperties.length === 1 ? 'property' : 'properties'} found
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin w-8 h-8 border-4 border-brand border-t-transparent rounded-full"></div>
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground mb-4">No properties found</p>
              <Link href="/admin/properties/new">
                <Button>Add New Property</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Featured</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProperties.map((property) => (
                    <TableRow key={property.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-md overflow-hidden">
                            <img
                              src={property.images[0] || "https://placehold.co/100x100?text=No+Image"}
                              alt={property.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-medium">{property.title}</p>
                            <p className="text-xs text-muted-foreground">{property.beds} beds • {property.baths} baths</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{property.location}</TableCell>
                      <TableCell>${property.price}/night</TableCell>
                      <TableCell>
                        {property.rating ? (
                          <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-yellow-500 mr-1">
                              <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                            </svg>
                            {property.rating.toFixed(1)}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">No ratings</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={property.featured}
                          onCheckedChange={() => handleToggleFeatured(property)}
                          disabled={!property.active}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={property.active}
                            onCheckedChange={() => handleToggleActive(property)}
                          />
                          <Badge variant={property.active ? "default" : "outline"}>
                            {property.active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/property/${property.id}`} target="_blank">
                            <Button variant="ghost" size="sm">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </Button>
                          </Link>
                          <Link href={`/admin/properties/edit/${property.id}`}>
                            <Button variant="ghost" size="sm">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </Button>
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => openDeleteDialog(property)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Property</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this property? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {propertyToDelete && (
            <div className="py-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-md overflow-hidden">
                  <img 
                    src={propertyToDelete.images[0] || "https://placehold.co/100x100?text=No+Image"} 
                    alt={propertyToDelete.title} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="font-medium">{propertyToDelete.title}</p>
                  <p className="text-sm text-muted-foreground">{propertyToDelete.location}</p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteProperty}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Property"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProperties;
