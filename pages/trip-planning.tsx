import React, { useState, useEffect } from 'react';
import { useRoute, Link } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import {
  useTripPlans,
  useSharedTripPlans,
  useTripPlan,
  useCreateTripPlan,
  useUpdateTripPlan,
  useDeleteTripPlan,
  useTripItems,
  useCreateTripItem,
  useUpdateTripItem,
  useDeleteTripItem,
  useTripComments,
  useCreateTripComment,
  useTripPlanWebSocket
} from '@/hooks/useTripPlans';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { format, formatDistance } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Plus, Trash, Edit, Share, Users, ExternalLink, MessageSquare } from 'lucide-react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { TRIP_ITEM_TYPES } from "@shared/schema";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

// Trip Plan form schema
const tripPlanSchema = z.object({
  name: z.string().min(1, "Trip name is required"),
  destination: z.string().min(1, "Destination is required"),
  description: z.string().nullable().optional(),
  startDate: z.date().nullable().optional(),
  endDate: z.date().nullable().optional(),
  isPublic: z.boolean().default(false)
});

// Trip Item form schema
const tripItemSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.enum(TRIP_ITEM_TYPES as unknown as [string, ...string[]]),
  description: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  startDate: z.date().nullable().optional(),
  endDate: z.date().nullable().optional(),
  notes: z.string().nullable().optional(),
  propertyId: z.number().nullable().optional(),
  restaurantId: z.number().nullable().optional(),
  cost: z.number().nullable().optional(),
  order: z.number().default(0),
  createdBy: z.number().optional(), // Will be set on the server
  lastModifiedBy: z.number().optional(), // Will be set on the server
});

// Comment form schema
const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty"),
  tripItemId: z.number().optional()
});

function TripPlanListCard({ trip, onView }: { trip: any, onView: () => void }) {
  return (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between items-center">
          <span>{trip.name}</span>
          {trip.isPublic && <Badge>Public</Badge>}
        </CardTitle>
        <CardDescription>
          {trip.destination} • {trip.startDate 
            ? `${format(new Date(trip.startDate), 'PP')} - ${format(new Date(trip.endDate || trip.startDate), 'PP')}`
            : 'No dates set'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-sm line-clamp-2">{trip.description || 'No description'}</p>
        <div className="flex items-center mt-2">
          <Users className="h-4 w-4 mr-1" /> 
          <span className="text-xs">{trip.collaborators?.length || 0} collaborators</span>
        </div>
      </CardContent>
      <CardFooter className="pt-2 text-xs text-muted-foreground">
        <div className="flex justify-between w-full">
          <span>Last modified {formatDistance(new Date(trip.lastModified), new Date(), { addSuffix: true })}</span>
          <Button size="sm" variant="outline" onClick={onView}>View</Button>
        </div>
      </CardFooter>
    </Card>
  );
}

function CreateTripPlanDialog({ onCreated }: { onCreated?: () => void }) {
  const { mutate, isPending } = useCreateTripPlan();
  const form = useForm({
    resolver: zodResolver(tripPlanSchema),
    defaultValues: {
      name: "",
      destination: "",
      description: "",
      startDate: null,
      endDate: null,
      isPublic: false
    }
  });

  function onSubmit(values: z.infer<typeof tripPlanSchema>) {
    // Add the collaborators field to satisfy the required schema
    const tripPlanData = {
      ...values,
      collaborators: []
    };
    
    mutate(tripPlanData, {
      onSuccess: () => {
        form.reset();
        onCreated?.();
      }
    });
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Trip Plan
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create a new trip plan</DialogTitle>
          <DialogDescription>
            Start planning your next adventure with friends and family.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trip Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Summer vacation 2025" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="destination"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Destination</FormLabel>
                  <FormControl>
                    <Input placeholder="Ras El Hekma, Egypt" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Brief description of your trip" 
                      {...field} 
                      value={field.value || ""} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date (optional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={`pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                          >
                            {field.value ? (
                              format(field.value, "PP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date (optional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={`pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                          >
                            {field.value ? (
                              format(field.value, "PP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="isPublic"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Make this trip plan public</FormLabel>
                    <FormDescription>
                      Public trip plans can be viewed by anyone with the link
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" type="button">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Creating..." : "Create Trip Plan"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function TripItemCard({ item, onEdit, onDelete }: { item: any, onEdit: () => void, onDelete: () => void }) {
  const typeColors: Record<string, string> = {
    stay: "bg-blue-100 text-blue-800",
    activity: "bg-green-100 text-green-800",
    transportation: "bg-purple-100 text-purple-800",
    meal: "bg-yellow-100 text-yellow-800",
    note: "bg-gray-100 text-gray-800"
  };

  return (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <Badge className={typeColors[item.type] || "bg-gray-100"}>
              {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
            </Badge>
            <CardTitle className="mt-2">{item.title}</CardTitle>
          </div>
          <div className="flex gap-2">
            <Button size="icon" variant="outline" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="outline" className="text-destructive" onClick={onDelete}>
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {item.location && (
          <div className="mb-2 text-sm">
            <strong>Location:</strong> {item.location}
          </div>
        )}
        {(item.startDate || item.endDate) && (
          <div className="mb-2 text-sm">
            <strong>Date:</strong> {item.startDate 
              ? format(new Date(item.startDate), 'PP') 
              : 'Not specified'}
            {item.endDate && item.endDate !== item.startDate 
              ? ` - ${format(new Date(item.endDate), 'PP')}` 
              : ''}
          </div>
        )}
        {item.description && (
          <div className="mb-2 text-sm">
            <strong>Description:</strong> {item.description}
          </div>
        )}
        {item.notes && (
          <div className="mt-2 p-2 bg-muted rounded-md text-sm">
            <strong>Notes:</strong> {item.notes}
          </div>
        )}
        {item.cost !== null && item.cost !== undefined && (
          <div className="mt-2 text-sm">
            <strong>Cost:</strong> ${item.cost}
          </div>
        )}
        {item.propertyId && (
          <div className="mt-2 text-sm">
            <strong>Property ID:</strong> {item.propertyId}
          </div>
        )}
        {item.restaurantId && (
          <div className="mt-2 text-sm">
            <strong>Restaurant ID:</strong> {item.restaurantId}
          </div>
        )}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground pt-0">
        <div className="flex justify-between w-full">
          <span>Last modified by user #{item.lastModifiedBy || item.createdBy}</span>
          <span>Order: {item.order || 0}</span>
        </div>
      </CardFooter>
    </Card>
  );
}

function AddTripItemDialog({ tripId, onAdded }: { tripId: number, onAdded?: () => void }) {
  const { mutate, isPending } = useCreateTripItem(tripId);
  const form = useForm({
    resolver: zodResolver(tripItemSchema),
    defaultValues: {
      title: "",
      type: "activity",
      description: "",
      location: "",
      startDate: null,
      endDate: null,
      notes: "",
      propertyId: null,
      restaurantId: null,
      cost: null,
      order: 0,
      createdBy: undefined,
      lastModifiedBy: undefined
    }
  });

  function onSubmit(values: z.infer<typeof tripItemSchema>) {
    mutate(
      values,
      {
        onSuccess: () => {
          form.reset();
          onAdded?.();
        }
      }
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add trip item</DialogTitle>
          <DialogDescription>
            Add activities, accommodations, transportation, meals or notes to your trip plan.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Item title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="stay">Accommodation</SelectItem>
                      <SelectItem value="activity">Activity</SelectItem>
                      <SelectItem value="transportation">Transportation</SelectItem>
                      <SelectItem value="meal">Meal</SelectItem>
                      <SelectItem value="note">Note</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Item location" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date (optional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={`pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                          >
                            {field.value ? (
                              format(field.value, "PP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date (optional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={`pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                          >
                            {field.value ? (
                              format(field.value, "PP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Details about this item" 
                      {...field} 
                      value={field.value || ""} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Additional notes" 
                      {...field} 
                      value={field.value || ""} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cost (optional)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Cost amount" 
                      {...field} 
                      value={field.value === null ? "" : field.value} 
                      onChange={(e) => field.onChange(e.target.value === "" ? null : parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Order (for sorting)" 
                      {...field} 
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    Order determines the sorting position of this item in the trip plan
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" type="button">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Adding..." : "Add Item"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function EditTripItemDialog({ item, tripId, onUpdated }: { item: any, tripId: number, onUpdated?: () => void }) {
  const { mutate, isPending } = useUpdateTripItem(tripId);
  const form = useForm({
    resolver: zodResolver(tripItemSchema),
    defaultValues: {
      title: item.title,
      type: item.type,
      description: item.description || "",
      location: item.location || "",
      startDate: item.startDate ? new Date(item.startDate) : null,
      endDate: item.endDate ? new Date(item.endDate) : null,
      notes: item.notes || "",
      propertyId: item.propertyId || null,
      restaurantId: item.restaurantId || null,
      cost: item.cost || null,
      order: item.order || 0,
      createdBy: item.createdBy,
      lastModifiedBy: item.lastModifiedBy
    }
  });

  function onSubmit(values: z.infer<typeof tripItemSchema>) {
    mutate(
      { 
        id: item.id, 
        data: values
      },
      {
        onSuccess: () => {
          onUpdated?.();
        }
      }
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit trip item</DialogTitle>
          <DialogDescription>
            Update the details of this trip item.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Item title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="stay">Accommodation</SelectItem>
                      <SelectItem value="activity">Activity</SelectItem>
                      <SelectItem value="transportation">Transportation</SelectItem>
                      <SelectItem value="meal">Meal</SelectItem>
                      <SelectItem value="note">Note</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Item location" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date (optional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={`pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                          >
                            {field.value ? (
                              format(field.value, "PP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date (optional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={`pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                          >
                            {field.value ? (
                              format(field.value, "PP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Details about this item" 
                      {...field} 
                      value={field.value || ""} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Additional notes" 
                      {...field} 
                      value={field.value || ""} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cost (optional)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Cost amount" 
                      {...field} 
                      value={field.value === null ? "" : field.value} 
                      onChange={(e) => field.onChange(e.target.value === "" ? null : parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Order (for sorting)" 
                      {...field} 
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    Order determines the sorting position of this item in the trip plan
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" type="button">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Updating..." : "Update Item"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function CommentsSection({ tripId, itemId }: { tripId: number, itemId?: number }) {
  const { data: comments, isLoading } = useTripComments(tripId, itemId);
  const { mutate, isPending } = useCreateTripComment(tripId);
  const { toast } = useToast();
  const [content, setContent] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    mutate({ 
      content, 
      tripItemId: itemId 
    }, {
      onSuccess: () => {
        setContent("");
        toast({
          title: "Comment added",
          description: "Your comment has been added successfully.",
        });
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: "Failed to add comment. Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  if (isLoading) {
    return <LoadingSkeleton type="comments" />;
  }

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <MessageSquare className="h-5 w-5 mr-2" />
        Comments {comments && `(${comments.length})`}
      </h3>
      
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-2">
          <Textarea 
            placeholder="Add a comment..." 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="resize-none"
          />
          <Button type="submit" disabled={isPending || !content.trim()}>
            {isPending ? "Posting..." : "Post"}
          </Button>
        </div>
      </form>
      
      <div className="space-y-4">
        {comments && comments.length > 0 ? (
          comments.map((comment: any) => (
            <div key={comment.id} className="p-4 border rounded-lg">
              <div className="flex items-center mb-2">
                <Avatar className="h-8 w-8 mr-2">
                  <AvatarFallback>
                    {comment.userId.toString().substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">User #{comment.userId}</div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(comment.createdAt), 'PP p')}
                  </div>
                </div>
              </div>
              <p className="text-sm">{comment.content}</p>
            </div>
          ))
        ) : (
          <p className="text-center text-muted-foreground">No comments yet</p>
        )}
      </div>
    </div>
  );
}

function ShareTripPlanDialog({ tripPlan }: { tripPlan: any }) {
  const { toast } = useToast();
  const inviteUrl = `${window.location.origin}/trip-planning/invite/${tripPlan.inviteCode}`;
  
  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    toast({
      title: "Copied to clipboard",
      description: "The invite link has been copied to your clipboard.",
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Share className="h-4 w-4 mr-2" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Share this trip plan</DialogTitle>
          <DialogDescription>
            Share this trip plan with friends and family to collaborate together.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <h4 className="font-medium mb-2">Invite link</h4>
          <div className="flex gap-2">
            <Input 
              value={inviteUrl} 
              readOnly 
              className="flex-1"
            />
            <Button onClick={copyInviteLink}>
              Copy
            </Button>
          </div>
          
          <div className="mt-6">
            <h4 className="font-medium mb-2">Visibility</h4>
            <div className="text-sm">
              This trip plan is currently <Badge>{tripPlan.isPublic ? 'Public' : 'Private'}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {tripPlan.isPublic 
                ? "Anyone with the link can view this trip plan."
                : "Only people you explicitly invite can see this trip plan."}
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TripPlanDetail() {
  const [, params] = useRoute<{ id: string }>('/trip-planning/:id');
  const tripId = params?.id ? parseInt(params.id) : undefined;
  const { user } = useAuth();
  const { data, isLoading, error } = useTripPlan(tripId);
  const { data: tripItems, isLoading: isLoadingItems } = useTripItems(tripId);
  const { mutate: deleteTripItem } = useDeleteTripItem(tripId);
  const { toast } = useToast();
  
  const [selectedItemId, setSelectedItemId] = useState<number | undefined>(undefined);

  // Set up WebSocket connection for real-time updates
  const { connected: wsConnected, events: wsEvents } = useTripPlanWebSocket(
    tripId,
    user?.id
  );

  const handleDeleteItem = (itemId: number) => {
    if (confirm("Are you sure you want to delete this item?")) {
      deleteTripItem(itemId, {
        onSuccess: () => {
          toast({
            title: "Item deleted",
            description: "The trip item has been deleted successfully.",
          });
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to delete the trip item. Please try again.",
            variant: "destructive",
          });
        }
      });
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <LoadingSkeleton type="trip-detail" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <Card className="p-6">
          <CardTitle className="mb-4">Error Loading Trip Plan</CardTitle>
          <p>We couldn't load the trip plan. Please try again or go back to your trip plans.</p>
          <div className="mt-4">
            <Link to="/trip-planning">
              <Button>Back to Trip Plans</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const { tripPlan } = data;
  const isOwner = user?.id === tripPlan.ownerId;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{tripPlan.name}</h1>
          <p className="text-muted-foreground">{tripPlan.destination}</p>
        </div>
        <div className="flex gap-2">
          <Link to="/trip-planning">
            <Button variant="outline">Back to Trip Plans</Button>
          </Link>
          <ShareTripPlanDialog tripPlan={tripPlan} />
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Trip Details</h3>
              <div className="space-y-2">
                <div>
                  <span className="font-medium">Destination:</span> {tripPlan.destination}
                </div>
                {tripPlan.startDate && (
                  <div>
                    <span className="font-medium">Dates:</span> {format(new Date(tripPlan.startDate), 'PP')}
                    {tripPlan.endDate && tripPlan.endDate !== tripPlan.startDate && 
                      ` - ${format(new Date(tripPlan.endDate), 'PP')}`}
                  </div>
                )}
                <div>
                  <span className="font-medium">Description:</span> {tripPlan.description || 'No description'}
                </div>
                <div>
                  <span className="font-medium">Visibility:</span> {tripPlan.isPublic ? 'Public' : 'Private'}
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Collaboration</h3>
              <div>
                <span className="font-medium">Owner:</span> User #{tripPlan.ownerId} 
                {isOwner && ' (you)'}
              </div>
              <div className="mt-2">
                <span className="font-medium">Collaborators:</span> {
                  tripPlan.collaborators?.length 
                    ? `${tripPlan.collaborators.length} collaborators` 
                    : 'No collaborators yet'
                }
              </div>
              <div className="mt-2">
                <span className="font-medium">Real-time status:</span>{' '}
                {wsConnected ? (
                  <Badge variant="outline" className="bg-green-100 text-green-800">Connected</Badge>
                ) : (
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Connecting...</Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold">Trip Items</h2>
        <AddTripItemDialog tripId={tripPlan.id} />
      </div>

      <Tabs defaultValue="all">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Items</TabsTrigger>
          <TabsTrigger value="stay">Accommodations</TabsTrigger>
          <TabsTrigger value="activity">Activities</TabsTrigger>
          <TabsTrigger value="transportation">Transportation</TabsTrigger>
          <TabsTrigger value="meal">Meals</TabsTrigger>
          <TabsTrigger value="note">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {isLoadingItems ? (
            <LoadingSkeleton type="trip-items" />
          ) : tripItems && tripItems.length > 0 ? (
            tripItems.map((item: any) => (
              <div key={item.id} className="group">
                <TripItemCard
                  item={item}
                  onEdit={() => setSelectedItemId(item.id)}
                  onDelete={() => handleDeleteItem(item.id)}
                />
                {selectedItemId === item.id && (
                  <EditTripItemDialog 
                    item={item} 
                    tripId={tripPlan.id} 
                    onUpdated={() => setSelectedItemId(undefined)} 
                  />
                )}
                <div className="mt-2 mb-6">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setSelectedItemId(item.id === selectedItemId ? undefined : item.id)}
                  >
                    <MessageSquare className="h-3 w-3 mr-1" />
                    View Comments
                  </Button>
                  
                  {selectedItemId === item.id && (
                    <div className="mt-2 border-t pt-4">
                      <CommentsSection tripId={tripPlan.id} itemId={item.id} />
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center p-12 border rounded-lg">
              <p className="text-muted-foreground mb-4">No items added to this trip yet</p>
              <AddTripItemDialog tripId={tripPlan.id} />
            </div>
          )}
        </TabsContent>

        {TRIP_ITEM_TYPES.map((type) => (
          <TabsContent key={type} value={type} className="space-y-4">
            {isLoadingItems ? (
              <LoadingSkeleton type="trip-items" />
            ) : tripItems && tripItems.filter((item: any) => item.type === type).length > 0 ? (
              tripItems
                .filter((item: any) => item.type === type)
                .map((item: any) => (
                  <div key={item.id} className="group">
                    <TripItemCard
                      item={item}
                      onEdit={() => setSelectedItemId(item.id)}
                      onDelete={() => handleDeleteItem(item.id)}
                    />
                    {selectedItemId === item.id && (
                      <EditTripItemDialog 
                        item={item} 
                        tripId={tripPlan.id} 
                        onUpdated={() => setSelectedItemId(undefined)} 
                      />
                    )}
                    <div className="mt-2 mb-6">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setSelectedItemId(item.id === selectedItemId ? undefined : item.id)}
                      >
                        <MessageSquare className="h-3 w-3 mr-1" />
                        View Comments
                      </Button>
                      
                      {selectedItemId === item.id && (
                        <div className="mt-2 border-t pt-4">
                          <CommentsSection tripId={tripPlan.id} itemId={item.id} />
                        </div>
                      )}
                    </div>
                  </div>
                ))
            ) : (
              <div className="text-center p-12 border rounded-lg">
                <p className="text-muted-foreground mb-4">No {type} items added to this trip yet</p>
                <AddTripItemDialog tripId={tripPlan.id} />
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <div className="mt-10">
        <h2 className="text-2xl font-bold mb-6">General Discussion</h2>
        <Card>
          <CardContent className="pt-6">
            <CommentsSection tripId={tripPlan.id} />
          </CardContent>
        </Card>
      </div>

      {wsEvents.length > 0 && (
        <div className="mt-10">
          <h3 className="text-lg font-semibold mb-4">Real-time Updates</h3>
          <div className="border rounded-lg p-4 max-h-40 overflow-y-auto">
            {wsEvents.map((event, index) => (
              <div key={index} className="text-sm py-1 border-b last:border-0">
                <span className="text-xs text-muted-foreground">
                  {format(new Date(event.timestamp), 'HH:mm:ss')}:
                </span>{' '}
                {event.type === 'ITEM_ADDED' && (
                  <span><strong>User #{event.userId}</strong> added a new item <strong>"{event.data.title}"</strong></span>
                )}
                {event.type === 'ITEM_UPDATED' && (
                  <span><strong>User #{event.userId}</strong> updated item <strong>"{event.data.title}"</strong></span>
                )}
                {event.type === 'ITEM_DELETED' && (
                  <span><strong>User #{event.userId}</strong> deleted an item</span>
                )}
                {event.type === 'COMMENT_ADDED' && (
                  <span><strong>User #{event.userId}</strong> added a new comment</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function InviteHandler() {
  const [, params] = useRoute<{ code: string }>('/trip-planning/invite/:code');
  const inviteCode = params?.code;
  const { user, isLoading: isUserLoading } = useAuth();
  const { toast } = useToast();
  const [tripPlanData, setTripPlanData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!inviteCode) return;
    
    // Fetch the trip plan by invite code
    apiRequest('GET', `/api/trip-plans/invite/${inviteCode}`)
      .then(res => res.json())
      .then(data => {
        setTripPlanData(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error fetching trip plan:', err);
        setError('Failed to load trip plan. The invite link may be invalid.');
        setIsLoading(false);
      });
  }, [inviteCode]);
  
  if (isLoading || isUserLoading) {
    return (
      <div className="max-w-md mx-auto p-6 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <p>Loading trip plan...</p>
      </div>
    );
  }
  
  if (error || !tripPlanData) {
    return (
      <div className="max-w-md mx-auto p-6">
        <Card className="p-6 text-center">
          <CardTitle className="mb-4">Invalid Invite Link</CardTitle>
          <p className="mb-4">{error || "The trip plan invite link is invalid or has expired."}</p>
          <Link to="/trip-planning">
            <Button>Go to Trip Planning</Button>
          </Link>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="max-w-md mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>You've been invited to a trip plan!</CardTitle>
          <CardDescription>
            You've been invited to collaborate on a trip to {tripPlanData.destination}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">Trip: {tripPlanData.name}</h3>
              <p className="text-sm text-muted-foreground">
                {tripPlanData.description || "No description provided"}
              </p>
            </div>
            
            {tripPlanData.startDate && (
              <div>
                <span className="font-medium">Dates:</span>{' '}
                {format(new Date(tripPlanData.startDate), 'PP')}
                {tripPlanData.endDate && tripPlanData.endDate !== tripPlanData.startDate && 
                  ` - ${format(new Date(tripPlanData.endDate), 'PP')}`}
              </div>
            )}
            
            <div>
              <Badge>{tripPlanData.isPublic ? 'Public Trip' : 'Private Trip'}</Badge>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Link to="/trip-planning">
            <Button variant="outline">Go to Trip Plans</Button>
          </Link>
          <Link to={`/trip-planning/${tripPlanData.id}`}>
            <Button>
              <ExternalLink className="h-4 w-4 mr-2" />
              View Trip Plan
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function TripPlanning() {
  const [, params] = useRoute('/trip-planning/:id');
  const [, inviteParams] = useRoute('/trip-planning/invite/:code');
  
  const { user, isLoading: isUserLoading } = useAuth();
  const { data: myTripPlans, isLoading: isMyTripsLoading } = useTripPlans();
  const { data: sharedTripPlans, isLoading: isSharedTripsLoading } = useSharedTripPlans();
  
  // If we're viewing a specific trip plan or handling an invite
  if (params?.id) {
    return <TripPlanDetail />;
  }
  
  if (inviteParams?.code) {
    return <InviteHandler />;
  }
  
  // Main listing page
  if (isUserLoading || isMyTripsLoading || isSharedTripsLoading) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <LoadingSkeleton type="trip-list" />
      </div>
    );
  }
  
  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Trip Planning</h1>
        <CreateTripPlanDialog />
      </div>
      
      <Tabs defaultValue="my-trips">
        <TabsList className="mb-6">
          <TabsTrigger value="my-trips">My Trip Plans</TabsTrigger>
          <TabsTrigger value="shared">Shared with Me</TabsTrigger>
          <TabsTrigger value="about">About Collaborative Planning</TabsTrigger>
        </TabsList>
        
        <TabsContent value="my-trips">
          {myTripPlans && myTripPlans.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myTripPlans.map((trip: any) => (
                <TripPlanListCard 
                  key={trip.id} 
                  trip={trip} 
                  onView={() => window.location.href = `/trip-planning/${trip.id}`} 
                />
              ))}
            </div>
          ) : (
            <div className="text-center p-12 border rounded-lg">
              <h3 className="text-lg font-semibold mb-2">No Trip Plans Created Yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first trip plan to start organizing your next adventure with friends and family.
              </p>
              <CreateTripPlanDialog />
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="shared">
          {sharedTripPlans && sharedTripPlans.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sharedTripPlans.map((trip: any) => (
                <TripPlanListCard 
                  key={trip.id} 
                  trip={trip} 
                  onView={() => window.location.href = `/trip-planning/${trip.id}`} 
                />
              ))}
            </div>
          ) : (
            <div className="text-center p-12 border rounded-lg">
              <h3 className="text-lg font-semibold mb-2">No Shared Trip Plans</h3>
              <p className="text-muted-foreground">
                You don't have any trip plans shared with you yet. Ask friends to invite you to their trip plans.
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="about">
          <Card>
            <CardHeader>
              <CardTitle>Real-time Collaborative Trip Planning</CardTitle>
              <CardDescription>
                Plan your trips together with friends and family in real-time.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">How it works:</h3>
                  <ul className="list-disc pl-5 space-y-2 mt-2">
                    <li>Create a trip plan with your destination and dates</li>
                    <li>Share the invite link with friends and family</li>
                    <li>Collaborate in real-time to add activities, accommodations, and more</li>
                    <li>Comment on trip items to discuss details</li>
                    <li>See updates as they happen with WebSocket real-time technology</li>
                  </ul>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-lg font-semibold">Trip Item Types:</h3>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="flex items-center">
                      <Badge className="bg-blue-100 text-blue-800 mr-2">Stays</Badge>
                      <span className="text-sm">Hotels, resorts, Airbnbs, etc.</span>
                    </div>
                    <div className="flex items-center">
                      <Badge className="bg-green-100 text-green-800 mr-2">Activities</Badge>
                      <span className="text-sm">Tours, attractions, experiences</span>
                    </div>
                    <div className="flex items-center">
                      <Badge className="bg-purple-100 text-purple-800 mr-2">Transportation</Badge>
                      <span className="text-sm">Flights, car rentals, transfers</span>
                    </div>
                    <div className="flex items-center">
                      <Badge className="bg-yellow-100 text-yellow-800 mr-2">Meals</Badge>
                      <span className="text-sm">Restaurant reservations, picnics</span>
                    </div>
                    <div className="flex items-center">
                      <Badge className="bg-gray-100 text-gray-800 mr-2">Notes</Badge>
                      <span className="text-sm">General notes, reminders, ideas</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Trip Plan
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}