const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/summer_app';

async function testDirectLogin() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const usersCollection = db.collection('users');
    
    // Get the user
    const user = await usersCollection.findOne({ email: 'student@example.com' });
    console.log('User found:', !!user);
    
    if (user) {
      console.log('User details:', {
        email: user.email,
        role: user.role,
        hasPassword: !!user.password,
        passwordLength: user.password.length
      });
      
      // Test password validation
      const testPassword = 'testpass123';
      const isValid = await bcrypt.compare(testPassword, user.password);
      console.log('Password validation result:', isValid);
      
      // Additional test with wrong password
      const wrongPassword = 'wrongpass';
      const isWrong = await bcrypt.compare(wrongPassword, user.password);
      console.log('Wrong password validation result:', isWrong);
    } else {
      console.log('User not found!');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

testDirectLogin().catch(console.error);