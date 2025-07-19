import { Response } from 'express';
import { collections } from '../config/mongodb';
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

    const redemptionData: Omit<Redemption, 'id'> = {
      userId: req.user.id,
      rewardTitle,
      rewardDescription: rewardDescription || '',
      pointsCost,
      status: 'pending',
      requestedAt: new Date(),
      notes,
    };

    const result = await collections.redemptions.insertOne(redemptionData);
    const redemption = { ...redemptionData, id: result.insertedId.toString() };

    res.status(201).json({
      success: true,
      data: { redemption },
      message: 'Redemption request created successfully',
    });
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

    const updates: any = {
      status,
      processedAt: new Date(),
      processedBy: req.user.id,
      updatedAt: new Date(),
    };

    if (notes) {
      updates.notes = notes;
    }

    // If approving redemption, deduct points from user
    if (status === 'approved' && redemption.status === 'pending') {
      await collections.users.updateOne(
        { _id: new ObjectId(redemption.userId) },
        { 
          $inc: { points: -redemption.pointsCost },
          $set: { updatedAt: new Date() }
        }
      );
    }
    // If rejecting after approval, refund points
    else if (status === 'rejected' && redemption.status === 'approved') {
      await collections.users.updateOne(
        { _id: new ObjectId(redemption.userId) },
        { 
          $inc: { points: redemption.pointsCost },
          $set: { updatedAt: new Date() }
        }
      );
    }

    await collections.redemptions.updateOne(
      { _id: new ObjectId(redemptionId) },
      { $set: updates }
    );

    // Get updated redemption
    const updatedRedemption = await collections.redemptions.findOne({ _id: new ObjectId(redemptionId) });

    res.status(200).json({
      success: true,
      data: { 
        redemption: { 
          ...updatedRedemption, 
          id: updatedRedemption._id.toString() 
        } 
      },
      message: 'Redemption status updated successfully',
    });
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

    // If redemption was approved, refund points
    if (redemption.status === 'approved') {
      await collections.users.updateOne(
        { _id: new ObjectId(redemption.userId) },
        { 
          $inc: { points: redemption.pointsCost },
          $set: { updatedAt: new Date() }
        }
      );
    }

    await collections.redemptions.deleteOne({ _id: new ObjectId(redemptionId) });

    res.status(200).json({
      success: true,
      message: 'Redemption deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete redemption error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete redemption',
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