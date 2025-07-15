"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedemptionStats = exports.deleteRedemption = exports.updateRedemptionStatus = exports.getRedemptions = exports.createRedemption = void 0;
const mongodb_1 = require("../config/mongodb");
const createRedemption = async (req, res) => {
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
        const redemptionData = {
            userId: req.user.id,
            rewardTitle,
            rewardDescription: rewardDescription || '',
            pointsCost,
            status: 'pending',
            requestedAt: new Date(),
            notes,
        };
        const redemptionRef = await mongodb_1.collections.redemptions.add(redemptionData);
        const redemption = { ...redemptionData, id: redemptionRef.id };
        res.status(201).json({
            success: true,
            data: { redemption },
            message: 'Redemption request created successfully',
        });
    }
    catch (error) {
        console.error('Create redemption error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to create redemption request',
        });
    }
};
exports.createRedemption = createRedemption;
const getRedemptions = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated',
            });
        }
        const { userId, status } = req.query;
        const targetUserId = userId || req.user.id;
        // Check if user can access the requested user's data
        if (targetUserId !== req.user.id) {
            if (req.user.role !== 'parent' || !req.user.children?.includes(targetUserId)) {
                return res.status(403).json({
                    success: false,
                    error: 'Access denied',
                });
            }
        }
        let query = mongodb_1.collections.redemptions
            .where('userId', '==', targetUserId)
            .orderBy('requestedAt', 'desc');
        if (status) {
            query = query.where('status', '==', status);
        }
        const snapshot = await query.get();
        const redemptions = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
        res.status(200).json({
            success: true,
            data: { redemptions },
        });
    }
    catch (error) {
        console.error('Get redemptions error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to get redemptions',
        });
    }
};
exports.getRedemptions = getRedemptions;
const updateRedemptionStatus = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated',
            });
        }
        const { redemptionId } = req.params;
        const { status, notes } = req.body;
        const redemptionDoc = await mongodb_1.collections.redemptions.doc(redemptionId).get();
        if (!redemptionDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Redemption not found',
            });
        }
        const redemption = redemptionDoc.data();
        // Check if user can update this redemption
        // Only the user who created it or their parent can update
        if (redemption.userId !== req.user.id) {
            if (req.user.role !== 'parent' || !req.user.children?.includes(redemption.userId)) {
                return res.status(403).json({
                    success: false,
                    error: 'Access denied',
                });
            }
        }
        // Only parents can approve/reject redemptions
        if ((status === 'approved' || status === 'rejected') && req.user.role !== 'parent') {
            return res.status(403).json({
                success: false,
                error: 'Only parents can approve or reject redemptions',
            });
        }
        const updates = {
            status,
            processedAt: new Date(),
            processedBy: req.user.id,
        };
        if (notes) {
            updates.notes = notes;
        }
        // If approving, deduct points from user
        if (status === 'approved') {
            const userDoc = await mongodb_1.collections.users.doc(redemption.userId).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                const newPoints = Math.max(0, userData.points - redemption.pointsCost);
                await mongodb_1.collections.users.doc(redemption.userId).update({
                    points: newPoints,
                    updatedAt: new Date(),
                });
            }
        }
        await mongodb_1.collections.redemptions.doc(redemptionId).update(updates);
        // Get updated redemption
        const updatedRedemptionDoc = await mongodb_1.collections.redemptions.doc(redemptionId).get();
        const updatedRedemption = { id: updatedRedemptionDoc.id, ...updatedRedemptionDoc.data() };
        res.status(200).json({
            success: true,
            data: { redemption: updatedRedemption },
            message: 'Redemption updated successfully',
        });
    }
    catch (error) {
        console.error('Update redemption status error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to update redemption status',
        });
    }
};
exports.updateRedemptionStatus = updateRedemptionStatus;
const deleteRedemption = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated',
            });
        }
        const { redemptionId } = req.params;
        const redemptionDoc = await mongodb_1.collections.redemptions.doc(redemptionId).get();
        if (!redemptionDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Redemption not found',
            });
        }
        const redemption = redemptionDoc.data();
        // Only allow deletion by the user who created it and only if it's still pending
        if (redemption.userId !== req.user.id) {
            return res.status(403).json({
                success: false,
                error: 'You can only delete your own redemption requests',
            });
        }
        if (redemption.status !== 'pending') {
            return res.status(400).json({
                success: false,
                error: 'Only pending redemptions can be deleted',
            });
        }
        await mongodb_1.collections.redemptions.doc(redemptionId).delete();
        res.status(200).json({
            success: true,
            message: 'Redemption deleted successfully',
        });
    }
    catch (error) {
        console.error('Delete redemption error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to delete redemption',
        });
    }
};
exports.deleteRedemption = deleteRedemption;
const getRedemptionStats = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated',
            });
        }
        const { userId } = req.query;
        const targetUserId = userId || req.user.id;
        // Check if user can access the requested user's data
        if (targetUserId !== req.user.id) {
            if (req.user.role !== 'parent' || !req.user.children?.includes(targetUserId)) {
                return res.status(403).json({
                    success: false,
                    error: 'Access denied',
                });
            }
        }
        const snapshot = await mongodb_1.collections.redemptions
            .where('userId', '==', targetUserId)
            .get();
        const redemptions = snapshot.docs.map(doc => doc.data());
        const stats = {
            totalRedemptions: redemptions.length,
            pendingRedemptions: redemptions.filter(r => r.status === 'pending').length,
            approvedRedemptions: redemptions.filter(r => r.status === 'approved').length,
            rejectedRedemptions: redemptions.filter(r => r.status === 'rejected').length,
            totalPointsRedeemed: redemptions
                .filter(r => r.status === 'approved')
                .reduce((sum, r) => sum + r.pointsCost, 0),
            totalPointsPending: redemptions
                .filter(r => r.status === 'pending')
                .reduce((sum, r) => sum + r.pointsCost, 0),
        };
        res.status(200).json({
            success: true,
            data: { stats },
        });
    }
    catch (error) {
        console.error('Get redemption stats error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to get redemption stats',
        });
    }
};
exports.getRedemptionStats = getRedemptionStats;
//# sourceMappingURL=redemptionController.js.map