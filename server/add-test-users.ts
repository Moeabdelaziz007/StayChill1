import bcrypt from "bcryptjs";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

async function addTestUsers() {
  try {
    console.log("Adding test users to the database...");
    
    // The admin credentials from routes.ts
    const adminCredentials = [
      {
        email: 'admin@staychill.com',
        password: 'admin123',
        role: 'super_admin'
      },
      {
        email: 'property@staychill.com',
        password: 'property123',
        role: 'property_admin'
      },
      {
        email: 'amrikyy@gmail.com',
        password: 'amrikyy123',
        role: 'super_admin'
      }
    ];
    
    for (const admin of adminCredentials) {
      // Check if user already exists
      const existingUsers = await db
        .select()
        .from(users)
        .where(eq(users.email, admin.email));
      
      const existingUser = existingUsers[0];
      
      if (existingUser) {
        console.log(`User ${admin.email} already exists. Updating...`);
        
        // Hash the password
        const hashedPassword = await bcrypt.hash(admin.password, 10);
        
        // Update existing user
        const updateResult = await db
          .update(users)
          .set({
            password: hashedPassword,
            role: admin.role
          })
          .where(eq(users.email, admin.email))
          .returning();
        
        console.log(`Updated user ${admin.email}`, updateResult[0]?.id);
      } else {
        console.log(`Creating new user: ${admin.email}`);
        
        // Hash the password
        const hashedPassword = await bcrypt.hash(admin.password, 10);
        
        // Create username based on email
        const username = admin.email.split('@')[0];
        const firstName = username.charAt(0).toUpperCase() + username.slice(1);
        
        // Create new user
        const insertResult = await db
          .insert(users)
          .values({
            username: username,
            email: admin.email,
            password: hashedPassword,
            firstName: firstName,
            lastName: 'Admin',
            role: admin.role,
            rewardPoints: 0,
            createdAt: new Date()
          })
          .returning();
        
        console.log(`Created user ${admin.email}`, insertResult[0]?.id);
      }
    }
    
    console.log("Test users added successfully!");
  } catch (error) {
    console.error("Error adding test users:", error);
  }
}

// Run the function
addTestUsers().then(() => {
  console.log("Script completed");
  process.exit(0);
}).catch(err => {
  console.error("Script failed:", err);
  process.exit(1);
});