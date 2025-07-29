const { MongoClient } = require('mongodb');

// Test data for recommendation system
const MONGODB_URI = 'mongodb://localhost:27017/summer_vacation_planning';

async function testRecommendationSystem() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // Insert test user
    const testUser = {
      _id: 'test-user-123',
      email: 'student@test.com',
      displayName: 'Test Student',
      role: 'student',
      points: 150,
      currentStreak: 3,
      medals: { bronze: false, silver: false, gold: false, diamond: false },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await db.collection('users').replaceOne(
      { _id: testUser._id },
      testUser,
      { upsert: true }
    );
    
    // Insert test tasks
    const testTasks = [
      {
        _id: 'task-1',
        title: '阅读30分钟',
        description: '选择一本喜欢的书籍，专心阅读30分钟',
        category: 'reading',
        difficulty: 'easy',
        estimatedTime: 30,
        points: 20,
        requiresEvidence: true,
        evidenceTypes: ['text', 'photo'],
        tags: ['reading', 'books'],
        createdBy: 'system',
        isPublic: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'task-2',
        title: '做数学练习题',
        description: '完成10道数学题目',
        category: 'learning',
        difficulty: 'medium',
        estimatedTime: 45,
        points: 30,
        requiresEvidence: true,
        evidenceTypes: ['photo'],
        tags: ['math', 'homework'],
        createdBy: 'system',
        isPublic: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'task-3',
        title: '跑步锻炼',
        description: '在小区或公园跑步20分钟',
        category: 'exercise',
        difficulty: 'easy',
        estimatedTime: 20,
        points: 25,
        requiresEvidence: true,
        evidenceTypes: ['photo'],
        tags: ['running', 'fitness'],
        createdBy: 'system',
        isPublic: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    for (const task of testTasks) {
      await db.collection('tasks').replaceOne(
        { _id: task._id },
        task,
        { upsert: true }
      );
    }
    
    // Insert some daily task history
    const dailyTasks = [
      {
        _id: 'daily-1',
        userId: testUser._id,
        taskId: 'task-1',
        date: '2025-07-27',
        status: 'completed',
        pointsEarned: 20,
        completedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'daily-2',
        userId: testUser._id,
        taskId: 'task-1',
        date: '2025-07-26',
        status: 'completed',
        pointsEarned: 20,
        completedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    for (const dailyTask of dailyTasks) {
      await db.collection('daily_tasks').replaceOne(
        { _id: dailyTask._id },
        dailyTask,
        { upsert: true }
      );
    }
    
    console.log('Test data inserted successfully');
    
    // Test the recommendation algorithm
    console.log('\n=== Testing Recommendation Algorithm ===');
    
    // Simulate the recommendation service logic
    const userId = testUser._id;
    const limit = 3;
    
    // Get user's daily task history
    const userHistory = await db.collection('daily_tasks')
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();
    
    console.log(`Found ${userHistory.length} daily tasks in user history`);
    
    // Get all available tasks
    const availableTasks = await db.collection('tasks')
      .find({ isPublic: true })
      .toArray();
    
    console.log(`Found ${availableTasks.length} available tasks`);
    
    // Calculate user preferences
    const categoryStats = {};
    const difficultyStats = {};
    let totalCompleted = 0;
    let totalPoints = 0;
    
    userHistory.forEach(dailyTask => {
      if (dailyTask.status === 'completed') {
        totalCompleted++;
        totalPoints += dailyTask.pointsEarned || 0;
        
        // Find the task details
        const task = availableTasks.find(t => t._id === dailyTask.taskId);
        if (task) {
          categoryStats[task.category] = (categoryStats[task.category] || 0) + 1;
          difficultyStats[task.difficulty] = (difficultyStats[task.difficulty] || 0) + 1;
        }
      }
    });
    
    console.log('User preferences:');
    console.log('- Categories:', categoryStats);
    console.log('- Difficulties:', difficultyStats);
    console.log('- Total completed:', totalCompleted);
    console.log('- Average points per task:', totalCompleted > 0 ? (totalPoints / totalCompleted).toFixed(1) : 0);
    
    // Generate recommendations
    const recommendations = availableTasks.map(task => {
      let score = 0;
      let reasons = [];
      
      // Category preference scoring
      const categoryCount = categoryStats[task.category] || 0;
      const categoryScore = Math.min(categoryCount / Math.max(totalCompleted, 1), 0.3);
      score += categoryScore;
      if (categoryCount > 0) {
        reasons.push(`您已完成${categoryCount}个${task.category}类任务`);
      }
      
      // Difficulty matching
      const preferredDifficulty = Object.keys(difficultyStats).reduce((a, b) => 
        difficultyStats[a] > difficultyStats[b] ? a : b, 'easy');
      if (task.difficulty === preferredDifficulty) {
        score += 0.25;
        reasons.push(`难度适合您的水平(${task.difficulty})`);
      }
      
      // Points range preference
      const avgPoints = totalCompleted > 0 ? totalPoints / totalCompleted : 20;
      const pointsDiff = Math.abs(task.points - avgPoints);
      const pointsScore = Math.max(0, 0.15 - (pointsDiff / 100));
      score += pointsScore;
      
      // Add some randomness for novelty
      score += Math.random() * 0.05;
      
      if (reasons.length === 0) {
        reasons.push('新的挑战等待您去尝试');
      }
      
      return {
        task,
        score,
        reason: reasons.join('，') + '。'
      };
    }).sort((a, b) => b.score - a.score).slice(0, limit);
    
    console.log('\n=== Generated Recommendations ===');
    recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec.task.title}`);
      console.log(`   Score: ${rec.score.toFixed(3)}`);
      console.log(`   Reason: ${rec.reason}`);
      console.log(`   Category: ${rec.task.category}, Difficulty: ${rec.task.difficulty}, Points: ${rec.task.points}`);
      console.log('');
    });
    
    console.log('✅ Recommendation system test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await client.close();
  }
}

// Run the test
testRecommendationSystem();