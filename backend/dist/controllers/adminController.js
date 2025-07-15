"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeData = void 0;
const defaultTasks_1 = require("../utils/defaultTasks");
const initializeData = async (req, res) => {
    try {
        // Simple admin key check (in production, use proper admin authentication)
        const { adminKey } = req.body;
        if (adminKey !== process.env.ADMIN_KEY) {
            return res.status(403).json({
                success: false,
                error: 'Invalid admin key',
            });
        }
        // Create system user ID (in a real system, this would be a proper system user)
        const systemUserId = 'system_default_tasks';
        await (0, defaultTasks_1.initializeDefaultTasks)(systemUserId);
        res.status(200).json({
            success: true,
            message: 'Default tasks initialized successfully',
        });
    }
    catch (error) {
        console.error('Initialize data error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to initialize data',
        });
    }
};
exports.initializeData = initializeData;
//# sourceMappingURL=adminController.js.map