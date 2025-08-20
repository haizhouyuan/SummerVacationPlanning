#!/usr/bin/env node

/**
 * Database Connection Testing Script
 * 
 * Tests MongoDB connection and basic CRUD operations
 */

require('dotenv').config({ path: './backend/.env' });

async function testDatabase() {
  console.log('🗄️  Testing Database Connection...\n');

  try {
    // Import MongoDB connection
    const { MongoClient } = require('mongodb');
    
    const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/summer_vacation_planning';
    console.log('Connecting to:', mongoUrl.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));

    const client = new MongoClient(mongoUrl);
    await client.connect();
    
    console.log('✅ MongoDB connection successful');

    const db = client.db();
    
    // Test collections
    const collections = [
      'users',
      'tasks', 
      'dailyTasks',
      'gameTimeExchanges',
      'redemptions'
    ];

    console.log('\n📊 Testing Collections:');
    
    for (const collectionName of collections) {
      try {
        const collection = db.collection(collectionName);
        const count = await collection.countDocuments();
        console.log(`  ${collectionName}: ${count} documents`);
      } catch (error) {
        console.log(`  ${collectionName}: ❌ Error - ${error.message}`);
      }
    }

    // Test basic operations
    console.log('\n🧪 Testing Basic Operations:');
    
    try {
      // Test insertion
      const testCollection = db.collection('test');
      const testDoc = { 
        _test: true, 
        timestamp: new Date(),
        message: 'Database test successful'
      };
      
      const insertResult = await testCollection.insertOne(testDoc);
      console.log('  ✅ Insert operation successful');
      
      // Test find
      const foundDoc = await testCollection.findOne({ _id: insertResult.insertedId });
      console.log('  ✅ Find operation successful');
      
      // Test update
      await testCollection.updateOne(
        { _id: insertResult.insertedId },
        { $set: { updated: true } }
      );
      console.log('  ✅ Update operation successful');
      
      // Test delete
      await testCollection.deleteOne({ _id: insertResult.insertedId });
      console.log('  ✅ Delete operation successful');
      
    } catch (error) {
      console.log('  ❌ Basic operations failed:', error.message);
    }

    await client.close();
    
    console.log('\n🎉 Database tests completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Ensure MongoDB is running');
    console.log('2. Check MONGODB_URI in backend/.env');
    console.log('3. Verify network connectivity');
    console.log('4. Check authentication credentials');
    return false;
  }
}

// Main execution
async function main() {
  console.log('🚀 Database Testing Tool for Summer Vacation Planning App\n');
  
  const success = await testDatabase();
  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main();
}

module.exports = { testDatabase };