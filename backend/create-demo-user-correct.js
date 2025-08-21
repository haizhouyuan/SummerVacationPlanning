const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function createDemoUserCorrect() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('summer_app'); // Use the correct database name
    const users = db.collection('users');
    const tasks = db.collection('tasks');
    
    // Check if demo user already exists
    const existingUser = await users.findOne({ email: 'demo@student.com' });
    if (existingUser) {
      console.log('Demo user already exists in summer_app');
      return;
    }
    
    // Create demo student user
    const hashedPassword = await bcrypt.hash('demo123', 10);
    
    const studentUser = {
      email: 'demo@student.com',
      password: hashedPassword,
      displayName: '小明同学',
      role: 'student',
      points: 120,
      currentStreak: 3,
      medals: {
        bronze: true,
        silver: false,
        gold: false,
        diamond: false
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await users.insertOne(studentUser);
    console.log('Demo student user created in summer_app:', result.insertedId);
    
    // Create a few demo tasks
    const demoTasks = [
      {
        title: '数学作业',
        description: '完成数学练习册第10页',
        category: 'learning',
        difficulty: 'medium',
        estimatedTime: 30,
        points: 15,
        requiresEvidence: true,
        evidenceTypes: ['text', 'photo'],
        tags: ['homework', 'math'],
        createdBy: 'system',
        isPublic: true,
        priority: 'medium',
        timePreference: 'afternoon',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: '英语阅读',
        description: '阅读英语故事书15分钟',
        category: 'reading',
        difficulty: 'easy',
        estimatedTime: 15,
        points: 10,
        requiresEvidence: true,
        evidenceTypes: ['text'],
        tags: ['reading', 'english'],
        createdBy: 'system',
        isPublic: true,
        priority: 'low',
        timePreference: 'morning',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: '户外运动',
        description: '在公园跑步或骑自行车30分钟',
        category: 'exercise',
        difficulty: 'medium',
        estimatedTime: 30,
        points: 20,
        requiresEvidence: true,
        evidenceTypes: ['photo'],
        tags: ['exercise', 'outdoor'],
        createdBy: 'system',
        isPublic: true,
        priority: 'high',
        timePreference: 'morning',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    const taskResults = await tasks.insertMany(demoTasks);
    console.log('Demo tasks created in summer_app:', taskResults.insertedIds);
    
  } catch (error) {
    console.error('Error creating demo user in summer_app:', error);
  } finally {
    await client.close();
  }
}

createDemoUserCorrect();