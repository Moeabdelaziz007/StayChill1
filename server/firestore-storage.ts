import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  Timestamp, 
  startAfter,
  serverTimestamp
} from 'firebase/firestore';
import { IStorage, User, Property, Booking, Review, RewardTransaction, Analytics, InsertUser, InsertProperty, InsertBooking, InsertReview, InsertRewardTransaction, InsertAnalytics } from './storage';

// Firebase configuration with environment variables
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: `${process.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${process.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig, 'server');
const db = getFirestore(app);

// Log initialization for debugging
console.log('Initializing Firebase with project ID:', process.env.VITE_FIREBASE_PROJECT_ID);

export class FirestoreStorage implements IStorage {
  // Collection names
  private usersCollection = 'users';
  private propertiesCollection = 'properties';
  private bookingsCollection = 'bookings';
  private reviewsCollection = 'reviews';
  private rewardTransactionsCollection = 'reward_transactions';
  private analyticsCollection = 'analytics';

  // Helper function to convert Firebase docs to our types
  private convertTimestamps<T>(data: any): T {
    if (!data) return data;
    
    // Convert Firestore Timestamps to JS Dates for our app models
    Object.keys(data).forEach(key => {
      if (data[key] instanceof Timestamp) {
        data[key] = data[key].toDate();
      } else if (data[key] && typeof data[key] === 'object') {
        data[key] = this.convertTimestamps(data[key]);
      }
    });
    
    return data as T;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const snapshot = await this.usersCollection.where('id', '==', id).limit(1).get();
    if (snapshot.empty) return undefined;
    return this.convertTimestamps<User>(snapshot.docs[0].data());
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const snapshot = await this.usersCollection.where('email', '==', email).limit(1).get();
    if (snapshot.empty) return undefined;
    return this.convertTimestamps<User>(snapshot.docs[0].data());
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const snapshot = await this.usersCollection.where('username', '==', username).limit(1).get();
    if (snapshot.empty) return undefined;
    return this.convertTimestamps<User>(snapshot.docs[0].data());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Get the highest ID to assign a new one
    const snapshot = await this.usersCollection.orderBy('id', 'desc').limit(1).get();
    const id = snapshot.empty ? 1 : snapshot.docs[0].data().id + 1;
    
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: new Date(), 
      rewardPoints: 0 
    };
    
    await this.usersCollection.doc(id.toString()).set(user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const userRef = this.usersCollection.doc(id.toString());
    const doc = await userRef.get();
    
    if (!doc.exists) return undefined;
    
    await userRef.update(userData);
    
    const updatedDoc = await userRef.get();
    return this.convertTimestamps<User>(updatedDoc.data());
  }

  async updateUserStripeInfo(id: number, info: { customerId: string, subscriptionId?: string }): Promise<User | undefined> {
    const userRef = this.usersCollection.doc(id.toString());
    const doc = await userRef.get();
    
    if (!doc.exists) return undefined;
    
    const updateData: any = { stripeCustomerId: info.customerId };
    if (info.subscriptionId) {
      updateData.stripeSubscriptionId = info.subscriptionId;
    }
    
    await userRef.update(updateData);
    
    const updatedDoc = await userRef.get();
    return this.convertTimestamps<User>(updatedDoc.data());
  }

  async updateStripeCustomerId(id: number, customerId: string): Promise<User | undefined> {
    const userRef = this.usersCollection.doc(id.toString());
    const doc = await userRef.get();
    
    if (!doc.exists) return undefined;
    
    await userRef.update({ stripeCustomerId: customerId });
    
    const updatedDoc = await userRef.get();
    return this.convertTimestamps<User>(updatedDoc.data());
  }

  async getAllUsers(limit = 100): Promise<User[]> {
    const snapshot = await this.usersCollection
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    return snapshot.docs.map(doc => this.convertTimestamps<User>(doc.data()));
  }

  async getUsersByRole(role: string, limit = 50): Promise<User[]> {
    const snapshot = await this.usersCollection
      .where('role', '==', role)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    return snapshot.docs.map(doc => this.convertTimestamps<User>(doc.data()));
  }

  // Property methods
  async getProperty(id: number): Promise<Property | undefined> {
    const doc = await this.propertiesCollection.doc(id.toString()).get();
    if (!doc.exists) return undefined;
    return this.convertTimestamps<Property>(doc.data());
  }

  async getProperties(limit = 20, offset = 0): Promise<Property[]> {
    const snapshot = await this.propertiesCollection
      .where('active', '==', true)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset(offset)
      .get();
      
    return snapshot.docs.map(doc => this.convertTimestamps<Property>(doc.data()));
  }

  async getUserProperties(userId: number, limit = 20): Promise<Property[]> {
    const snapshot = await this.propertiesCollection
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
      
    return snapshot.docs.map(doc => this.convertTimestamps<Property>(doc.data()));
  }

  async getPropertiesByLocation(location: string, limit = 20): Promise<Property[]> {
    const snapshot = await this.propertiesCollection
      .where('location', '==', location)
      .where('active', '==', true)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
      
    return snapshot.docs.map(doc => this.convertTimestamps<Property>(doc.data()));
  }

  async getFeaturedProperties(limit = 6): Promise<Property[]> {
    const snapshot = await this.propertiesCollection
      .where('featured', '==', true)
      .where('active', '==', true)
      .limit(limit)
      .get();
      
    return snapshot.docs.map(doc => this.convertTimestamps<Property>(doc.data()));
  }

  async createProperty(insertProperty: InsertProperty): Promise<Property> {
    // Get the highest ID to assign a new one
    const snapshot = await this.propertiesCollection.orderBy('id', 'desc').limit(1).get();
    const id = snapshot.empty ? 1 : snapshot.docs[0].data().id + 1;
    
    const property: Property = { 
      ...insertProperty, 
      id, 
      createdAt: new Date(), 
      active: true, 
      featured: false,
      reviewsCount: 0,
      rating: 0
    };
    
    await this.propertiesCollection.doc(id.toString()).set(property);
    return property;
  }

  async updateProperty(id: number, propertyData: Partial<Property>): Promise<Property | undefined> {
    const propertyRef = this.propertiesCollection.doc(id.toString());
    const doc = await propertyRef.get();
    
    if (!doc.exists) return undefined;
    
    await propertyRef.update(propertyData);
    
    const updatedDoc = await propertyRef.get();
    return this.convertTimestamps<Property>(updatedDoc.data());
  }

  async deleteProperty(id: number): Promise<boolean> {
    const doc = await this.propertiesCollection.doc(id.toString()).get();
    
    if (!doc.exists) return false;
    
    await this.propertiesCollection.doc(id.toString()).delete();
    return true;
  }

  // Booking methods
  async getBooking(id: number): Promise<Booking | undefined> {
    const doc = await this.bookingsCollection.doc(id.toString()).get();
    if (!doc.exists) return undefined;
    
    const booking = this.convertTimestamps<Booking>(doc.data());
    
    // Add property details if needed
    if (booking.propertyId) {
      const property = await this.getProperty(booking.propertyId);
      if (property) {
        booking.property = {
          title: property.title,
          location: property.location,
          images: property.images
        };
      }
    }
    
    return booking;
  }

  async getUserBookings(userId: number, limit = 20): Promise<Booking[]> {
    const snapshot = await this.bookingsCollection
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
      
    const bookings = snapshot.docs.map(doc => this.convertTimestamps<Booking>(doc.data()));
    
    // Add property details
    for (const booking of bookings) {
      const property = await this.getProperty(booking.propertyId);
      if (property) {
        booking.property = {
          title: property.title,
          location: property.location,
          images: property.images
        };
      }
    }
    
    return bookings;
  }

  async getPropertyBookings(propertyId: number, limit = 50): Promise<Booking[]> {
    const snapshot = await this.bookingsCollection
      .where('propertyId', '==', propertyId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
      
    return snapshot.docs.map(doc => this.convertTimestamps<Booking>(doc.data()));
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    // Get the highest ID to assign a new one
    const snapshot = await this.bookingsCollection.orderBy('id', 'desc').limit(1).get();
    const id = snapshot.empty ? 1 : snapshot.docs[0].data().id + 1;
    
    // Calculate points earned (2 points per dollar)
    const pointsEarned = Math.floor(insertBooking.totalPrice * 2);
    
    const booking: Booking = { 
      ...insertBooking, 
      id, 
      createdAt: new Date(),
      pointsEarned
    };
    
    await this.bookingsCollection.doc(id.toString()).set(booking);
    
    // Update user reward points if status is confirmed
    if (booking.status === 'confirmed') {
      const userRef = this.usersCollection.doc(booking.userId.toString());
      await userRef.update({
        rewardPoints: FieldValue.increment(pointsEarned)
      });
      
      // Create reward transaction
      await this.createRewardTransaction({
        userId: booking.userId,
        bookingId: booking.id,
        points: pointsEarned,
        description: `Earned points for booking ID #${booking.id}`,
        transactionType: 'earn'
      });
    }
    
    return booking;
  }

  async updateBooking(id: number, bookingData: Partial<Booking>): Promise<Booking | undefined> {
    const bookingRef = this.bookingsCollection.doc(id.toString());
    const doc = await bookingRef.get();
    
    if (!doc.exists) return undefined;
    
    const currentBooking = this.convertTimestamps<Booking>(doc.data());
    
    // Handle status changes for reward points
    if (bookingData.status && bookingData.status !== currentBooking.status) {
      // If changed to cancelled, remove reward points if they were earned
      if (bookingData.status === 'cancelled' && currentBooking.status === 'confirmed' && currentBooking.pointsEarned) {
        const userRef = this.usersCollection.doc(currentBooking.userId.toString());
        await userRef.update({
          rewardPoints: FieldValue.increment(-currentBooking.pointsEarned)
        });
        
        // Create negative transaction for cancelled booking
        await this.createRewardTransaction({
          userId: currentBooking.userId,
          bookingId: currentBooking.id,
          points: currentBooking.pointsEarned,
          description: `Points reversed for cancelled booking ID #${currentBooking.id}`,
          transactionType: 'redeem'
        });
      }
      
      // If changed to confirmed, add reward points if not previously earned
      if (bookingData.status === 'confirmed' && currentBooking.status !== 'confirmed' && currentBooking.pointsEarned) {
        const userRef = this.usersCollection.doc(currentBooking.userId.toString());
        await userRef.update({
          rewardPoints: FieldValue.increment(currentBooking.pointsEarned)
        });
        
        // Create reward transaction for confirmed booking
        await this.createRewardTransaction({
          userId: currentBooking.userId,
          bookingId: currentBooking.id,
          points: currentBooking.pointsEarned,
          description: `Earned points for booking ID #${currentBooking.id}`,
          transactionType: 'earn'
        });
      }
    }
    
    await bookingRef.update(bookingData);
    
    const updatedDoc = await bookingRef.get();
    return this.convertTimestamps<Booking>(updatedDoc.data());
  }

  // Review methods
  async getPropertyReviews(propertyId: number, limit = 20): Promise<Review[]> {
    const snapshot = await this.reviewsCollection
      .where('propertyId', '==', propertyId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
      
    return snapshot.docs.map(doc => this.convertTimestamps<Review>(doc.data()));
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    // Get the highest ID to assign a new one
    const snapshot = await this.reviewsCollection.orderBy('id', 'desc').limit(1).get();
    const id = snapshot.empty ? 1 : snapshot.docs[0].data().id + 1;
    
    const review: Review = { 
      ...insertReview, 
      id, 
      createdAt: new Date() 
    };
    
    await this.reviewsCollection.doc(id.toString()).set(review);
    
    // Update property rating
    const propertyRef = this.propertiesCollection.doc(review.propertyId.toString());
    const propertyDoc = await propertyRef.get();
    
    if (propertyDoc.exists) {
      const property = this.convertTimestamps<Property>(propertyDoc.data());
      const reviews = await this.getPropertyReviews(property.id);
      
      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      const newRating = totalRating / reviews.length;
      
      await propertyRef.update({
        rating: newRating,
        reviewsCount: reviews.length
      });
    }
    
    return review;
  }

  // Reward methods
  async getUserRewards(userId: number, limit = 20): Promise<RewardTransaction[]> {
    const snapshot = await this.rewardTransactionsCollection
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
      
    return snapshot.docs.map(doc => this.convertTimestamps<RewardTransaction>(doc.data()));
  }

  async createRewardTransaction(insertTransaction: InsertRewardTransaction): Promise<RewardTransaction> {
    // Get the highest ID to assign a new one
    const snapshot = await this.rewardTransactionsCollection.orderBy('id', 'desc').limit(1).get();
    const id = snapshot.empty ? 1 : snapshot.docs[0].data().id + 1;
    
    const transaction: RewardTransaction = { 
      ...insertTransaction, 
      id, 
      createdAt: new Date() 
    };
    
    await this.rewardTransactionsCollection.doc(id.toString()).set(transaction);
    
    // If redeeming points, update user's reward points balance
    if (transaction.transactionType === 'redeem') {
      const userRef = this.usersCollection.doc(transaction.userId.toString());
      await userRef.update({
        rewardPoints: FieldValue.increment(-transaction.points)
      });
    }
    
    return transaction;
  }

  // Admin analytics
  async getAnalytics(startDate: Date, endDate: Date): Promise<Analytics[]> {
    const snapshot = await this.analyticsCollection
      .where('date', '>=', startDate)
      .where('date', '<=', endDate)
      .orderBy('date', 'asc')
      .get();
      
    return snapshot.docs.map(doc => this.convertTimestamps<Analytics>(doc.data()));
  }

  async createOrUpdateAnalytics(insertAnalytics: InsertAnalytics): Promise<Analytics> {
    // Check if analytics for this date already exists
    const dateString = insertAnalytics.date.toISOString().split('T')[0];
    const snapshot = await this.analyticsCollection
      .where('date', '==', new Date(dateString))
      .limit(1)
      .get();
    
    if (!snapshot.empty) {
      const docRef = snapshot.docs[0].ref;
      const existingData = snapshot.docs[0].data();
      
      // Update existing analytics
      await docRef.update({
        bookingsCount: (existingData.bookingsCount || 0) + (insertAnalytics.bookingsCount || 0),
        revenue: (existingData.revenue || 0) + (insertAnalytics.revenue || 0),
        usersCount: insertAnalytics.usersCount || existingData.usersCount,
        propertiesCount: insertAnalytics.propertiesCount || existingData.propertiesCount
      });
      
      const updatedDoc = await docRef.get();
      return this.convertTimestamps<Analytics>(updatedDoc.data());
    } else {
      // Create new analytics entry
      const id = insertAnalytics.date.getTime(); // Use timestamp as ID
      const newAnalytics: Analytics = { ...insertAnalytics, id };
      
      await this.analyticsCollection.doc(id.toString()).set(newAnalytics);
      return newAnalytics;
    }
  }
}

// Export an instance of the storage
export const firestoreStorage = new FirestoreStorage();