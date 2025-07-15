import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

export const auth = admin.auth();
export const firestore = admin.firestore();
export const storage = admin.storage();

// Firestore collection references
export const collections = {
  users: firestore.collection('users'),
  tasks: firestore.collection('tasks'),
  dailyTasks: firestore.collection('dailyTasks'),
  redemptions: firestore.collection('redemptions'),
  gameTimeExchanges: firestore.collection('gameTimeExchanges'),
  gameSessions: firestore.collection('gameSessions'),
};

export default admin;