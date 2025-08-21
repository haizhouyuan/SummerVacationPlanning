const { MongoClient } = require('mongodb');

async function checkUsers() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('vacation_planning');
    const users = db.collection('users');
    
    const allUsers = await users.find({}).toArray();
    console.log('Total users in database:', allUsers.length);
    
    allUsers.forEach((user, index) => {
      console.log(`\nUser ${index + 1}:`);
      console.log('Email:', user.email);
      console.log('Display Name:', user.displayName);
      console.log('Role:', user.role);
      console.log('Has password:', !!user.password);
      console.log('Password length:', user.password ? user.password.length : 0);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkUsers();