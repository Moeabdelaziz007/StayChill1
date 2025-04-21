import { db } from './db';
import { users } from '@shared/schema';
import { hashSync } from 'bcryptjs';
import { eq, ilike } from 'drizzle-orm';

async function addAmrikyyUser() {
  console.log('Adding amrikyy@gmail.com user as super_admin...');
  
  // Check if user already exists
  const existingUser = await db.select().from(users).where(
    eq(users.email, 'amrikyy@gmail.com')
  );
  
  if (existingUser.length > 0) {
    console.log('User amrikyy@gmail.com already exists, updating role to super_admin');
    // Update the role if the user exists
    await db.update(users)
      .set({ role: 'super_admin' })
      .where(eq(users.email, 'amrikyy@gmail.com'));
  } else {
    // Create the user if it doesn't exist
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
    console.log('User amrikyy@gmail.com added as super_admin');
  }
}

// Run the function
addAmrikyyUser()
  .then(() => {
    console.log('User update completed successfully');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error adding/updating amrikyy user:', err);
    process.exit(1);
  });