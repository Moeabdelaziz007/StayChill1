import { db } from './db';
import { properties, users } from '@shared/schema';
import { hashSync } from 'bcryptjs';
import { eq } from 'drizzle-orm';

// Sample property data seeder
export async function seedDatabase() {
  console.log('Checking if seed data is needed...');
  
  // Check if we already have data
  const existingUsers = await db.select().from(users);
  const existingProperties = await db.select().from(properties);
  
  if (existingUsers.length === 0) {
    console.log('Seeding users...');
    
    // Create admin user
    await db.insert(users).values({
      username: 'admin',
      email: 'admin@staychill.com',
      password: hashSync('admin123', 10),
      firstName: 'Admin',
      lastName: 'User',
      role: 'super_admin',
      rewardPoints: 0,
      createdAt: new Date()
    });
    
    // Create property admin user
    await db.insert(users).values({
      username: 'propadmin',
      email: 'property@staychill.com',
      password: hashSync('property123', 10),
      firstName: 'Property',
      lastName: 'Admin',
      role: 'property_admin',
      rewardPoints: 0,
      createdAt: new Date()
    });
    
    // Create regular user
    await db.insert(users).values({
      username: 'user',
      email: 'user@staychill.com',
      password: hashSync('user123', 10),
      firstName: 'Regular',
      lastName: 'User',
      role: 'user',
      rewardPoints: 100,
      createdAt: new Date()
    });
    
    // Create owner admin account (Amrikyy)
    await db.insert(users).values({
      username: 'amrikyy',
      email: 'amrikyy@gmail.com',
      password: hashSync('Hamood112', 10),
      firstName: 'Hamood',
      lastName: 'Ahmed',
      role: 'super_admin',
      rewardPoints: 0,
      createdAt: new Date()
    });
    
    console.log('Users seeded successfully!');
  }
  
  if (existingProperties.length === 0) {
    console.log('Seeding properties...');
    
    // Get the property admin user
    const [propertyAdmin] = await db.select().from(users).where(
      eq(users.role, 'property_admin')
    );
    
    if (!propertyAdmin) {
      console.log('Property admin user not found. Skipping property seeding.');
      return;
    }
    
    // Egyptian locations
    const locations = [
      'Ras El Hekma',
      'Sharm El Sheikh',
      'El Sahel',
      'Marina',
      'Marsa Matrouh'
    ];
    
    // Sample property data
    const propertyData = [
      {
        title: 'Beachfront Villa with Pool',
        description: 'A gorgeous beachfront villa with private pool and direct beach access. Perfect for families and friends.',
        location: locations[0],
        address: '123 Beachfront Drive, Ras El Hekma',
        price: 5000,
        beds: 4,
        baths: 3,
        guests: 8,
        images: [
          'https://images.unsplash.com/photo-1613977257365-aaae5a9817ff?q=80&w=1470&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1613977257592-4a9a32f9734e?q=80&w=1470&auto=format&fit=crop'
        ],
        amenities: ['Pool', 'Beach Access', 'WiFi', 'Air Conditioning', 'Kitchen'],
        rating: 4.9,
        reviewsCount: 15,
        userId: propertyAdmin.id,
        featured: true,
        active: true
      },
      {
        title: 'Luxury Seaside Apartment',
        description: 'Stunning seaside apartment with panoramic views of the Mediterranean Sea. Modern amenities and stylish decor.',
        location: locations[1],
        address: '45 Marina Blvd, Sharm El Sheikh',
        price: 2500,
        beds: 2,
        baths: 2,
        guests: 4,
        images: [
          'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?q=80&w=1470&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1561501878-aabd62634533?q=80&w=1470&auto=format&fit=crop'
        ],
        amenities: ['Sea View', 'WiFi', 'Air Conditioning', 'Kitchen', 'Gym Access'],
        rating: 4.7,
        reviewsCount: 23,
        userId: propertyAdmin.id,
        featured: true,
        active: true
      },
      {
        title: 'Cozy Beach Bungalow',
        description: 'Charming beach bungalow steps away from the crystal clear waters. Ideal for couples seeking a romantic getaway.',
        location: locations[2],
        address: '78 Sahel Road, El Sahel',
        price: 1800,
        beds: 1,
        baths: 1,
        guests: 2,
        images: [
          'https://images.unsplash.com/photo-1540541338287-41700207dee6?q=80&w=1470&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1470&auto=format&fit=crop'
        ],
        amenities: ['Beach Access', 'WiFi', 'Air Conditioning', 'Breakfast', 'Private Deck'],
        rating: 4.8,
        reviewsCount: 18,
        userId: propertyAdmin.id,
        featured: false,
        active: true
      },
      {
        title: 'Luxurious Marina Penthouse',
        description: 'Exclusive penthouse with breathtaking views of the marina. High-end finishes and premium amenities.',
        location: locations[3],
        address: '12 Yacht Club Road, Marina',
        price: 6000,
        beds: 3,
        baths: 3,
        guests: 6,
        images: [
          'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?q=80&w=1470&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1600607687644-c7531e899ca9?q=80&w=1470&auto=format&fit=crop'
        ],
        amenities: ['Marina View', 'Pool', 'Jacuzzi', 'WiFi', 'Air Conditioning', 'Concierge'],
        rating: 5.0,
        reviewsCount: 10,
        userId: propertyAdmin.id,
        featured: true,
        active: true
      },
      {
        title: 'Charming Seafront Cottage',
        description: 'Traditional Egyptian seafront cottage with modern amenities. Experience authentic coastal living.',
        location: locations[4],
        address: '56 Coastal Highway, Marsa Matrouh',
        price: 2200,
        beds: 2,
        baths: 1,
        guests: 4,
        images: [
          'https://images.unsplash.com/photo-1587061949409-02df41d5e562?q=80&w=1470&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1595877244574-e90ce41ce089?q=80&w=1470&auto=format&fit=crop'
        ],
        amenities: ['Beach Access', 'Terrace', 'WiFi', 'Air Conditioning', 'Outdoor Grill'],
        rating: 4.6,
        reviewsCount: 12,
        userId: propertyAdmin.id,
        featured: false,
        active: true
      },
      {
        title: 'Modern Beach House',
        description: 'Contemporary beach house with sleek design and open floor plan. Perfect for enjoying sunsets over the sea.',
        location: locations[0],
        address: '34 Sunset Drive, Ras El Hekma',
        price: 4200,
        beds: 3,
        baths: 2,
        guests: 6,
        images: [
          'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=1074&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?q=80&w=1470&auto=format&fit=crop'
        ],
        amenities: ['Beach Access', 'WiFi', 'Smart Home', 'Air Conditioning', 'Outdoor Shower'],
        rating: 4.8,
        reviewsCount: 9,
        userId: propertyAdmin.id,
        featured: true,
        active: true
      }
    ];
    
    // Insert properties
    for (const property of propertyData) {
      await db.insert(properties).values({
        ...property,
        createdAt: new Date()
      });
    }
    
    console.log('Properties seeded successfully!');
  } else {
    console.log(`Database already has ${existingProperties.length} properties. Skipping seed.`);
  }
}