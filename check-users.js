const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/summer-vacation';

async function checkUsers() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('summer-vacation');
    const usersCollection = db.collection('users');
    
    const users = await usersCollection.find({}).toArray();
    console.log(`Found ${users.length} users:`);
    
    users.forEach(user => {
      console.log(`- ${user.email} (${user.role}) - ID: ${user._id}`);
    });
    
    // Test login with known email
    const testUser = await usersCollection.findOne({ email: 'student@example.com' });
    if (testUser) {
      console.log('\nTest user found:', {
        email: testUser.email,
        displayName: testUser.displayName,
        role: testUser.role,
        hasPassword: !!testUser.password
      });
    } else {
      console.log('\nTest user not found!');
    }
    
  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    await client.close();
  }
}

checkUsers().catch(console.error);