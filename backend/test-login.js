const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function testLogin() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('vacation_planning');
    const users = db.collection('users');
    
    const user = await users.findOne({ email: 'demo@student.com' });
    
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log('User found:', user.email);
    console.log('Stored password hash:', user.password);
    
    const testPassword = 'demo123';
    const isMatch = await bcrypt.compare(testPassword, user.password);
    
    console.log('Password test result:', isMatch);
    
    // Also test creating a new hash to compare
    const newHash = await bcrypt.hash(testPassword, 10);
    console.log('New hash for same password:', newHash);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

testLogin();