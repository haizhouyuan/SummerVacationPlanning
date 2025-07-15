"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.getProfile = exports.login = exports.register = void 0;
const mongodb_1 = require("mongodb");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const mongodb_2 = require("../config/mongodb");
const jwt_1 = require("../utils/jwt");
const register = async (req, res) => {
    try {
        const { email, password, displayName, role, parentEmail } = req.body;
        // Validate required fields
        if (!email || !password || !displayName || !role) {
            return res.status(400).json({
                success: false,
                error: 'Email, password, display name, and role are required',
            });
        }
        if (!['student', 'parent'].includes(role)) {
            return res.status(400).json({
                success: false,
                error: 'Role must be either student or parent',
            });
        }
        // Check if user already exists
        const existingUser = await mongodb_2.collections.users.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'User with this email already exists',
            });
        }
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        let parentId;
        let parentDoc = null;
        // If registering a student, find the parent
        if (role === 'student') {
            if (!parentEmail) {
                return res.status(400).json({
                    success: false,
                    error: 'Parent email is required for student registration',
                });
            }
            // Find parent by email
            parentDoc = await mongodb_2.collections.users.findOne({
                email: parentEmail,
                role: 'parent'
            });
            if (!parentDoc) {
                return res.status(404).json({
                    success: false,
                    error: 'Parent not found with the provided email',
                });
            }
            parentId = parentDoc._id.toString();
        }
        // Create user document
        const userData = {
            email,
            password: hashedPassword,
            displayName,
            role: role,
            parentId,
            children: role === 'parent' ? [] : undefined,
            points: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        const result = await mongodb_2.collections.users.insertOne(userData);
        const userId = result.insertedId.toString();
        // If student, update parent's children array
        if (role === 'student' && parentDoc) {
            const updatedChildren = [...(parentDoc.children || []), userId];
            await mongodb_2.collections.users.updateOne({ _id: parentDoc._id }, {
                $set: {
                    children: updatedChildren,
                    updatedAt: new Date()
                }
            });
        }
        // Create user object for response (without password)
        const userResponse = {
            id: userId,
            email,
            displayName,
            role: role,
            parentId,
            children: role === 'parent' ? [] : undefined,
            points: 0,
            createdAt: userData.createdAt,
            updatedAt: userData.updatedAt,
        };
        // Generate JWT token
        const token = (0, jwt_1.generateToken)(userResponse);
        res.status(201).json({
            success: true,
            data: {
                user: userResponse,
                token,
            },
            message: 'User registered successfully',
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Registration failed',
        });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email and password are required',
            });
        }
        // Find user by email
        const user = await mongodb_2.collections.users.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials',
            });
        }
        // Check password
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials',
            });
        }
        // Create user object for response (without password)
        const userResponse = {
            id: user._id.toString(),
            email: user.email,
            displayName: user.displayName,
            role: user.role,
            parentId: user.parentId,
            children: user.children,
            points: user.points,
            avatar: user.avatar,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
        // Generate JWT token
        const token = (0, jwt_1.generateToken)(userResponse);
        res.status(200).json({
            success: true,
            data: {
                user: userResponse,
                token,
            },
            message: 'Login successful',
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Login failed',
        });
    }
};
exports.login = login;
const getProfile = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated',
            });
        }
        res.status(200).json({
            success: true,
            data: { user: req.user },
            message: 'Profile retrieved successfully',
        });
    }
    catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to get profile',
        });
    }
};
exports.getProfile = getProfile;
const updateProfile = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated',
            });
        }
        const { displayName, avatar } = req.body;
        const updates = { updatedAt: new Date() };
        if (displayName)
            updates.displayName = displayName;
        if (avatar)
            updates.avatar = avatar;
        await mongodb_2.collections.users.updateOne({ _id: new mongodb_1.ObjectId(req.user.id) }, { $set: updates });
        // Get updated user
        const updatedUser = await mongodb_2.collections.users.findOne({ _id: new mongodb_1.ObjectId(req.user.id) });
        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }
        const userResponse = {
            id: updatedUser._id.toString(),
            email: updatedUser.email,
            displayName: updatedUser.displayName,
            role: updatedUser.role,
            parentId: updatedUser.parentId,
            children: updatedUser.children,
            points: updatedUser.points,
            avatar: updatedUser.avatar,
            createdAt: updatedUser.createdAt,
            updatedAt: updatedUser.updatedAt,
        };
        res.status(200).json({
            success: true,
            data: { user: userResponse },
            message: 'Profile updated successfully',
        });
    }
    catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to update profile',
        });
    }
};
exports.updateProfile = updateProfile;
//# sourceMappingURL=mongoAuthController.js.map