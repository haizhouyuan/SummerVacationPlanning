const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/summer-vacation';

async function createDemoUsers() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('summer-vacation');
    const usersCollection = db.collection('users');
    
    // Check if demo users already exist
    const existingParent = await usersCollection.findOne({ email: 'parent@example.com' });
    const existingStudent = await usersCollection.findOne({ email: 'student@example.com' });
    
    if (existingParent && existingStudent) {
      console.log('Demo users already exist!');
      return;
    }
    
    // Hash passwords
    const hashedPassword = await bcrypt.hash('testpass123', 10);
    
    // Create parent user first
    const parentResult = await usersCollection.insertOne({
      email: 'parent@example.com',
      password: hashedPassword,
      displayName: '演示家长',
      role: 'parent',
      children: [], // Will be updated after student creation
      points: 150,
      currentStreak: 3,
      medals: {
        bronze: true,
        silver: false,
        gold: false,
        diamond: false
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log('Created parent user:', parentResult.insertedId);
    
    // Create student user
    const studentResult = await usersCollection.insertOne({
      email: 'student@example.com',
      password: hashedPassword,
      displayName: '演示学生',
      role: 'student',
      parentId: parentResult.insertedId.toString(),
      points: 150,
      currentStreak: 3,
      medals: {
        bronze: true,
        silver: false,
        gold: false,
        diamond: false
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log('Created student user:', studentResult.insertedId);
    
    // Update parent's children array
    await usersCollection.updateOne(
      { _id: parentResult.insertedId },
      { $set: { children: [studentResult.insertedId.toString()], updatedAt: new Date() }}
    );
    
    console.log('✅ Demo users created successfully!');
    console.log('Parent: parent@example.com / testpass123');
    console.log('Student: student@example.com / testpass123');
    
  } catch (error) {
    console.error('Error creating demo users:', error);
  } finally {
    await client.close();
  }
}

createDemoUsers().catch(console.error);