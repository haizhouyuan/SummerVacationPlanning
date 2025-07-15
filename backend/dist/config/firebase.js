"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.collections = exports.storage = exports.firestore = exports.auth = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
// Initialize Firebase Admin SDK
if (!firebase_admin_1.default.apps.length) {
    const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    };
    firebase_admin_1.default.initializeApp({
        credential: firebase_admin_1.default.credential.cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
}
exports.auth = firebase_admin_1.default.auth();
exports.firestore = firebase_admin_1.default.firestore();
exports.storage = firebase_admin_1.default.storage();
// Firestore collection references
exports.collections = {
    users: exports.firestore.collection('users'),
    tasks: exports.firestore.collection('tasks'),
    dailyTasks: exports.firestore.collection('dailyTasks'),
    redemptions: exports.firestore.collection('redemptions'),
    gameTimeExchanges: exports.firestore.collection('gameTimeExchanges'),
    gameSessions: exports.firestore.collection('gameSessions'),
};
exports.default = firebase_admin_1.default;
//# sourceMappingURL=firebase.js.map