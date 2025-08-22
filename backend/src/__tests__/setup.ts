// Test setup file for Jest
import { MongoMemoryServer } from 'mongodb-memory-server';
import { mongodb, collections } from '../config/mongodb';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  // Start in-memory MongoDB instance for testing
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  
  // Set the test MongoDB URI
  process.env.MONGODB_URI = uri;
  
  // Connect to the in-memory database
  await mongodb.connect();
});

afterAll(async () => {
  // Clean up connections
  await mongodb.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  // Clean up collections before each test
  try {
    const cols = mongodb.collections;
    if (cols.users) await cols.users.deleteMany({});
    if (cols.tasks) await cols.tasks.deleteMany({});
    if (cols.dailyTasks) await cols.dailyTasks.deleteMany({});
    if (cols.pointsRules) await cols.pointsRules.deleteMany({});
    if (cols.userPointsLimits) await cols.userPointsLimits.deleteMany({});
  } catch (error: any) {
    // Collections might not be initialized yet, ignore for simple tests
    console.log('Collections cleanup skipped:', error.message);
  }
});