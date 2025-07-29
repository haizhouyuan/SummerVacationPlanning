const { MongoClient } = require('mongodb');

// Script to check existing indexes and suggest optimizations
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/summer_vacation_planning';

async function checkExistingIndexes() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('🔗 Connected to MongoDB');
    
    const db = client.db();
    
    console.log('🔍 Analyzing existing database indexes...\n');
    
    // Get list of all collections
    const collections = await db.listCollections().toArray();
    
    if (collections.length === 0) {
      console.log('📝 No collections found. Database appears to be empty.');
      console.log('🔧 Run the create-database-indexes.js script after adding some data.');
      return;
    }
    
    console.log(`📋 Found ${collections.length} collections:`);
    collections.forEach(col => console.log(`  - ${col.name}`));
    console.log('');
    
    // Analyze each collection
    for (const collection of collections) {
      const collectionName = collection.name;
      console.log(`🔍 Analyzing collection: ${collectionName}`);
      console.log('='.repeat(50));
      
      try {
        // Get existing indexes
        const indexes = await db.collection(collectionName).listIndexes().toArray();
        console.log(`📊 Current indexes (${indexes.length}):`);
        
        indexes.forEach((index, i) => {
          console.log(`  ${i + 1}. ${index.name}`);
          console.log(`     Key: ${JSON.stringify(index.key)}`);
          if (index.unique) console.log(`     Unique: true`);
          if (index.sparse) console.log(`     Sparse: true`);
          if (index.background) console.log(`     Background: true`);
        });
        
        // Get collection stats
        const stats = await db.collection(collectionName).stats();
        console.log(`📈 Collection stats:`);
        console.log(`   Documents: ${stats.count.toLocaleString()}`);
        console.log(`   Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   Average document size: ${Math.round(stats.avgObjSize)} bytes`);
        
        // Sample a few documents to understand structure
        const samples = await db.collection(collectionName).find().limit(3).toArray();
        if (samples.length > 0) {
          console.log(`🎯 Sample document structure:`);
          const sampleKeys = Object.keys(samples[0]).filter(key => key !== '_id');
          console.log(`   Fields: ${sampleKeys.join(', ')}`);
        }
        
        // Suggest optimizations based on collection name and structure
        console.log(`💡 Optimization suggestions:`);
        await suggestOptimizations(collectionName, indexes, samples);
        
      } catch (error) {
        console.log(`   ⚠️  Error analyzing ${collectionName}:`, error.message);
      }
      
      console.log('');
    }
    
    // Overall recommendations
    console.log('🎯 OVERALL RECOMMENDATIONS');
    console.log('='.repeat(50));
    console.log('📊 Critical indexes for performance:');
    console.log('   1. users.email (unique) - for authentication');
    console.log('   2. daily_tasks.userId + daily_tasks.date - for dashboard queries');
    console.log('   3. daily_tasks.userId + daily_tasks.status - for filtering');
    console.log('   4. tasks.isPublic + tasks.category - for task selection');
    console.log('   5. redemptions.userId + redemptions.requestedAt - for history');
    console.log('');
    console.log('🚀 Performance impact:');
    console.log('   - Proper indexes can improve query speed by 10-100x');
    console.log('   - Compound indexes should match query patterns');
    console.log('   - Regularly monitor slow queries and add indexes as needed');
    
  } catch (error) {
    console.error('❌ Error checking indexes:', error);
  } finally {
    await client.close();
    console.log('🔌 Database connection closed');
  }
}

async function suggestOptimizations(collectionName, existingIndexes, samples) {
  const existingIndexNames = existingIndexes.map(idx => idx.name);
  
  switch (collectionName) {
    case 'users':
      if (!existingIndexNames.some(name => name.includes('email'))) {
        console.log('   🔴 CRITICAL: Missing unique index on email field');
      }
      if (!existingIndexNames.some(name => name.includes('role'))) {
        console.log('   🟡 RECOMMENDED: Add index on role field for filtering');
      }
      if (!existingIndexNames.some(name => name.includes('points'))) {
        console.log('   🟡 RECOMMENDED: Add index on points field for leaderboards');
      }
      break;
      
    case 'tasks':
      if (!existingIndexNames.some(name => name.includes('isPublic'))) {
        console.log('   🟡 RECOMMENDED: Add compound index on isPublic + category');
      }
      if (!existingIndexNames.some(name => name.includes('difficulty'))) {
        console.log('   🟡 RECOMMENDED: Add index on difficulty for filtering');
      }
      break;
      
    case 'daily_tasks':
      if (!existingIndexNames.some(name => name.includes('userId'))) {
        console.log('   🔴 CRITICAL: Missing compound index on userId + date');
      }
      if (!existingIndexNames.some(name => name.includes('status'))) {
        console.log('   🟡 RECOMMENDED: Add compound index on userId + status');
      }
      break;
      
    case 'redemptions':
      if (!existingIndexNames.some(name => name.includes('userId'))) {
        console.log('   🟡 RECOMMENDED: Add compound index on userId + requestedAt');
      }
      if (!existingIndexNames.some(name => name.includes('status'))) {
        console.log('   🟡 RECOMMENDED: Add index on status for filtering');
      }
      break;
      
    case 'game_time_exchanges':
      if (!existingIndexNames.some(name => name.includes('userId'))) {
        console.log('   🟡 RECOMMENDED: Add compound index on userId + date');
      }
      break;
      
    default:
      console.log('   ✅ No specific recommendations for this collection');
  }
  
  // Generic recommendations
  if (existingIndexes.length <= 1) {  // Only _id index
    console.log('   🟡 Consider adding indexes based on your most common queries');
  }
}

// Run the analysis
if (require.main === module) {
  checkExistingIndexes()
    .then(() => {
      console.log('\n✅ Index analysis completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Analysis failed:', error);
      process.exit(1);
    });
}

module.exports = { checkExistingIndexes };