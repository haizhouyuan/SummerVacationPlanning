"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const dailyTaskController_1 = require("../controllers/dailyTaskController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
// Daily task validation
const dailyTaskValidation = [
    (0, express_validator_1.body)('taskId').isString().isLength({ min: 1 }),
    (0, express_validator_1.body)('date').isISO8601().toDate(),
    (0, express_validator_1.body)('plannedTime').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    (0, express_validator_1.body)('notes').optional().isLength({ max: 200 }),
];
const dailyTaskUpdateValidation = [
    (0, express_validator_1.body)('status').optional().isIn(['planned', 'in_progress', 'completed', 'skipped']),
    (0, express_validator_1.body)('evidence').optional().isArray(),
    (0, express_validator_1.body)('notes').optional().isLength({ max: 200 }),
];
// All routes require authentication
router.use(auth_1.authenticateToken);
// Daily task routes
router.post('/', dailyTaskValidation, validation_1.validateRequest, dailyTaskController_1.createDailyTask);
router.get('/', dailyTaskController_1.getDailyTasks);
router.put('/:dailyTaskId', dailyTaskUpdateValidation, validation_1.validateRequest, dailyTaskController_1.updateDailyTaskStatus);
router.delete('/:dailyTaskId', dailyTaskController_1.deleteDailyTask);
router.get('/stats/weekly', dailyTaskController_1.getWeeklyStats);
exports.default = router;
//# sourceMappingURL=dailyTaskRoutes.js.map