import {
  users, properties, bookings, reviews, rewardTransactions, analytics,
  restaurants, restaurantReservations, restaurantReviews,
  type User, type InsertUser, type Property, type InsertProperty,
  type Booking, type InsertBooking, type Review, type InsertReview,
  type RewardTransaction, type InsertRewardTransaction, type Analytics, type InsertAnalytics,
  type Restaurant, type InsertRestaurant, type RestaurantReservation, type InsertRestaurantReservation,
  type RestaurantReview, type InsertRestaurantReview
} from "@shared/schema";
import { IStorage } from "./storage";
import { db } from "./db";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.firebaseUid, firebaseUid));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async updateUserStripeInfo(
    id: number, 
    info: { customerId: string; subscriptionId?: string }
  ): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({
        stripeCustomerId: info.customerId,
        ...(info.subscriptionId ? { stripeSubscriptionId: info.subscriptionId } : {})
      })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async updateStripeCustomerId(id: number, customerId: string): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ stripeCustomerId: customerId })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return db.select().from(users).where(eq(users.role, role));
  }

  // Property methods
  async getProperty(id: number): Promise<Property | undefined> {
    const [property] = await db.select().from(properties).where(eq(properties.id, id));
    return property;
  }

  async getProperties(limit = 20, offset = 0): Promise<Property[]> {
    return db
      .select()
      .from(properties)
      .where(eq(properties.active, true))
      .limit(limit)
      .offset(offset);
  }

  async getUserProperties(userId: number): Promise<Property[]> {
    return db
      .select()
      .from(properties)
      .where(eq(properties.userId, userId));
  }

  async getPropertiesByLocation(location: string): Promise<Property[]> {
    return db
      .select()
      .from(properties)
      .where(
        and(
          eq(properties.location, location),
          eq(properties.active, true)
        )
      );
  }

  async getFeaturedProperties(limit = 6): Promise<Property[]> {
    return db
      .select()
      .from(properties)
      .where(
        and(
          eq(properties.featured, true),
          eq(properties.active, true)
        )
      )
      .limit(limit);
  }

  async createProperty(property: InsertProperty): Promise<Property> {
    const [newProperty] = await db
      .insert(properties)
      .values(property)
      .returning();
    return newProperty;
  }

  async updateProperty(id: number, propertyData: Partial<Property>): Promise<Property | undefined> {
    const [updatedProperty] = await db
      .update(properties)
      .set(propertyData)
      .where(eq(properties.id, id))
      .returning();
    return updatedProperty;
  }

  async deleteProperty(id: number): Promise<boolean> {
    const result = await db
      .delete(properties)
      .where(eq(properties.id, id));
    return true;
  }

  // Booking methods
  async getBooking(id: number): Promise<Booking | undefined> {
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, id));
    
    if (booking) {
      const [propertyDetails] = await db
        .select({
          title: properties.title,
          location: properties.location,
          images: properties.images
        })
        .from(properties)
        .where(eq(properties.id, booking.propertyId));
        
      return {
        ...booking,
        property: propertyDetails
      } as any; // Using any here temporarily
    }
    
    return booking;
  }

  async getUserBookings(userId: number): Promise<Booking[]> {
    const userBookings = await db
      .select()
      .from(bookings)
      .where(eq(bookings.userId, userId))
      .orderBy(desc(bookings.createdAt));
    
    // Get property details for each booking
    const bookingsWithProperties = await Promise.all(
      userBookings.map(async (booking) => {
        const [propertyDetails] = await db
          .select({
            title: properties.title,
            location: properties.location,
            images: properties.images
          })
          .from(properties)
          .where(eq(properties.id, booking.propertyId));
          
        return {
          ...booking,
          property: propertyDetails
        };
      })
    );
    
    return bookingsWithProperties as any[]; // Using any[] here temporarily
  }

  async getPropertyBookings(propertyId: number): Promise<Booking[]> {
    return db
      .select()
      .from(bookings)
      .where(eq(bookings.propertyId, propertyId));
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const [newBooking] = await db
      .insert(bookings)
      .values(booking)
      .returning();
      
    // If booking is created successfully, add reward points
    if (newBooking && booking.totalPrice) {
      const pointsEarned = Math.floor(booking.totalPrice / 10); // 10 points per $100
      
      // Update booking with points earned
      await db
        .update(bookings)
        .set({ pointsEarned })
        .where(eq(bookings.id, newBooking.id));
        
      // Add reward transaction
      await db.insert(rewardTransactions).values({
        userId: booking.userId,
        bookingId: newBooking.id,
        points: pointsEarned,
        description: `Points earned for booking #${newBooking.id}`,
        transactionType: 'earn'
      });
      
      // Update user's reward points
      await db.execute(
        sql`UPDATE ${users} 
            SET "rewardPoints" = "rewardPoints" + ${pointsEarned} 
            WHERE id = ${booking.userId}`
      );
    }
    
    return newBooking;
  }

  async updateBooking(id: number, bookingData: Partial<Booking>): Promise<Booking | undefined> {
    const [updatedBooking] = await db
      .update(bookings)
      .set(bookingData)
      .where(eq(bookings.id, id))
      .returning();
    return updatedBooking;
  }

  // Review methods
  async getPropertyReviews(propertyId: number): Promise<Review[]> {
    return db
      .select()
      .from(reviews)
      .where(eq(reviews.propertyId, propertyId))
      .orderBy(desc(reviews.createdAt));
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db
      .insert(reviews)
      .values(review)
      .returning();
      
    // Update property rating and review count
    const propertyReviews = await db
      .select()
      .from(reviews)
      .where(eq(reviews.propertyId, review.propertyId));
      
    const reviewCount = propertyReviews.length;
    const avgRating = propertyReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount;
    
    await db
      .update(properties)
      .set({ 
        reviewsCount: reviewCount,
        rating: parseFloat(avgRating.toFixed(1))
      })
      .where(eq(properties.id, review.propertyId));
      
    return newReview;
  }

  // Reward methods
  async getUserRewards(userId: number): Promise<RewardTransaction[]> {
    return db
      .select()
      .from(rewardTransactions)
      .where(eq(rewardTransactions.userId, userId))
      .orderBy(desc(rewardTransactions.createdAt));
  }

  async createRewardTransaction(transaction: InsertRewardTransaction): Promise<RewardTransaction> {
    const [newTransaction] = await db
      .insert(rewardTransactions)
      .values(transaction)
      .returning();
      
    // Update user's reward points
    if (transaction.transactionType === 'earn') {
      await db.execute(
        sql`UPDATE ${users} 
            SET "rewardPoints" = "rewardPoints" + ${transaction.points} 
            WHERE id = ${transaction.userId}`
      );
    } else if (transaction.transactionType === 'redeem') {
      await db.execute(
        sql`UPDATE ${users} 
            SET "rewardPoints" = "rewardPoints" - ${transaction.points} 
            WHERE id = ${transaction.userId}`
      );
    }
    
    return newTransaction;
  }

  // Admin analytics
  async getAnalytics(startDate: Date, endDate: Date): Promise<Analytics[]> {
    try {
      // Ensure valid date range
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error('Invalid date parameters provided to getAnalytics');
      }
      
      const result = await db
        .select()
        .from(analytics)
        .where(
          and(
            gte(analytics.date, startDate),
            lte(analytics.date, endDate)
          )
        )
        .orderBy(analytics.date);
      
      // Log the number of analytics records found for debugging
      console.log(`Found ${result.length} analytics records between ${startDate.toISOString()} and ${endDate.toISOString()}`);
      
      // If no records found, initialize with default empty data
      if (result.length === 0) {
        // Instead of creating mock data, just return empty array
        return [];
      }
      
      return result;
    } catch (error) {
      console.error('Error in getAnalytics:', error);
      throw error; // Re-throw to allow the API endpoint to handle and report the error
    }
  }

  async createOrUpdateAnalytics(analyticsData: InsertAnalytics): Promise<Analytics> {
    // Check if analytics for this date already exists
    const [existingAnalytics] = await db
      .select()
      .from(analytics)
      .where(eq(analytics.date, analyticsData.date));
      
    if (existingAnalytics) {
      // Update existing analytics
      const [updatedAnalytics] = await db
        .update(analytics)
        .set(analyticsData)
        .where(eq(analytics.id, existingAnalytics.id))
        .returning();
      return updatedAnalytics;
    } else {
      // Create new analytics
      const [newAnalytics] = await db
        .insert(analytics)
        .values(analyticsData)
        .returning();
      return newAnalytics;
    }
  }

  // Restaurant methods
  async getRestaurant(id: number): Promise<Restaurant | undefined> {
    const [restaurant] = await db.select().from(restaurants).where(eq(restaurants.id, id));
    return restaurant;
  }

  async getRestaurants(limit = 20, offset = 0): Promise<Restaurant[]> {
    return db
      .select()
      .from(restaurants)
      .where(eq(restaurants.active, true))
      .limit(limit)
      .offset(offset);
  }

  async getRestaurantsByLocation(location: string): Promise<Restaurant[]> {
    return db
      .select()
      .from(restaurants)
      .where(
        and(
          eq(restaurants.location, location),
          eq(restaurants.active, true)
        )
      );
  }

  async getFeaturedRestaurants(limit = 6): Promise<Restaurant[]> {
    return db
      .select()
      .from(restaurants)
      .where(
        and(
          eq(restaurants.featured, true),
          eq(restaurants.active, true)
        )
      )
      .limit(limit);
  }

  async createRestaurant(restaurant: InsertRestaurant): Promise<Restaurant> {
    const [newRestaurant] = await db
      .insert(restaurants)
      .values(restaurant)
      .returning();
    return newRestaurant;
  }

  async updateRestaurant(id: number, restaurantData: Partial<Restaurant>): Promise<Restaurant | undefined> {
    const [updatedRestaurant] = await db
      .update(restaurants)
      .set(restaurantData)
      .where(eq(restaurants.id, id))
      .returning();
    return updatedRestaurant;
  }

  async deleteRestaurant(id: number): Promise<boolean> {
    const result = await db
      .delete(restaurants)
      .where(eq(restaurants.id, id));
    return true;
  }

  // Restaurant reservation methods
  async getRestaurantReservation(id: number): Promise<RestaurantReservation | undefined> {
    const [reservation] = await db
      .select()
      .from(restaurantReservations)
      .where(eq(restaurantReservations.id, id));
    
    if (reservation) {
      const [restaurantDetails] = await db
        .select({
          name: restaurants.name,
          location: restaurants.location,
          images: restaurants.images,
          address: restaurants.address
        })
        .from(restaurants)
        .where(eq(restaurants.id, reservation.restaurantId));
        
      return {
        ...reservation,
        restaurant: restaurantDetails
      } as any; // Using any here temporarily
    }
    
    return reservation;
  }

  async getUserRestaurantReservations(userId: number): Promise<RestaurantReservation[]> {
    const userReservations = await db
      .select()
      .from(restaurantReservations)
      .where(eq(restaurantReservations.userId, userId))
      .orderBy(desc(restaurantReservations.createdAt));
    
    // Get restaurant details for each reservation
    const reservationsWithRestaurants = await Promise.all(
      userReservations.map(async (reservation) => {
        const [restaurantDetails] = await db
          .select({
            name: restaurants.name,
            location: restaurants.location,
            images: restaurants.images,
            address: restaurants.address
          })
          .from(restaurants)
          .where(eq(restaurants.id, reservation.restaurantId));
          
        return {
          ...reservation,
          restaurant: restaurantDetails
        };
      })
    );
    
    return reservationsWithRestaurants as any[]; // Using any[] here temporarily
  }

  async getRestaurantReservations(restaurantId: number): Promise<RestaurantReservation[]> {
    return db
      .select()
      .from(restaurantReservations)
      .where(eq(restaurantReservations.restaurantId, restaurantId))
      .orderBy(desc(restaurantReservations.createdAt));
  }

  async createRestaurantReservation(reservation: InsertRestaurantReservation): Promise<RestaurantReservation> {
    const [newReservation] = await db
      .insert(restaurantReservations)
      .values(reservation)
      .returning();
      
    // If reservation is created successfully, add reward points
    if (newReservation) {
      const pointsEarned = 100; // Fixed 100 points for restaurant reservation
      
      // Update reservation with points earned
      await db
        .update(restaurantReservations)
        .set({ pointsEarned })
        .where(eq(restaurantReservations.id, newReservation.id));
        
      // Add reward transaction
      await db.insert(rewardTransactions).values({
        userId: reservation.userId,
        points: pointsEarned,
        description: `Points earned for restaurant reservation #${newReservation.id}`,
        transactionType: 'earn',
        status: 'active'
      });
      
      // Update user's reward points
      await db.execute(
        sql`UPDATE ${users} 
            SET "rewardPoints" = "rewardPoints" + ${pointsEarned} 
            WHERE id = ${reservation.userId}`
      );
    }
    
    return newReservation;
  }

  async updateRestaurantReservation(id: number, reservationData: Partial<RestaurantReservation>): Promise<RestaurantReservation | undefined> {
    const [updatedReservation] = await db
      .update(restaurantReservations)
      .set(reservationData)
      .where(eq(restaurantReservations.id, id))
      .returning();
    return updatedReservation;
  }

  async cancelRestaurantReservation(id: number): Promise<boolean> {
    const [reservation] = await db
      .select()
      .from(restaurantReservations)
      .where(eq(restaurantReservations.id, id));
    
    if (!reservation) {
      return false;
    }
    
    // Update reservation status to cancelled
    await db
      .update(restaurantReservations)
      .set({ status: 'cancelled' })
      .where(eq(restaurantReservations.id, id));
    
    // If points were earned, deduct them from user
    if (reservation.pointsEarned && reservation.pointsEarned > 0) {
      // Add reward transaction for points deduction
      await db.insert(rewardTransactions).values({
        userId: reservation.userId,
        points: reservation.pointsEarned,
        description: `Points deducted for cancelled restaurant reservation #${id}`,
        transactionType: 'deduct',
        status: 'active'
      });
      
      // Update user's reward points
      await db.execute(
        sql`UPDATE ${users} 
            SET "rewardPoints" = "rewardPoints" - ${reservation.pointsEarned} 
            WHERE id = ${reservation.userId}`
      );
    }
    
    return true;
  }

  // Restaurant review methods
  async getRestaurantReviews(restaurantId: number): Promise<RestaurantReview[]> {
    return db
      .select()
      .from(restaurantReviews)
      .where(eq(restaurantReviews.restaurantId, restaurantId))
      .orderBy(desc(restaurantReviews.createdAt));
  }

  async createRestaurantReview(review: InsertRestaurantReview): Promise<RestaurantReview> {
    const [newReview] = await db
      .insert(restaurantReviews)
      .values(review)
      .returning();
      
    // Update restaurant rating and review count
    const reviews = await db
      .select()
      .from(restaurantReviews)
      .where(eq(restaurantReviews.restaurantId, review.restaurantId));
      
    const reviewCount = reviews.length;
    const avgRating = reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / reviewCount;
    
    await db
      .update(restaurants)
      .set({ 
        reviewsCount: reviewCount,
        rating: parseFloat(avgRating.toFixed(1))
      })
      .where(eq(restaurants.id, review.restaurantId));
      
    return newReview;
  }

  async getUserRestaurantReviews(userId: number): Promise<RestaurantReview[]> {
    return db
      .select()
      .from(restaurantReviews)
      .where(eq(restaurantReviews.userId, userId))
      .orderBy(desc(restaurantReviews.createdAt));
  }
}