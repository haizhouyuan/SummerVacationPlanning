"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireParentOrSelf = exports.requireRole = exports.authenticateToken = void 0;
const mongodb_1 = require("mongodb");
const mongodb_2 = require("../config/mongodb");
const jwt_1 = require("../utils/jwt");
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
        // Verify JWT token
        const decoded = (0, jwt_1.verifyToken)(token);
        const userId = decoded.id;
        // Get user data from MongoDB
        const user = await mongodb_2.collections.users.findOne({ _id: new mongodb_1.ObjectId(userId) });
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }
        // Convert MongoDB _id to id for consistency
        const { _id, ...userWithoutId } = user;
        const userWithId = { ...userWithoutId, id: _id.toString() };
        req.user = userWithId;
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
//# sourceMappingURL=mongoAuth.js.map