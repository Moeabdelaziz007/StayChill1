import { 
  users, properties, bookings, reviews, rewardTransactions, analytics,
  restaurants, restaurantReservations, restaurantReviews,
  tripPlans, tripItems, tripComments,
  chatConversations, chatMessages, chatParticipants,
  notifications, fcmTokens
} from "@shared/schema";
import type { 
  User, InsertUser, 
  Property, InsertProperty, 
  Booking, InsertBooking, 
  Review, InsertReview,
  RewardTransaction, InsertRewardTransaction,
  Analytics, InsertAnalytics,
  Restaurant, InsertRestaurant,
  RestaurantReservation, InsertRestaurantReservation,
  RestaurantReview, InsertRestaurantReview,
  TripPlan, InsertTripPlan,
  TripItem, InsertTripItem,
  TripComment, InsertTripComment,
  ChatConversation, InsertChatConversation,
  ChatMessage, InsertChatMessage,
  ChatParticipant, InsertChatParticipant,
  ChatType,
  Notification, InsertNotification,
  FcmToken, InsertFcmToken
} from "@shared/schema";

// Export all the types needed by the Firestore implementation
export type {
  User, InsertUser, 
  Property, InsertProperty, 
  Booking, InsertBooking, 
  Review, InsertReview,
  RewardTransaction, InsertRewardTransaction,
  Analytics, InsertAnalytics,
  Restaurant, InsertRestaurant,
  RestaurantReservation, InsertRestaurantReservation,
  RestaurantReview, InsertRestaurantReview,
  TripPlan, InsertTripPlan,
  TripItem, InsertTripItem,
  TripComment, InsertTripComment,
  ChatConversation, InsertChatConversation,
  ChatMessage, InsertChatMessage,
  ChatParticipant, InsertChatParticipant,
  ChatType,
  Notification, InsertNotification,
  FcmToken, InsertFcmToken
};

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  updateUserStripeInfo(id: number, info: { customerId: string, subscriptionId?: string }): Promise<User | undefined>;
  updateStripeCustomerId(id: number, customerId: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;
  
  // Chat methods
  getConversation(id: number): Promise<ChatConversation | undefined>;
  getUserConversations(userId: number): Promise<ChatConversation[]>;
  getPropertyConversations(propertyId: number): Promise<ChatConversation[]>;
  getBookingConversations(bookingId: number): Promise<ChatConversation[]>;
  createConversation(conversation: InsertChatConversation): Promise<ChatConversation>;
  updateConversation(id: number, data: Partial<ChatConversation>): Promise<ChatConversation | undefined>;
  
  getConversationMessages(conversationId: number, limit?: number, offset?: number): Promise<ChatMessage[]>;
  createMessage(message: InsertChatMessage): Promise<ChatMessage>;
  markMessagesAsRead(conversationId: number, userId: number): Promise<boolean>;
  
  getConversationParticipants(conversationId: number): Promise<ChatParticipant[]>;
  addParticipantToConversation(participant: InsertChatParticipant): Promise<ChatParticipant>;
  removeParticipantFromConversation(participantId: number): Promise<boolean>;

  // Property methods
  getProperty(id: number): Promise<Property | undefined>;
  getProperties(limit?: number, offset?: number): Promise<Property[]>;
  getUserProperties(userId: number): Promise<Property[]>;
  getPropertiesByLocation(location: string): Promise<Property[]>;
  getFeaturedProperties(limit?: number): Promise<Property[]>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateProperty(id: number, propertyData: Partial<Property>): Promise<Property | undefined>;
  deleteProperty(id: number): Promise<boolean>;

  // Booking methods
  getBooking(id: number): Promise<Booking | undefined>;
  getUserBookings(userId: number): Promise<Booking[]>;
  getPropertyBookings(propertyId: number): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: number, bookingData: Partial<Booking>): Promise<Booking | undefined>;

  // Review methods
  getPropertyReviews(propertyId: number): Promise<Review[]>;
  getUserReviews(userId: number): Promise<Review[]>;
  getAllReviews(limit?: number): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;

  // Reward methods
  getUserRewards(userId: number): Promise<RewardTransaction[]>;
  createRewardTransaction(transaction: InsertRewardTransaction): Promise<RewardTransaction>;

  // Admin analytics
  getAnalytics(startDate: Date, endDate: Date): Promise<Analytics[]>;
  createOrUpdateAnalytics(analytics: InsertAnalytics): Promise<Analytics>;

  // Restaurant methods
  getRestaurant(id: number): Promise<Restaurant | undefined>;
  getRestaurants(limit?: number, offset?: number): Promise<Restaurant[]>;
  getRestaurantsByLocation(location: string): Promise<Restaurant[]>;
  getFeaturedRestaurants(limit?: number): Promise<Restaurant[]>;
  createRestaurant(restaurant: InsertRestaurant): Promise<Restaurant>;
  updateRestaurant(id: number, restaurantData: Partial<Restaurant>): Promise<Restaurant | undefined>;
  deleteRestaurant(id: number): Promise<boolean>;

  // Restaurant reservation methods
  getRestaurantReservation(id: number): Promise<RestaurantReservation | undefined>;
  getUserRestaurantReservations(userId: number): Promise<RestaurantReservation[]>;
  getRestaurantReservations(restaurantId: number): Promise<RestaurantReservation[]>;
  createRestaurantReservation(reservation: InsertRestaurantReservation): Promise<RestaurantReservation>;
  updateRestaurantReservation(id: number, reservationData: Partial<RestaurantReservation>): Promise<RestaurantReservation | undefined>;
  cancelRestaurantReservation(id: number): Promise<boolean>;

  // Restaurant review methods
  getRestaurantReviews(restaurantId: number): Promise<RestaurantReview[]>;
  createRestaurantReview(review: InsertRestaurantReview): Promise<RestaurantReview>;
  getUserRestaurantReviews(userId: number): Promise<RestaurantReview[]>;

  // Trip planning methods
  getTripPlan(id: number): Promise<TripPlan | undefined>;
  getUserTripPlans(userId: number): Promise<TripPlan[]>;
  getSharedTripPlans(userId: number): Promise<TripPlan[]>;
  getTripPlanByInviteCode(inviteCode: string): Promise<TripPlan | undefined>;
  createTripPlan(tripPlan: InsertTripPlan): Promise<TripPlan>;
  updateTripPlan(id: number, tripPlanData: Partial<TripPlan>): Promise<TripPlan | undefined>;
  deleteTripPlan(id: number): Promise<boolean>;

  // Trip items methods
  getTripItems(tripId: number): Promise<TripItem[]>;
  getTripItem(id: number): Promise<TripItem | undefined>;
  createTripItem(tripItem: InsertTripItem): Promise<TripItem>;
  updateTripItem(id: number, tripItemData: Partial<TripItem>): Promise<TripItem | undefined>;
  deleteTripItem(id: number): Promise<boolean>;

  // Trip comments methods
  getTripComments(tripId: number, tripItemId?: number): Promise<TripComment[]>;
  createTripComment(tripComment: InsertTripComment): Promise<TripComment>;
  
  // Notification methods
  getUserNotifications(userId: number): Promise<Notification[]>; 
  getNotification(id: number): Promise<Notification | undefined>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<boolean>;
  markAllNotificationsAsRead(userId: number): Promise<boolean>;
  deleteNotification(id: number): Promise<boolean>;
  
  // FCM Token methods
  getUserFcmTokens(userId: number): Promise<FcmToken[]>;
  saveFcmToken(token: InsertFcmToken): Promise<FcmToken>;
  deleteFcmToken(token: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private properties: Map<number, Property>;
  private bookings: Map<number, Booking>;
  private reviews: Map<number, Review>;
  private rewardTransactions: Map<number, RewardTransaction>;
  private analytics: Map<number, Analytics>;
  private restaurants: Map<number, Restaurant>;
  private restaurantReservations: Map<number, RestaurantReservation>;
  private restaurantReviews: Map<number, RestaurantReview>;
  private tripPlans: Map<number, TripPlan>;
  private tripItems: Map<number, TripItem>;
  private tripComments: Map<number, TripComment>;
  private chatConversations: Map<number, ChatConversation>;
  private chatMessages: Map<number, ChatMessage>;
  private chatParticipants: Map<number, ChatParticipant>;
  private notifications: Map<number, Notification>;
  private fcmTokens: Map<number, FcmToken>;

  currentUserId: number;
  currentPropertyId: number;
  currentBookingId: number;
  currentReviewId: number;
  currentRewardTransactionId: number;
  currentAnalyticsId: number;
  currentRestaurantId: number;
  currentRestaurantReservationId: number;
  currentRestaurantReviewId: number;
  currentTripPlanId: number;
  currentTripItemId: number;
  currentTripCommentId: number;
  currentChatConversationId: number;
  currentChatMessageId: number;
  currentChatParticipantId: number;
  currentNotificationId: number;
  currentFcmTokenId: number;

  constructor() {
    this.users = new Map();
    this.properties = new Map();
    this.bookings = new Map();
    this.reviews = new Map();
    this.rewardTransactions = new Map();
    this.analytics = new Map();
    this.restaurants = new Map();
    this.restaurantReservations = new Map();
    this.restaurantReviews = new Map();
    this.tripPlans = new Map();
    this.tripItems = new Map();
    this.tripComments = new Map();
    this.chatConversations = new Map();
    this.chatMessages = new Map();
    this.chatParticipants = new Map();
    this.notifications = new Map();
    this.fcmTokens = new Map();

    this.currentUserId = 1;
    this.currentPropertyId = 1;
    this.currentBookingId = 1;
    this.currentReviewId = 1;
    this.currentRewardTransactionId = 1;
    this.currentAnalyticsId = 1;
    this.currentRestaurantId = 1;
    this.currentRestaurantReservationId = 1;
    this.currentRestaurantReviewId = 1;
    this.currentTripPlanId = 1;
    this.currentTripItemId = 1;
    this.currentTripCommentId = 1;
    this.currentChatConversationId = 1;
    this.currentChatMessageId = 1;
    this.currentChatParticipantId = 1;
    this.currentNotificationId = 1;
    this.currentFcmTokenId = 1;

    // Create a super admin
    this.createUser({
      username: "admin",
      email: "admin@staychill.com",
      password: "adminpass", // In a real app, use proper hashing
      role: "superadmin",
      firstName: "Admin",
      lastName: "User",
      avatar: "https://ui-avatars.com/api/?name=Admin+User",
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    // Normalize email to lowercase for case-insensitive comparison
    const normalizedEmail = email.toLowerCase();
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === normalizedEmail,
    );
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.firebaseUid === firebaseUid,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    // Normalize email to lowercase before storing
    const normalizedUser = {
      ...insertUser,
      email: insertUser.email.toLowerCase()
    };
    const user: User = { ...normalizedUser, id, createdAt: new Date(), rewardPoints: 0 };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserStripeInfo(id: number, info: { customerId: string, subscriptionId?: string }): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { 
      ...user, 
      stripeCustomerId: info.customerId,
      stripeSubscriptionId: info.subscriptionId || user.stripeSubscriptionId
    };

    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateStripeCustomerId(id: number, customerId: string): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, stripeCustomerId: customerId };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.role === role);
  }

  // Property methods
  async getProperty(id: number): Promise<Property | undefined> {
    return this.properties.get(id);
  }

  async getProperties(limit = 20, offset = 0): Promise<Property[]> {
    const properties = Array.from(this.properties.values())
      .filter(property => property.active)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return properties.slice(offset, offset + limit);
  }

  async getUserProperties(userId: number): Promise<Property[]> {
    return Array.from(this.properties.values())
      .filter(property => property.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getPropertiesByLocation(location: string): Promise<Property[]> {
    return Array.from(this.properties.values())
      .filter(property => 
        property.active && 
        property.location.toLowerCase().includes(location.toLowerCase())
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getFeaturedProperties(limit = 6): Promise<Property[]> {
    return Array.from(this.properties.values())
      .filter(property => property.active && property.featured)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async createProperty(insertProperty: InsertProperty): Promise<Property> {
    const id = this.currentPropertyId++;
    const property: Property = { 
      ...insertProperty, 
      id, 
      createdAt: new Date(),
      rating: 0,
      reviewsCount: 0
    };
    this.properties.set(id, property);
    return property;
  }

  async updateProperty(id: number, propertyData: Partial<Property>): Promise<Property | undefined> {
    const property = this.properties.get(id);
    if (!property) return undefined;

    const updatedProperty = { ...property, ...propertyData };
    this.properties.set(id, updatedProperty);
    return updatedProperty;
  }

  async deleteProperty(id: number): Promise<boolean> {
    return this.properties.delete(id);
  }

  // Booking methods
  async getBooking(id: number): Promise<Booking | undefined> {
    return this.bookings.get(id);
  }

  async getUserBookings(userId: number): Promise<Booking[]> {
    return Array.from(this.bookings.values())
      .filter(booking => booking.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getPropertyBookings(propertyId: number): Promise<Booking[]> {
    return Array.from(this.bookings.values())
      .filter(booking => booking.propertyId === propertyId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const id = this.currentBookingId++;
    const booking: Booking = { ...insertBooking, id, createdAt: new Date() };
    this.bookings.set(id, booking);
    return booking;
  }

  async updateBooking(id: number, bookingData: Partial<Booking>): Promise<Booking | undefined> {
    const booking = this.bookings.get(id);
    if (!booking) return undefined;

    const updatedBooking = { ...booking, ...bookingData };
    this.bookings.set(id, updatedBooking);
    return updatedBooking;
  }

  // Review methods
  async getPropertyReviews(propertyId: number): Promise<Review[]> {
    return Array.from(this.reviews.values())
      .filter(review => review.propertyId === propertyId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getUserReviews(userId: number): Promise<Review[]> {
    return Array.from(this.reviews.values())
      .filter(review => review.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getAllReviews(limit = 100): Promise<Review[]> {
    return Array.from(this.reviews.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const id = this.currentReviewId++;
    const review: Review = { ...insertReview, id, createdAt: new Date() };
    this.reviews.set(id, review);

    // Update property rating
    const property = this.properties.get(review.propertyId);
    if (property) {
      const propertyReviews = await this.getPropertyReviews(review.propertyId);
      const totalRating = propertyReviews.reduce((sum, r) => sum + r.rating, 0);
      const newRating = totalRating / propertyReviews.length;

      await this.updateProperty(review.propertyId, {
        rating: newRating,
        reviewsCount: propertyReviews.length
      });
    }

    return review;
  }

  // Reward methods
  async getUserRewards(userId: number): Promise<RewardTransaction[]> {
    return Array.from(this.rewardTransactions.values())
      .filter(transaction => transaction.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createRewardTransaction(insertTransaction: InsertRewardTransaction): Promise<RewardTransaction> {
    const id = this.currentRewardTransactionId++;
    const transaction: RewardTransaction = { ...insertTransaction, id, createdAt: new Date() };
    this.rewardTransactions.set(id, transaction);

    // Update user's reward points
    const user = this.users.get(transaction.userId);
    if (user) {
      const pointsChange = transaction.transactionType === 'earn' ? transaction.points : -transaction.points;
      await this.updateUser(transaction.userId, {
        rewardPoints: user.rewardPoints + pointsChange
      });
    }

    return transaction;
  }

  // Admin analytics
  async getAnalytics(startDate: Date, endDate: Date): Promise<Analytics[]> {
    return Array.from(this.analytics.values())
      .filter(item => item.date >= startDate && item.date <= endDate)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  async createOrUpdateAnalytics(insertAnalytics: InsertAnalytics): Promise<Analytics> {
    // Check if analytics for this date already exists
    const existingAnalytics = Array.from(this.analytics.values())
      .find(item => item.date.toDateString() === insertAnalytics.date.toDateString());

    if (existingAnalytics) {
      const updatedAnalytics = { ...existingAnalytics, ...insertAnalytics };
      this.analytics.set(existingAnalytics.id, updatedAnalytics);
      return updatedAnalytics;
    } else {
      const id = this.currentAnalyticsId++;
      const newAnalytics: Analytics = { ...insertAnalytics, id };
      this.analytics.set(id, newAnalytics);
      return newAnalytics;
    }
  }

  // Restaurant methods
  async getRestaurant(id: number): Promise<Restaurant | undefined> {
    return this.restaurants.get(id);
  }

  async getRestaurants(limit = 20, offset = 0): Promise<Restaurant[]> {
    const restaurants = Array.from(this.restaurants.values())
      .filter(restaurant => restaurant.active)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return restaurants.slice(offset, offset + limit);
  }

  async getRestaurantsByLocation(location: string): Promise<Restaurant[]> {
    return Array.from(this.restaurants.values())
      .filter(restaurant => 
        restaurant.active && 
        restaurant.location.toLowerCase().includes(location.toLowerCase())
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getFeaturedRestaurants(limit = 6): Promise<Restaurant[]> {
    return Array.from(this.restaurants.values())
      .filter(restaurant => restaurant.active && restaurant.featured)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async createRestaurant(insertRestaurant: InsertRestaurant): Promise<Restaurant> {
    const id = this.currentRestaurantId++;
    const restaurant: Restaurant = { 
      ...insertRestaurant, 
      id, 
      createdAt: new Date(),
      rating: 0,
      reviewsCount: 0
    };
    this.restaurants.set(id, restaurant);
    return restaurant;
  }

  async updateRestaurant(id: number, restaurantData: Partial<Restaurant>): Promise<Restaurant | undefined> {
    const restaurant = this.restaurants.get(id);
    if (!restaurant) return undefined;

    const updatedRestaurant = { ...restaurant, ...restaurantData };
    this.restaurants.set(id, updatedRestaurant);
    return updatedRestaurant;
  }

  async deleteRestaurant(id: number): Promise<boolean> {
    return this.restaurants.delete(id);
  }

  // Restaurant reservation methods
  async getRestaurantReservation(id: number): Promise<RestaurantReservation | undefined> {
    return this.restaurantReservations.get(id);
  }

  async getUserRestaurantReservations(userId: number): Promise<RestaurantReservation[]> {
    return Array.from(this.restaurantReservations.values())
      .filter(reservation => reservation.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getRestaurantReservations(restaurantId: number): Promise<RestaurantReservation[]> {
    return Array.from(this.restaurantReservations.values())
      .filter(reservation => reservation.restaurantId === restaurantId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createRestaurantReservation(insertReservation: InsertRestaurantReservation): Promise<RestaurantReservation> {
    const id = this.currentRestaurantReservationId++;
    const reservation: RestaurantReservation = { ...insertReservation, id, createdAt: new Date() };
    this.restaurantReservations.set(id, reservation);

    // Add reward points for the restaurant reservation (100 points)
    if (reservation.pointsEarned) {
      await this.createRewardTransaction({
        userId: reservation.userId,
        points: reservation.pointsEarned,
        description: "Points earned for restaurant reservation",
        transactionType: "earn",
        status: "active"
      });
    }

    return reservation;
  }

  async updateRestaurantReservation(id: number, reservationData: Partial<RestaurantReservation>): Promise<RestaurantReservation | undefined> {
    const reservation = this.restaurantReservations.get(id);
    if (!reservation) return undefined;

    const updatedReservation = { ...reservation, ...reservationData };
    this.restaurantReservations.set(id, updatedReservation);
    return updatedReservation;
  }

  async cancelRestaurantReservation(id: number): Promise<boolean> {
    const reservation = this.restaurantReservations.get(id);
    if (!reservation) return false;

    const updatedReservation = { ...reservation, status: "cancelled" };
    this.restaurantReservations.set(id, updatedReservation);

    // Revoke reward points if the reservation is cancelled and points were earned
    if (reservation.pointsEarned) {
      await this.createRewardTransaction({
        userId: reservation.userId,
        points: reservation.pointsEarned,
        description: "Points revoked for cancelled restaurant reservation",
        transactionType: "redeem",
        status: "active"
      });
    }

    return true;
  }

  // Restaurant review methods
  async getRestaurantReviews(restaurantId: number): Promise<RestaurantReview[]> {
    return Array.from(this.restaurantReviews.values())
      .filter(review => review.restaurantId === restaurantId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createRestaurantReview(insertReview: InsertRestaurantReview): Promise<RestaurantReview> {
    const id = this.currentRestaurantReviewId++;
    const review: RestaurantReview = { ...insertReview, id, createdAt: new Date() };
    this.restaurantReviews.set(id, review);

    // Update restaurant rating
    const restaurant = this.restaurants.get(review.restaurantId);
    if (restaurant) {
      const restaurantReviews = await this.getRestaurantReviews(review.restaurantId);
      const totalRating = restaurantReviews.reduce((sum, r) => sum + r.rating, 0);
      const newRating = totalRating / restaurantReviews.length;

      await this.updateRestaurant(review.restaurantId, {
        rating: newRating,
        reviewsCount: restaurantReviews.length
      });
    }

    return review;
  }

  async getUserRestaurantReviews(userId: number): Promise<RestaurantReview[]> {
    return Array.from(this.restaurantReviews.values())
      .filter(review => review.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  // Chat methods
  async getConversation(id: number): Promise<ChatConversation | undefined> {
    return this.chatConversations.get(id);
  }

  async getUserConversations(userId: number): Promise<ChatConversation[]> {
    // Get all conversations where the user is a participant
    const participantsList = Array.from(this.chatParticipants.values())
      .filter(participant => participant.userId === userId && participant.isActive);
    
    const conversationIds = participantsList.map(p => p.conversationId);
    
    return Array.from(this.chatConversations.values())
      .filter(conv => conversationIds.includes(conv.id) && conv.isActive)
      .sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());
  }

  async getPropertyConversations(propertyId: number): Promise<ChatConversation[]> {
    return Array.from(this.chatConversations.values())
      .filter(conv => conv.propertyId === propertyId && conv.isActive)
      .sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());
  }

  async getBookingConversations(bookingId: number): Promise<ChatConversation[]> {
    return Array.from(this.chatConversations.values())
      .filter(conv => conv.bookingId === bookingId && conv.isActive)
      .sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());
  }

  async createConversation(conversation: InsertChatConversation): Promise<ChatConversation> {
    const id = this.currentChatConversationId++;
    const newConversation: ChatConversation = {
      ...conversation,
      id,
      lastMessageAt: new Date(),
      createdAt: new Date(),
      isActive: true
    };
    this.chatConversations.set(id, newConversation);
    return newConversation;
  }

  async updateConversation(id: number, data: Partial<ChatConversation>): Promise<ChatConversation | undefined> {
    const conversation = this.chatConversations.get(id);
    if (!conversation) return undefined;

    const updatedConversation = { ...conversation, ...data };
    this.chatConversations.set(id, updatedConversation);
    return updatedConversation;
  }

  async getConversationMessages(conversationId: number, limit = 100, offset = 0): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter(message => message.conversationId === conversationId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);
  }

  async createMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const id = this.currentChatMessageId++;
    const newMessage: ChatMessage = {
      ...message,
      id,
      createdAt: new Date(),
      isRead: false,
      readAt: null,
      attachments: message.attachments || []
    };
    this.chatMessages.set(id, newMessage);

    // Update conversation lastMessageAt
    const conversation = this.chatConversations.get(message.conversationId);
    if (conversation) {
      await this.updateConversation(conversation.id, {
        lastMessageAt: new Date()
      });
    }

    return newMessage;
  }

  async markMessagesAsRead(conversationId: number, userId: number): Promise<boolean> {
    const messages = Array.from(this.chatMessages.values())
      .filter(message => 
        message.conversationId === conversationId && 
        message.senderId !== userId && 
        !message.isRead
      );
    
    const now = new Date();
    for (const message of messages) {
      this.chatMessages.set(message.id, {
        ...message,
        isRead: true,
        readAt: now
      });
    }
    
    return true;
  }

  async getConversationParticipants(conversationId: number): Promise<ChatParticipant[]> {
    return Array.from(this.chatParticipants.values())
      .filter(participant => participant.conversationId === conversationId && participant.isActive);
  }

  async addParticipantToConversation(participant: InsertChatParticipant): Promise<ChatParticipant> {
    const id = this.currentChatParticipantId++;
    const newParticipant: ChatParticipant = {
      ...participant,
      id,
      joinedAt: new Date(),
      isActive: true,
      leftAt: null,
      isAdmin: participant.isAdmin || false
    };
    this.chatParticipants.set(id, newParticipant);
    return newParticipant;
  }

  async removeParticipantFromConversation(participantId: number): Promise<boolean> {
    const participant = this.chatParticipants.get(participantId);
    if (!participant) return false;

    this.chatParticipants.set(participantId, {
      ...participant,
      isActive: false,
      leftAt: new Date()
    });
    return true;
  }

  // Trip planning methods
  async getTripPlan(id: number): Promise<TripPlan | undefined> {
    return this.tripPlans.get(id);
  }

  async getUserTripPlans(userId: number): Promise<TripPlan[]> {
    return Array.from(this.tripPlans.values())
      .filter(tripPlan => tripPlan.ownerId === userId)
      .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
  }

  async getSharedTripPlans(userId: number): Promise<TripPlan[]> {
    return Array.from(this.tripPlans.values())
      .filter(tripPlan => 
        tripPlan.collaborators?.includes(userId) || 
        (tripPlan.isPublic && tripPlan.ownerId !== userId)
      )
      .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
  }

  async getTripPlanByInviteCode(inviteCode: string): Promise<TripPlan | undefined> {
    return Array.from(this.tripPlans.values())
      .find(tripPlan => tripPlan.inviteCode === inviteCode);
  }

  async createTripPlan(insertTripPlan: InsertTripPlan): Promise<TripPlan> {
    const id = this.currentTripPlanId++;
    // Generate a random 8-character invite code if not provided
    const inviteCode = insertTripPlan.inviteCode || 
      Math.random().toString(36).substring(2, 10).toUpperCase();

    const tripPlan: TripPlan = { 
      ...insertTripPlan, 
      id, 
      inviteCode,
      createdAt: new Date(),
      lastModified: new Date(),
      collaborators: insertTripPlan.collaborators || []
    };

    this.tripPlans.set(id, tripPlan);
    return tripPlan;
  }

  async updateTripPlan(id: number, tripPlanData: Partial<TripPlan>): Promise<TripPlan | undefined> {
    const tripPlan = this.tripPlans.get(id);
    if (!tripPlan) return undefined;

    const updatedTripPlan: TripPlan = { 
      ...tripPlan, 
      ...tripPlanData,
      lastModified: new Date()
    };
    this.tripPlans.set(id, updatedTripPlan);
    return updatedTripPlan;
  }

  async deleteTripPlan(id: number): Promise<boolean> {
    // Delete all trip items associated with this trip
    const tripItems = await this.getTripItems(id);
    for (const item of tripItems) {
      await this.deleteTripItem(item.id);
    }

    return this.tripPlans.delete(id);
  }

  // Trip items methods
  async getTripItems(tripId: number): Promise<TripItem[]> {
    return Array.from(this.tripItems.values())
      .filter(item => item.tripId === tripId)
      .sort((a, b) => a.order - b.order);  // Sort by order
  }

  async getTripItem(id: number): Promise<TripItem | undefined> {
    return this.tripItems.get(id);
  }

  async createTripItem(insertTripItem: InsertTripItem): Promise<TripItem> {
    const id = this.currentTripItemId++;

    // Get the current items for this trip to determine the next order
    const currentItems = await this.getTripItems(insertTripItem.tripId);
    const maxOrder = currentItems.length > 0 
      ? Math.max(...currentItems.map(item => item.order)) 
      : 0;

    const tripItem: TripItem = { 
      ...insertTripItem, 
      id,
      order: insertTripItem.order || maxOrder + 1,
      createdAt: new Date(),
      lastModified: new Date(),
      lastModifiedBy: insertTripItem.createdBy
    };

    this.tripItems.set(id, tripItem);

    // Update the last modified date on the parent trip plan
    const tripPlan = await this.getTripPlan(insertTripItem.tripId);
    if (tripPlan) {
      await this.updateTripPlan(tripPlan.id, {});  // This will update the lastModified date
    }

    return tripItem;
  }

  async updateTripItem(id: number, tripItemData: Partial<TripItem>): Promise<TripItem | undefined> {
    const tripItem = this.tripItems.get(id);
    if (!tripItem) return undefined;

    const updatedTripItem: TripItem = { 
      ...tripItem, 
      ...tripItemData,
      lastModified: new Date()
    };
    this.tripItems.set(id, updatedTripItem);

    // Update the last modified date on the parent trip plan
    const tripPlan = await this.getTripPlan(tripItem.tripId);
    if (tripPlan) {
      await this.updateTripPlan(tripPlan.id, {});  // This will update the lastModified date
    }

    return updatedTripItem;
  }

  async deleteTripItem(id: number): Promise<boolean> {
    const tripItem = this.tripItems.get(id);
    if (!tripItem) return false;

    // Delete all comments associated with this item
    const comments = await this.getTripComments(tripItem.tripId, id);
    for (const comment of comments) {
      this.tripComments.delete(comment.id);
    }

    // Update the last modified date on the parent trip plan
    const tripPlan = await this.getTripPlan(tripItem.tripId);
    if (tripPlan) {
      await this.updateTripPlan(tripPlan.id, {});  // This will update the lastModified date
    }

    return this.tripItems.delete(id);
  }

  // Trip comments methods
  async getTripComments(tripId: number, tripItemId?: number): Promise<TripComment[]> {
    let comments = Array.from(this.tripComments.values())
      .filter(comment => comment.tripId === tripId);

    if (tripItemId !== undefined) {
      comments = comments.filter(comment => comment.tripItemId === tripItemId);
    }

    return comments.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async createTripComment(insertTripComment: InsertTripComment): Promise<TripComment> {
    const id = this.currentTripCommentId++;
    const comment: TripComment = { ...insertTripComment, id, createdAt: new Date() };
    this.tripComments.set(id, comment);

    // Update the last modified date on the parent trip plan
    const tripPlan = await this.getTripPlan(insertTripComment.tripId);
    if (tripPlan) {
      await this.updateTripPlan(tripPlan.id, {});  // This will update the lastModified date
    }

    return comment;
  }
}

// Import the DatabaseStorage implementation
import { DatabaseStorage } from './database-storage';

// Use DatabaseStorage instead of MemStorage
export const storage = new DatabaseStorage();