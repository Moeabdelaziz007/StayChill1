import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useBookings, Booking } from "@/hooks/useBookings";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
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
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AdminBookings = () => {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const { updateBookingStatus } = useBookings();
  
  useEffect(() => {
    // Check if user is super admin
    if (!user) {
      setIsLoading(false);
      return;
    }
    
    if (user.role !== "superadmin" && user.role !== "super_admin") {
      navigate("/");
      return;
    }
    
    // Fetch all bookings
    const fetchBookings = async () => {
      try {
        const response = await fetch('/api/admin/bookings', {
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch bookings');
        }
        
        const data = await response.json();
        setBookings(data);
        setFilteredBookings(data);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBookings();
  }, [user, navigate]);
  
  // Filter bookings based on search and status
  useEffect(() => {
    let filtered = [...bookings];
    
    if (searchQuery) {
      filtered = filtered.filter(booking => 
        booking.property?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.id.toString().includes(searchQuery)
      );
    }
    
    if (statusFilter) {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }
    
    setFilteredBookings(filtered);
  }, [bookings, searchQuery, statusFilter]);
  
  const handleUpdateStatus = async (bookingId: number, newStatus: string) => {
    try {
      await updateBookingStatus({ id: bookingId, status: newStatus });
      
      // Update local state
      setBookings(bookings.map(booking => 
        booking.id === bookingId ? { ...booking, status: newStatus } : booking
      ));
    } catch (error) {
      console.error('Error updating booking status:', error);
    }
  };
  
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-500">Confirmed</Badge>;
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      case "completed":
        return <Badge className="bg-blue-500">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  if (!user || (user.role !== "superadmin" && user.role !== "super_admin")) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p>You don't have permission to access this page.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Booking Management</h1>
        <p className="text-muted-foreground">
          Manage all bookings across properties
        </p>
      </div>
      
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Input
            placeholder="Search by property or booking ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-bookings">All bookings</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Bookings Table */}
      <Card>
        <CardHeader className="px-6 py-4">
          <CardTitle className="text-xl">Bookings</CardTitle>
          <CardDescription>
            {filteredBookings.length} {filteredBookings.length === 1 ? 'booking' : 'bookings'} found
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin w-8 h-8 border-4 border-brand border-t-transparent rounded-full"></div>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground mb-4">No bookings found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Guest</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>#{booking.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-md overflow-hidden">
                            <img
                              src={booking.property?.images[0] || "https://placehold.co/100x100?text=No+Image"}
                              alt={booking.property?.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-medium">{booking.property?.title || "Unknown Property"}</p>
                            <p className="text-xs text-muted-foreground">{booking.property?.location || ""}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>User #{booking.userId}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{format(new Date(booking.startDate), "MMM d")} - {format(new Date(booking.endDate), "MMM d, yyyy")}</p>
                          <p className="text-xs text-muted-foreground">{booking.guestCount} guests</p>
                        </div>
                      </TableCell>
                      <TableCell>${booking.totalPrice}</TableCell>
                      <TableCell>{renderStatusBadge(booking.status)}</TableCell>
                      <TableCell className="text-right">
                        <Select 
                          defaultValue={booking.status}
                          onValueChange={(value) => handleUpdateStatus(booking.id, value)}
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue placeholder="Change status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="confirmed">Confirm</SelectItem>
                            <SelectItem value="completed">Complete</SelectItem>
                            <SelectItem value="cancelled">Cancel</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBookings;