const { MongoClient } = require('mongodb');

// Activity mapping based on task titles and categories
const getActivityFromTask = (title, category) => {
  const lowerTitle = title.toLowerCase();
  
  // Check specific keywords in title
  if (lowerTitle.includes('日记')) return 'diary';
  if (lowerTitle.includes('数学')) return 'math_video';
  if (lowerTitle.includes('奥数')) return 'olympiad_problem';
  if (lowerTitle.includes('编程')) return 'programming_game';
  if (lowerTitle.includes('音乐')) return 'music_practice';
  if (lowerTitle.includes('运动')) return 'general_exercise';
  if (lowerTitle.includes('家务')) return 'chores';
  
  // Fall back to category-based mapping
  switch (category) {
    case 'exercise':
      return 'general_exercise';
    case 'reading':
      return 'reading_general';
    case 'chores':
      return 'chores';
    case 'learning':
      return 'learning_general';
    case 'creativity':
      return 'creativity_general';
    default:
      return 'general';
  }
};

async function migrateTaskActivity() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/summer-vacation');
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const tasksCollection = db.collection('tasks');
    
    // Find all tasks without activity field
    const tasksWithoutActivity = await tasksCollection.find({ 
      activity: { $exists: false } 
    }).toArray();
    
    console.log(`Found ${tasksWithoutActivity.length} tasks without activity field`);
    
    let updated = 0;
    
    for (const task of tasksWithoutActivity) {
      const activity = getActivityFromTask(task.title, task.category);
      
      await tasksCollection.updateOne(
        { _id: task._id },
        { 
          $set: { 
            activity: activity,
            updatedAt: new Date()
          } 
        }
      );
      
      console.log(`Updated task "${task.title}" with activity: ${activity}`);
      updated++;
    }
    
    console.log(`Successfully updated ${updated} tasks with activity field`);
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateTaskActivity().then(() => {
    console.log('Migration completed');
    process.exit(0);
  });
}

module.exports = { migrateTaskActivity };