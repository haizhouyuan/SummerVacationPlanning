import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from 'dotenv';

// Load environment variables
config();

// Initialize Firebase Admin SDK
admin.initializeApp();

// Create Express app
const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'https://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100') // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Import routes from backend
// Note: You'll need to copy your backend routes here or import them
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || '1.0.0'
  });
});

// Placeholder routes - replace with your actual routes
app.get('/api/tasks', (req, res) => {
  res.json({ message: 'Tasks endpoint' });
});

app.get('/api/users', (req, res) => {
  res.json({ message: 'Users endpoint' });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Export the Express app as a Firebase Function
export const api = functions
  .region(process.env.REGION || 'us-central1')
  .runWith({
    timeoutSeconds: parseInt(process.env.FUNCTION_TIMEOUT || '60'),
    memory: (process.env.FUNCTION_MEMORY || '512MB') as '128MB' | '256MB' | '512MB' | '1GB' | '2GB'
  })
  .https
  .onRequest(app);

// Additional Firebase Functions can be exported here
export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  // Handle new user creation
  console.log('New user created:', user.uid);
  
  // Create user document in Firestore
  await admin.firestore().collection('users').doc(user.uid).set({
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    role: 'student', // default role
    points: 0,
    isActive: true
  });
});

export const onUserDelete = functions.auth.user().onDelete(async (user) => {
  // Handle user deletion
  console.log('User deleted:', user.uid);
  
  // Clean up user data
  await admin.firestore().collection('users').doc(user.uid).delete();
});