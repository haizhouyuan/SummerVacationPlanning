// Test setup file for Jest
import { MongoMemoryServer } from 'mongodb-memory-server';
import { mongodb, collections } from '../config/mongodb';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  // Start in-memory MongoDB instance for testing
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  
  // Connect to the in-memory database
  await mongodb.connect(uri);
});

afterAll(async () => {
  // Clean up connections
  if (mongodb.client) {
    await mongodb.client.close();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  // Clean up collections before each test
  if (collections.users) await collections.users.deleteMany({});
  if (collections.tasks) await collections.tasks.deleteMany({});
  if (collections.dailyTasks) await collections.dailyTasks.deleteMany({});
  if (collections.pointsRules) await collections.pointsRules.deleteMany({});
  if (collections.userPointsLimits) await collections.userPointsLimits.deleteMany({});
});