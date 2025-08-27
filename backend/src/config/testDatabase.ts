import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer: MongoMemoryServer;

/**
 * 设置测试数据库环境
 * 使用内存MongoDB服务器进行测试
 */
export const setupTestDatabase = async (): Promise<void> => {
  try {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // 设置环境变量
    process.env.MONGODB_URI = mongoUri;
    
    // 连接到测试数据库
    await mongoose.connect(mongoUri);
    console.log('✅ Test database connected successfully');
  } catch (error) {
    console.error('❌ Failed to setup test database:', error);
    throw error;
  }
};

/**
 * 清理测试数据库环境
 */
export const teardownTestDatabase = async (): Promise<void> => {
  try {
    // 断开Mongoose连接
    await mongoose.disconnect();
    
    // 停止内存服务器
    if (mongoServer) {
      await mongoServer.stop();
    }
    
    console.log('✅ Test database teardown completed');
  } catch (error) {
    console.error('❌ Failed to teardown test database:', error);
    throw error;
  }
};

/**
 * 获取测试数据库连接URI
 */
export const getTestDatabaseUri = (): string => {
  if (!mongoServer) {
    throw new Error('Test database not initialized. Call setupTestDatabase first.');
  }
  return mongoServer.getUri();
};

/**
 * 清除所有测试数据
 */
export const clearTestDatabase = async (): Promise<void> => {
  try {
    const collections = mongoose.connection.collections;
    
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
    
    console.log('✅ Test database cleared');
  } catch (error) {
    console.error('❌ Failed to clear test database:', error);
    throw error;
  }
};