import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import React from 'react';
import type { TripPlan, TripItem, TripComment } from '@shared/schema';

// Hook for fetching user's trip plans
export function useTripPlans() {
  return useQuery({
    queryKey: ['/api/trip-plans'],
    enabled: !!queryClient.getQueryData(['/api/me'])
  });
}

// Hook for fetching shared trip plans
export function useSharedTripPlans() {
  return useQuery({
    queryKey: ['/api/trip-plans/shared'],
    enabled: !!queryClient.getQueryData(['/api/me'])
  });
}

// Hook for fetching a specific trip plan with its items
export function useTripPlan(id: number | undefined) {
  return useQuery({
    queryKey: ['/api/trip-plans', id],
    enabled: !!id && !!queryClient.getQueryData(['/api/me'])
  });
}

// Hook for creating a trip plan
export function useCreateTripPlan() {
  return useMutation({
    mutationFn: (data: Omit<TripPlan, 'id' | 'createdAt' | 'lastModified' | 'inviteCode' | 'ownerId'>) => 
      apiRequest('POST', '/api/trip-plans', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trip-plans'] });
    }
  });
}

// Hook for updating a trip plan
export function useUpdateTripPlan(id: number | undefined) {
  return useMutation({
    mutationFn: (data: Partial<TripPlan>) => 
      apiRequest('PUT', `/api/trip-plans/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trip-plans', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/trip-plans'] });
    }
  });
}

// Hook for deleting a trip plan
export function useDeleteTripPlan() {
  return useMutation({
    mutationFn: (id: number) => 
      apiRequest('DELETE', `/api/trip-plans/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trip-plans'] });
    }
  });
}

// Hook for fetching trip items
export function useTripItems(tripId: number | undefined) {
  return useQuery({
    queryKey: ['/api/trip-plans', tripId, 'items'],
    enabled: !!tripId && !!queryClient.getQueryData(['/api/me'])
  });
}

// Hook for creating a trip item
export function useCreateTripItem(tripId: number | undefined) {
  return useMutation({
    mutationFn: (data: Omit<TripItem, 'id' | 'createdAt' | 'lastModified' | 'createdBy' | 'lastModifiedBy' | 'tripId'>) => 
      apiRequest('POST', `/api/trip-plans/${tripId}/items`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trip-plans', tripId, 'items'] });
      queryClient.invalidateQueries({ queryKey: ['/api/trip-plans', tripId] });
    }
  });
}

// Hook for updating a trip item
export function useUpdateTripItem(tripId: number | undefined) {
  return useMutation({
    mutationFn: ({ id, data }: { id: number, data: Partial<TripItem> }) => 
      apiRequest('PUT', `/api/trip-items/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trip-plans', tripId, 'items'] });
      queryClient.invalidateQueries({ queryKey: ['/api/trip-plans', tripId] });
    }
  });
}

// Hook for deleting a trip item
export function useDeleteTripItem(tripId: number | undefined) {
  return useMutation({
    mutationFn: (id: number) => 
      apiRequest('DELETE', `/api/trip-items/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trip-plans', tripId, 'items'] });
      queryClient.invalidateQueries({ queryKey: ['/api/trip-plans', tripId] });
    }
  });
}

// Hook for fetching trip comments
export function useTripComments(tripId: number | undefined, tripItemId?: number) {
  return useQuery({
    queryKey: ['/api/trip-plans', tripId, 'comments', tripItemId],
    enabled: !!tripId && !!queryClient.getQueryData(['/api/me'])
  });
}

// Hook for creating a trip comment
export function useCreateTripComment(tripId: number | undefined) {
  return useMutation({
    mutationFn: (data: { content: string, tripItemId?: number }) => 
      apiRequest('POST', `/api/trip-plans/${tripId}/comments`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/trip-plans', tripId, 'comments', variables.tripItemId] });
    }
  });
}

// WebSocket connection for real-time updates
export function useTripPlanWebSocket(tripId: number | undefined, userId: number | undefined) {
  const [socket, setSocket] = React.useState<WebSocket | null>(null);
  const [connected, setConnected] = React.useState(false);
  const [events, setEvents] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (!tripId || !userId) return;

    // Create WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connection established');
      setConnected(true);
      
      // Join the trip room
      ws.send(JSON.stringify({
        type: 'JOIN_TRIP',
        tripId,
        userId
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket message received:', data);
        
        setEvents(prev => [...prev, data]);
        
        // Handle different event types
        if (data.type === 'ITEM_ADDED' || data.type === 'ITEM_UPDATED' || data.type === 'ITEM_DELETED') {
          queryClient.invalidateQueries({ queryKey: ['/api/trip-plans', tripId, 'items'] });
          queryClient.invalidateQueries({ queryKey: ['/api/trip-plans', tripId] });
        } else if (data.type === 'COMMENT_ADDED') {
          queryClient.invalidateQueries({ queryKey: ['/api/trip-plans', tripId, 'comments'] });
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
      setConnected(false);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    setSocket(ws);

    // Clean up on unmount
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [tripId, userId]);

  return { socket, connected, events };
}