import { pgTable, text, serial, integer, boolean, timestamp, real, doublePrecision, jsonb, time } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User roles enum
export enum UserRole {
  USER = 'user',
  PROPERTY_ADMIN = 'property_admin',
  SUPER_ADMIN = 'super_admin'
}

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  avatar: text("avatar"),
  role: text("role").notNull().default(UserRole.USER),
  rewardPoints: integer("reward_points").notNull().default(0),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  firebaseUid: text("firebase_uid"), // For Firebase authentication
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Property model
export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  address: text("address").notNull(),
  price: real("price").notNull(),
  beds: integer("beds").notNull(),
  baths: integer("baths").notNull(),
  guests: integer("guests").notNull(),
  images: text("images").array().notNull(),
  amenities: text("amenities").array(),
  rating: real("rating"),
  reviewsCount: integer("reviews_count").default(0),
  userId: integer("user_id").notNull(),
  featured: boolean("featured").default(false),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Payment method enum values
export const PAYMENT_METHODS = ['stripe', 'cash_on_arrival'] as const;
export type PaymentMethod = typeof PAYMENT_METHODS[number];

// Booking model
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  propertyId: integer("property_id").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  guestCount: integer("guest_count").notNull(),
  totalPrice: real("total_price").notNull(),
  status: text("status").notNull().default("pending"),
  paymentMethod: text("payment_method").notNull(), // 'stripe' or 'cash_on_arrival'
  stripePaymentId: text("stripe_payment_id"),
  paymentStatus: text("payment_status").notNull().default("pending"), // 'pending', 'paid', 'failed'
  pointsEarned: integer("points_earned"),
  specialRequests: text("special_requests"),
  guestName: text("guest_name"),
  guestEmail: text("guest_email"),
  guestPhone: text("guest_phone"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Reviews model
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  propertyId: integer("property_id").notNull(),
  bookingId: integer("booking_id").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Rewards transaction model
export const rewardTransactions = pgTable("reward_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  bookingId: integer("booking_id"),
  points: integer("points").notNull(),
  description: text("description").notNull(),
  transactionType: text("transaction_type").notNull(), // earn, redeem, transfer, expire
  recipientId: integer("recipient_id"), // Used for transfers
  expiryDate: timestamp("expiry_date"), // For points that expire
  status: text("status").notNull().default("active"), // active, pending, expired, cancelled
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Analytics model
export const analytics = pgTable("analytics", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  totalBookings: integer("total_bookings").notNull().default(0),
  totalRevenue: real("total_revenue").notNull().default(0),
  activeUsers: integer("active_users").notNull().default(0),
  newUsers: integer("new_users").notNull().default(0),
  data: jsonb("data"),
});

// Define insert schemas for each model
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertPropertySchema = createInsertSchema(properties).omit({ id: true, createdAt: true });
export const insertBookingSchema = createInsertSchema(bookings).omit({ id: true, createdAt: true });
export const insertReviewSchema = createInsertSchema(reviews).omit({ id: true, createdAt: true });
export const insertRewardTransactionSchema = createInsertSchema(rewardTransactions).omit({ id: true, createdAt: true });
export const insertAnalyticsSchema = createInsertSchema(analytics).omit({ id: true });

// Define types for each model
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Property = typeof properties.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

export type RewardTransaction = typeof rewardTransactions.$inferSelect;
export type InsertRewardTransaction = z.infer<typeof insertRewardTransactionSchema>;

// Restaurant model
export const restaurants = pgTable("restaurants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(), // 'El Sahel', 'Ras El Hekma', etc.
  address: text("address").notNull(),
  cuisineType: text("cuisine_type").notNull(),
  priceRange: text("price_range").notNull(), // '$', '$$', '$$$'
  images: text("images").array(),
  openingTime: time("opening_time").notNull(),
  closingTime: time("closing_time").notNull(),
  contactPhone: text("contact_phone").notNull(),
  contactEmail: text("contact_email"),
  website: text("website"),
  rating: real("rating"),
  reviewsCount: integer("reviews_count").default(0),
  featured: boolean("featured").default(false),
  active: boolean("active").default(true),
  lat: real("lat"), // Latitude for Google Maps integration
  lng: real("lng"), // Longitude for Google Maps integration
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Restaurant reservation model
export const restaurantReservations = pgTable("restaurant_reservations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  restaurantId: integer("restaurant_id").notNull(),
  reservationDate: timestamp("reservation_date").notNull(),
  reservationTime: time("reservation_time").notNull(),
  partySize: integer("party_size").notNull(),
  specialRequests: text("special_requests"),
  status: text("status").notNull().default("pending"), // pending, confirmed, cancelled, completed
  pointsEarned: integer("points_earned").default(100), // 100 points for restaurant reservation
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Restaurant review model
export const restaurantReviews = pgTable("restaurant_reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  restaurantId: integer("restaurant_id").notNull(),
  reservationId: integer("reservation_id"),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Define insert schemas for restaurant models
export const insertRestaurantSchema = createInsertSchema(restaurants).omit({ id: true, createdAt: true });
export const insertRestaurantReservationSchema = createInsertSchema(restaurantReservations).omit({ id: true, createdAt: true });
export const insertRestaurantReviewSchema = createInsertSchema(restaurantReviews).omit({ id: true, createdAt: true });

export type Analytics = typeof analytics.$inferSelect;
export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;

// Define types for restaurant models
export type Restaurant = typeof restaurants.$inferSelect;
export type InsertRestaurant = z.infer<typeof insertRestaurantSchema>;

export type RestaurantReservation = typeof restaurantReservations.$inferSelect;
export type InsertRestaurantReservation = z.infer<typeof insertRestaurantReservationSchema>;

export type RestaurantReview = typeof restaurantReviews.$inferSelect;
export type InsertRestaurantReview = z.infer<typeof insertRestaurantReviewSchema>;

// Service types enum
export const SERVICE_TYPES = ['restaurant', 'nightclub', 'cleaning', 'delivery', 'car'] as const;
export type ServiceType = typeof SERVICE_TYPES[number];

// Services model
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  serviceType: text("service_type").notNull(), // restaurant, cleaning, delivery, car
  priceRange: text("price_range"), // '$', '$$', '$$$'
  image: text("image"),
  available: boolean("available").default(false),
  availabilityTime: text("availability_time"),
  rating: real("rating"),
  featured: boolean("featured").default(false),
  comingSoon: boolean("coming_soon").default(true),
  restaurantId: integer("restaurant_id"), // For restaurant services
  contactPhone: text("contact_phone"),
  contactEmail: text("contact_email"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Define insert schema for services model
export const insertServiceSchema = createInsertSchema(services).omit({ id: true, createdAt: true });

// Define type for services model
export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;

// Trip planning model
export const tripPlans = pgTable("trip_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  destination: text("destination").notNull(),
  ownerId: integer("owner_id").notNull(),
  collaborators: integer("collaborators").array(),
  isPublic: boolean("is_public").default(false),
  inviteCode: text("invite_code"),
  lastModified: timestamp("last_modified").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Trip item types: 'stay', 'activity', 'transportation', 'meal', 'note'
export const TRIP_ITEM_TYPES = ['stay', 'activity', 'transportation', 'meal', 'note'] as const;
export type TripItemType = typeof TRIP_ITEM_TYPES[number];

// Trip items model
export const tripItems = pgTable("trip_items", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").notNull(),
  type: text("type").notNull(), // stay, activity, transportation, meal, note
  title: text("title").notNull(),
  description: text("description"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  location: text("location"),
  propertyId: integer("property_id"), // For stay type
  restaurantId: integer("restaurant_id"), // For meal type
  cost: real("cost"),
  notes: text("notes"),
  order: integer("order").notNull(), // For ordering items in the trip
  createdBy: integer("created_by").notNull(),
  lastModifiedBy: integer("last_modified_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastModified: timestamp("last_modified").notNull().defaultNow(),
});

// Trip comments for collaborative planning
export const tripComments = pgTable("trip_comments", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").notNull(),
  tripItemId: integer("trip_item_id"),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Define insert schemas for trip planning models
export const insertTripPlanSchema = createInsertSchema(tripPlans).omit({ id: true, createdAt: true, lastModified: true });
export const insertTripItemSchema = createInsertSchema(tripItems).omit({ id: true, createdAt: true, lastModified: true });
export const insertTripCommentSchema = createInsertSchema(tripComments).omit({ id: true, createdAt: true });

// Define types for trip planning models
export type TripPlan = typeof tripPlans.$inferSelect;
export type InsertTripPlan = z.infer<typeof insertTripPlanSchema>;

export type TripItem = typeof tripItems.$inferSelect;
export type InsertTripItem = z.infer<typeof insertTripItemSchema>;

export type TripComment = typeof tripComments.$inferSelect;
export type InsertTripComment = z.infer<typeof insertTripCommentSchema>;

// Chat types
export enum ChatType {
  DIRECT = 'direct',         // محادثة مباشرة بين المستخدمين
  BOOKING_SUPPORT = 'booking_support', // دعم للحجز
  PROPERTY_INQUIRY = 'property_inquiry'  // استفسار عن عقار
}

// Chat conversations model
export const chatConversations = pgTable("chat_conversations", {
  id: serial("id").primaryKey(),
  type: text("type").notNull().default(ChatType.DIRECT), // 'direct', 'booking_support', 'property_inquiry'
  title: text("title"),
  createdById: integer("created_by_id").notNull(),
  propertyId: integer("property_id"), // للمحادثات المتعلقة بالعقارات
  bookingId: integer("booking_id"), // للمحادثات المتعلقة بالحجوزات
  isActive: boolean("is_active").notNull().default(true),
  lastMessageAt: timestamp("last_message_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Chat messages model
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull(),
  senderId: integer("sender_id").notNull(),
  content: text("content").notNull(),
  attachments: text("attachments").array(),
  isRead: boolean("is_read").notNull().default(false),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Chat participants model for managing conversation members
export const chatParticipants = pgTable("chat_participants", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull(),
  userId: integer("user_id").notNull(),
  isAdmin: boolean("is_admin").default(false),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
  leftAt: timestamp("left_at"),
  isActive: boolean("is_active").notNull().default(true),
});

// Define insert schemas for chat models
export const insertChatConversationSchema = createInsertSchema(chatConversations).omit({ id: true, createdAt: true, lastMessageAt: true });
export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ id: true, createdAt: true });
export const insertChatParticipantSchema = createInsertSchema(chatParticipants).omit({ id: true, joinedAt: true });

// Define types for chat models
export type ChatConversation = typeof chatConversations.$inferSelect;
export type InsertChatConversation = z.infer<typeof insertChatConversationSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export type ChatParticipant = typeof chatParticipants.$inferSelect;
export type InsertChatParticipant = z.infer<typeof insertChatParticipantSchema>;

// Notification types enum
export const NOTIFICATION_TYPES = [
  'booking_reminder', 
  'offer', 
  'reward', 
  'system', 
  'referral', 
  'trip_tip', 
  'welcome_back', 
  'flash_sale',
  'new_message',
  'booking_confirmed',
  'payment_received',
  'review_reminder'
] as const;
export type NotificationType = typeof NOTIFICATION_TYPES[number];

// Notification priority levels
export const NOTIFICATION_PRIORITIES = ['high', 'medium', 'low'] as const;
export type NotificationPriority = typeof NOTIFICATION_PRIORITIES[number];

// Notifications model
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // User who should receive the notification
  type: text("type").notNull(), // Using NotificationType
  title: text("title").notNull(),
  message: text("message").notNull(),
  read: boolean("read").notNull().default(false),
  actionUrl: text("action_url"),
  actionText: text("action_text"),
  imageUrl: text("image_url"),
  expiresAt: timestamp("expires_at"),
  priority: text("priority").notNull().default('medium'), // Using NotificationPriority
  metadata: jsonb("metadata"), // Optional JSON data for additional info
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Define insert schema for notifications
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });

// Define types for notifications
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// FCM Tokens model for push notifications
export const fcmTokens = pgTable("fcm_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  token: text("token").notNull().unique(),
  device: text("device"),
  platform: text("platform"), // ios, android, web
  lastUsed: timestamp("last_used").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Define insert schema for FCM tokens
export const insertFcmTokenSchema = createInsertSchema(fcmTokens).omit({ id: true, createdAt: true, lastUsed: true });

// Define types for FCM tokens
export type FcmToken = typeof fcmTokens.$inferSelect;
export type InsertFcmToken = z.infer<typeof insertFcmTokenSchema>;
