"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireParentOrSelf = exports.requireRole = exports.authenticateToken = void 0;
const mongodb_1 = require("../config/mongodb");
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Access token is required',
            });
        }
        // Verify Firebase token
        const decodedToken = await auth.verifyIdToken(token);
        const uid = decodedToken.uid;
        // Get user data from Firestore
        const userDoc = await mongodb_1.collections.users.doc(uid).get();
        if (!userDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }
        const userData = userDoc.data();
        req.user = { ...userData, id: uid };
        next();
    }
    catch (error) {
        console.error('Authentication error:', error);
        return res.status(403).json({
            success: false,
            error: 'Invalid or expired token',
        });
    }
};
exports.authenticateToken = authenticateToken;
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated',
            });
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: 'Insufficient permissions',
            });
        }
        next();
    };
};
exports.requireRole = requireRole;
const requireParentOrSelf = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'User not authenticated',
        });
    }
    const targetUserId = req.params.userId || req.body.userId;
    // Allow if user is accessing their own data
    if (req.user.id === targetUserId) {
        return next();
    }
    // Allow if user is a parent accessing their child's data
    if (req.user.role === 'parent' && req.user.children?.includes(targetUserId)) {
        return next();
    }
    return res.status(403).json({
        success: false,
        error: 'Access denied',
    });
};
exports.requireParentOrSelf = requireParentOrSelf;
//# sourceMappingURL=auth.js.map