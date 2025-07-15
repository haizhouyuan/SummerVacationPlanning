"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWeeklyStats = exports.deleteDailyTask = exports.updateDailyTaskStatus = exports.getDailyTasks = exports.createDailyTask = void 0;
const mongodb_1 = require("../config/mongodb");
const createDailyTask = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated',
            });
        }
        const { taskId, date, plannedTime, notes } = req.body;
        // Validate required fields
        if (!taskId || !date) {
            return res.status(400).json({
                success: false,
                error: 'Task ID and date are required',
            });
        }
        // Check if task exists
        const taskDoc = await mongodb_1.collections.tasks.doc(taskId).get();
        if (!taskDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Task not found',
            });
        }
        // Check if daily task already exists for this date
        const existingDailyTask = await mongodb_1.collections.dailyTasks
            .where('userId', '==', req.user.id)
            .where('taskId', '==', taskId)
            .where('date', '==', date)
            .get();
        if (!existingDailyTask.empty) {
            return res.status(400).json({
                success: false,
                error: 'Daily task already exists for this date',
            });
        }
        const dailyTaskData = {
            userId: req.user.id,
            taskId,
            date,
            status: 'planned',
            plannedTime,
            notes,
            pointsEarned: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        const dailyTaskRef = await mongodb_1.collections.dailyTasks.add(dailyTaskData);
        const dailyTask = { ...dailyTaskData, id: dailyTaskRef.id };
        res.status(201).json({
            success: true,
            data: { dailyTask },
            message: 'Daily task planned successfully',
        });
    }
    catch (error) {
        console.error('Create daily task error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to create daily task',
        });
    }
};
exports.createDailyTask = createDailyTask;
const getDailyTasks = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated',
            });
        }
        const { date, status, userId } = req.query;
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
        let query = mongodb_1.collections.dailyTasks
            .where('userId', '==', targetUserId)
            .orderBy('createdAt', 'desc');
        if (date) {
            query = query.where('date', '==', date);
        }
        if (status) {
            query = query.where('status', '==', status);
        }
        const snapshot = await query.get();
        const dailyTasks = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
        // Get task details for each daily task
        const tasksWithDetails = await Promise.all(dailyTasks.map(async (dailyTask) => {
            const taskDoc = await mongodb_1.collections.tasks.doc(dailyTask.taskId).get();
            const task = taskDoc.exists ? { id: taskDoc.id, ...taskDoc.data() } : null;
            return {
                ...dailyTask,
                task,
            };
        }));
        res.status(200).json({
            success: true,
            data: { dailyTasks: tasksWithDetails },
        });
    }
    catch (error) {
        console.error('Get daily tasks error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to get daily tasks',
        });
    }
};
exports.getDailyTasks = getDailyTasks;
const updateDailyTaskStatus = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated',
            });
        }
        const { dailyTaskId } = req.params;
        const { status, evidence, notes } = req.body;
        const dailyTaskDoc = await mongodb_1.collections.dailyTasks.doc(dailyTaskId).get();
        if (!dailyTaskDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Daily task not found',
            });
        }
        const dailyTask = dailyTaskDoc.data();
        // Check if user can update this daily task
        if (dailyTask.userId !== req.user.id) {
            return res.status(403).json({
                success: false,
                error: 'You can only update your own daily tasks',
            });
        }
        const updates = { updatedAt: new Date() };
        if (status) {
            updates.status = status;
            // If completing task, calculate points
            if (status === 'completed') {
                const taskDoc = await mongodb_1.collections.tasks.doc(dailyTask.taskId).get();
                if (taskDoc.exists) {
                    const task = taskDoc.data();
                    updates.pointsEarned = task.points;
                    updates.completedAt = new Date();
                    // Update user's total points
                    await mongodb_1.collections.users.doc(req.user.id).update({
                        points: req.user.points + task.points,
                        updatedAt: new Date(),
                    });
                }
            }
        }
        if (evidence) {
            updates.evidence = evidence;
        }
        if (notes) {
            updates.notes = notes;
        }
        await mongodb_1.collections.dailyTasks.doc(dailyTaskId).update(updates);
        // Get updated daily task
        const updatedDailyTaskDoc = await mongodb_1.collections.dailyTasks.doc(dailyTaskId).get();
        const updatedDailyTask = { id: updatedDailyTaskDoc.id, ...updatedDailyTaskDoc.data() };
        res.status(200).json({
            success: true,
            data: { dailyTask: updatedDailyTask },
            message: 'Daily task updated successfully',
        });
    }
    catch (error) {
        console.error('Update daily task status error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to update daily task status',
        });
    }
};
exports.updateDailyTaskStatus = updateDailyTaskStatus;
const deleteDailyTask = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated',
            });
        }
        const { dailyTaskId } = req.params;
        const dailyTaskDoc = await mongodb_1.collections.dailyTasks.doc(dailyTaskId).get();
        if (!dailyTaskDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Daily task not found',
            });
        }
        const dailyTask = dailyTaskDoc.data();
        // Check if user can delete this daily task
        if (dailyTask.userId !== req.user.id) {
            return res.status(403).json({
                success: false,
                error: 'You can only delete your own daily tasks',
            });
        }
        await mongodb_1.collections.dailyTasks.doc(dailyTaskId).delete();
        res.status(200).json({
            success: true,
            message: 'Daily task deleted successfully',
        });
    }
    catch (error) {
        console.error('Delete daily task error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to delete daily task',
        });
    }
};
exports.deleteDailyTask = deleteDailyTask;
const getWeeklyStats = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated',
            });
        }
        const { userId, startDate, endDate } = req.query;
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
        let query = mongodb_1.collections.dailyTasks.where('userId', '==', targetUserId);
        if (startDate) {
            query = query.where('date', '>=', startDate);
        }
        if (endDate) {
            query = query.where('date', '<=', endDate);
        }
        const snapshot = await query.get();
        const dailyTasks = snapshot.docs.map(doc => doc.data());
        const stats = {
            totalTasks: dailyTasks.length,
            completedTasks: dailyTasks.filter(task => task.status === 'completed').length,
            inProgressTasks: dailyTasks.filter(task => task.status === 'in_progress').length,
            plannedTasks: dailyTasks.filter(task => task.status === 'planned').length,
            skippedTasks: dailyTasks.filter(task => task.status === 'skipped').length,
            totalPointsEarned: dailyTasks.reduce((sum, task) => sum + task.pointsEarned, 0),
            completionRate: dailyTasks.length > 0 ?
                (dailyTasks.filter(task => task.status === 'completed').length / dailyTasks.length) * 100 : 0,
        };
        res.status(200).json({
            success: true,
            data: { stats },
        });
    }
    catch (error) {
        console.error('Get weekly stats error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to get weekly stats',
        });
    }
};
exports.getWeeklyStats = getWeeklyStats;
//# sourceMappingURL=dailyTaskController.js.map