import { Response } from 'express';
import { collections, mongodb } from '../config/mongodb';
import { Redemption } from '../types';
import { AuthRequest } from '../middleware/mongoAuth';
import { ObjectId } from 'mongodb';

export const createRedemption = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { rewardTitle, rewardDescription, pointsCost, notes } = req.body;

    // Validate required fields
    if (!rewardTitle || !pointsCost) {
      return res.status(400).json({
        success: false,
        error: 'Reward title and points cost are required',
      });
    }

    // Check if user has enough points
    if (req.user.points < pointsCost) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient points for this reward',
      });
    }

    // Use transaction to freeze points atomically
    const session = mongodb['client'].startSession();
    try {
      let redemption: any;
      
      await session.withTransaction(async () => {
        // Create redemption record
        const redemptionData: Omit<Redemption, 'id'> = {
          userId: req.user!.id,
          rewardTitle,
          rewardDescription: rewardDescription || '',
          pointsCost,
          status: 'pending',
          requestedAt: new Date(),
          notes,
        };

        const result = await collections.redemptions.insertOne(redemptionData, { session });
        
        // Freeze points by deducting from user account
        await collections.users.updateOne(
          { _id: new ObjectId(req.user!.id) },
          { 
            $inc: { points: -pointsCost },
            $set: { updatedAt: new Date() }
          },
          { session }
        );

        redemption = { ...redemptionData, id: result.insertedId.toString() };
      });

      res.status(201).json({
        success: true,
        data: { redemption },
        message: 'Redemption request created successfully. Points have been frozen pending approval.',
      });
    } finally {
      await session.endSession();
    }
  } catch (error: any) {
    console.error('Create redemption error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create redemption request',
    });
  }
};

export const getRedemptions = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { userId, status } = req.query;
    const targetUserId = userId as string || req.user.id;

    // Check if user can access the requested user's data
    if (targetUserId !== req.user.id) {
      if (req.user.role !== 'parent' || !req.user.children?.includes(targetUserId)) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
        });
      }
    }

    let filter: any = { userId: targetUserId };
    
    if (status) {
      filter.status = status;
    }

    const redemptions = await collections.redemptions.find(filter).toArray();
    const mappedRedemptions = redemptions.map((redemption: any) => ({
      ...redemption,
      id: redemption._id.toString(),
    }));

    res.status(200).json({
      success: true,
      data: { redemptions: mappedRedemptions },
    });
  } catch (error: any) {
    console.error('Get redemptions error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get redemptions',
    });
  }
};

export const updateRedemptionStatus = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { redemptionId } = req.params;
    const { status, notes } = req.body;

    const redemption = await collections.redemptions.findOne({ _id: new ObjectId(redemptionId) });
    if (!redemption) {
      return res.status(404).json({
        success: false,
        error: 'Redemption not found',
      });
    }

    // Check if user can update this redemption
    if (req.user.role !== 'parent') {
      return res.status(403).json({
        success: false,
        error: 'Only parents can update redemption status',
      });
    }

    // Check if parent is authorized to approve this child's redemption
    const childUser = await collections.users.findOne({ _id: new ObjectId(redemption.userId) });
    if (!childUser || !req.user.children?.includes(redemption.userId)) {
      return res.status(403).json({
        success: false,
        error: 'You can only approve redemptions for your own children',
      });
    }

    const updates: any = {
      status,
      processedAt: new Date(),
      processedBy: req.user.id,
      updatedAt: new Date(),
    };

    if (notes) {
      updates.notes = notes;
    }

    // Use transaction to handle points and status update atomically
    const session = mongodb['client'].startSession();
    try {
      await session.withTransaction(async () => {
        // If rejecting pending redemption, refund frozen points
        if (status === 'rejected' && redemption.status === 'pending') {
          await collections.users.updateOne(
            { _id: new ObjectId(redemption.userId) },
            { 
              $inc: { points: redemption.pointsCost },
              $set: { updatedAt: new Date() }
            },
            { session }
          );
        }
        // If approving, points are already frozen - no action needed
        // If changing from approved to rejected, refund points
        else if (status === 'rejected' && redemption.status === 'approved') {
          await collections.users.updateOne(
            { _id: new ObjectId(redemption.userId) },
            { 
              $inc: { points: redemption.pointsCost },
              $set: { updatedAt: new Date() }
            },
            { session }
          );
        }
        // If changing from rejected back to approved, re-freeze points
        else if (status === 'approved' && redemption.status === 'rejected') {
          const currentUser = await collections.users.findOne(
            { _id: new ObjectId(redemption.userId) },
            { session }
          );
          
          if (!currentUser || currentUser.points < redemption.pointsCost) {
            throw new Error('User no longer has sufficient points for this redemption');
          }
          
          await collections.users.updateOne(
            { _id: new ObjectId(redemption.userId) },
            { 
              $inc: { points: -redemption.pointsCost },
              $set: { updatedAt: new Date() }
            },
            { session }
          );
        }

        // Update redemption status
        await collections.redemptions.updateOne(
          { _id: new ObjectId(redemptionId) },
          { $set: updates },
          { session }
        );
      });

      // Get updated redemption
      const updatedRedemption = await collections.redemptions.findOne({ _id: new ObjectId(redemptionId) });

      let message = 'Redemption status updated successfully';
      if (status === 'approved') {
        message = 'Redemption approved. Reward can now be provided to the child.';
      } else if (status === 'rejected') {
        message = 'Redemption rejected. Points have been refunded to the child.';
      }

      res.status(200).json({
        success: true,
        data: { 
          redemption: { 
            ...updatedRedemption, 
            id: updatedRedemption._id.toString() 
          } 
        },
        message,
      });
    } finally {
      await session.endSession();
    }
  } catch (error: any) {
    console.error('Update redemption status error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update redemption status',
    });
  }
};

export const deleteRedemption = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { redemptionId } = req.params;
    const redemption = await collections.redemptions.findOne({ _id: new ObjectId(redemptionId) });

    if (!redemption) {
      return res.status(404).json({
        success: false,
        error: 'Redemption not found',
      });
    }

    // Check if user can delete this redemption
    if (redemption.userId !== req.user.id && req.user.role !== 'parent') {
      return res.status(403).json({
        success: false,
        error: 'You can only delete your own redemption requests',
      });
    }

    // Use transaction to handle points refund and deletion atomically
    const session = mongodb['client'].startSession();
    try {
      await session.withTransaction(async () => {
        // If redemption is pending or approved, refund frozen points
        if (redemption.status === 'pending' || redemption.status === 'approved') {
          await collections.users.updateOne(
            { _id: new ObjectId(redemption.userId) },
            { 
              $inc: { points: redemption.pointsCost },
              $set: { updatedAt: new Date() }
            },
            { session }
          );
        }

        // Delete the redemption record
        await collections.redemptions.deleteOne(
          { _id: new ObjectId(redemptionId) },
          { session }
        );
      });

      let message = 'Redemption deleted successfully';
      if (redemption.status === 'pending' || redemption.status === 'approved') {
        message = 'Redemption deleted successfully. Points have been refunded.';
      }

      res.status(200).json({
        success: true,
        message,
      });
    } finally {
      await session.endSession();
    }
  } catch (error: any) {
    console.error('Delete redemption error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete redemption',
    });
  }
};

// Get pending redemptions for parent approval
export const getPendingRedemptions = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    // Only parents can view pending redemptions
    if (req.user.role !== 'parent') {
      return res.status(403).json({
        success: false,
        error: 'Only parents can view pending redemptions',
      });
    }

    if (!req.user.children || req.user.children.length === 0) {
      return res.status(200).json({
        success: true,
        data: { redemptions: [] },
        message: 'No children found',
      });
    }

    // Get all pending redemptions for this parent's children
    const pendingRedemptions = await collections.redemptions.find({
      userId: { $in: req.user.children },
      status: 'pending'
    }).toArray();

    // Get user details for each redemption
    const redemptionsWithUserInfo = await Promise.all(
      pendingRedemptions.map(async (redemption: any) => {
        const user = await collections.users.findOne({ _id: new ObjectId(redemption.userId) });
        return {
          ...redemption,
          id: redemption._id.toString(),
          childName: user?.displayName || 'Unknown',
          childEmail: user?.email || '',
        };
      })
    );

    res.status(200).json({
      success: true,
      data: { 
        redemptions: redemptionsWithUserInfo,
        totalPendingRedemptions: redemptionsWithUserInfo.length,
        totalPointsInvolved: redemptionsWithUserInfo.reduce((sum, r) => sum + r.pointsCost, 0)
      },
    });
  } catch (error: any) {
    console.error('Get pending redemptions error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get pending redemptions',
    });
  }
};

export const getRedemptionStats = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { userId } = req.query;
    const targetUserId = userId as string || req.user.id;

    // Check if user can access the requested user's data
    if (targetUserId !== req.user.id) {
      if (req.user.role !== 'parent' || !req.user.children?.includes(targetUserId)) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
        });
      }
    }

    const redemptions = await collections.redemptions.find({ userId: targetUserId }).toArray();

    const stats = {
      totalRedemptions: redemptions.length,
      pendingRedemptions: redemptions.filter((r: any) => r.status === 'pending').length,
      approvedRedemptions: redemptions.filter((r: any) => r.status === 'approved').length,
      rejectedRedemptions: redemptions.filter((r: any) => r.status === 'rejected').length,
      totalPointsSpent: redemptions
        .filter((r: any) => r.status === 'approved')
        .reduce((sum: number, r: any) => sum + r.pointsCost, 0),
    };

    res.status(200).json({
      success: true,
      data: { stats },
    });
  } catch (error: any) {
    console.error('Get redemption stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get redemption stats',
    });
  }
};