import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { collections } from '../config/mongodb';
import { User } from '../types';
import { generateToken } from '../utils/jwt';
import { AuthRequest } from '../middleware/mongoAuth';

export const register = async (req: Request, res: Response) => {
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
    const existingUser = await collections.users.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    let parentId: string | undefined;
    let parentDoc: any = null;

    // If registering a student, find the parent
    if (role === 'student') {
      if (!parentEmail) {
        return res.status(400).json({
          success: false,
          error: 'Parent email is required for student registration',
        });
      }

      // Find parent by email
      parentDoc = await collections.users.findOne({ 
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
      role: role as 'student' | 'parent',
      parentId,
      children: role === 'parent' ? [] : undefined,
      points: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collections.users.insertOne(userData);
    const userId = result.insertedId.toString();

    // If student, update parent's children array
    if (role === 'student' && parentDoc) {
      const updatedChildren = [...(parentDoc.children || []), userId];
      
      await collections.users.updateOne(
        { _id: parentDoc._id },
        { 
          $set: { 
            children: updatedChildren,
            updatedAt: new Date()
          }
        }
      );
    }

    // Create user object for response (without password)
    const userResponse: User = {
      id: userId,
      email,
      displayName,
      role: role as 'student' | 'parent',
      parentId,
      children: role === 'parent' ? [] : undefined,
      points: 0,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
    };

    // Generate JWT token
    const token = generateToken(userResponse);

    res.status(201).json({
      success: true,
      data: {
        user: userResponse,
        token,
      },
      message: 'User registered successfully',
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Registration failed',
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
    }

    // Find user by email
    const user = await collections.users.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Create user object for response (without password)
    const userResponse: User = {
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
    const token = generateToken(userResponse);
    
    res.status(200).json({
      success: true,
      data: {
        user: userResponse,
        token,
      },
      message: 'Login successful',
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Login failed',
    });
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
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
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get profile',
    });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { displayName, avatar } = req.body;

    const updates: any = { updatedAt: new Date() };

    if (displayName) updates.displayName = displayName;
    if (avatar) updates.avatar = avatar;

    await collections.users.updateOne(
      { _id: new ObjectId(req.user.id) },
      { $set: updates }
    );

    // Get updated user
    const updatedUser = await collections.users.findOne({ _id: new ObjectId(req.user.id) });

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const userResponse: User = {
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
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update profile',
    });
  }
}; 