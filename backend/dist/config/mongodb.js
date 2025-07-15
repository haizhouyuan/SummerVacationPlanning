"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeCollections = exports.collections = exports.mongodb = void 0;
const mongodb_1 = require("mongodb");
class MongoDB {
    constructor() {
        const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/summer_app';
        this.client = new mongodb_1.MongoClient(mongoUri);
    }
    async connect() {
        try {
            await this.client.connect();
            this.db = this.client.db();
            console.log('✅ Connected to MongoDB');
        }
        catch (error) {
            console.error('❌ MongoDB connection error:', error);
            throw error;
        }
    }
    async disconnect() {
        await this.client.close();
    }
    get collections() {
        if (!this.db) {
            throw new Error('Database not connected. Call connect() first.');
        }
        return {
            users: this.db.collection('users'),
            tasks: this.db.collection('tasks'),
            dailyTasks: this.db.collection('dailyTasks'),
            redemptions: this.db.collection('redemptions'),
            gameTimeExchanges: this.db.collection('gameTimeExchanges'),
            gameSessions: this.db.collection('gameSessions'),
        };
    }
}
exports.mongodb = new MongoDB();
const initializeCollections = () => {
    exports.collections = exports.mongodb.collections;
};
exports.initializeCollections = initializeCollections;
//# sourceMappingURL=mongodb.js.map