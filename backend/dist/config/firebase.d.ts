import admin from 'firebase-admin';
export declare const auth: import("firebase-admin/lib/auth/auth").Auth;
export declare const firestore: admin.firestore.Firestore;
export declare const storage: import("firebase-admin/lib/storage/storage").Storage;
export declare const collections: {
    users: admin.firestore.CollectionReference<admin.firestore.DocumentData, admin.firestore.DocumentData>;
    tasks: admin.firestore.CollectionReference<admin.firestore.DocumentData, admin.firestore.DocumentData>;
    dailyTasks: admin.firestore.CollectionReference<admin.firestore.DocumentData, admin.firestore.DocumentData>;
    redemptions: admin.firestore.CollectionReference<admin.firestore.DocumentData, admin.firestore.DocumentData>;
    gameTimeExchanges: admin.firestore.CollectionReference<admin.firestore.DocumentData, admin.firestore.DocumentData>;
    gameSessions: admin.firestore.CollectionReference<admin.firestore.DocumentData, admin.firestore.DocumentData>;
};
export default admin;
//# sourceMappingURL=firebase.d.ts.map