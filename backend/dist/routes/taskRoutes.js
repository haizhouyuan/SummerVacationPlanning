"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const taskController_1 = require("../controllers/taskController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
// Task validation
const taskValidation = [
    (0, express_validator_1.body)('title').isLength({ min: 1, max: 100 }),
    (0, express_validator_1.body)('description').isLength({ min: 1, max: 500 }),
    (0, express_validator_1.body)('category').isIn(['exercise', 'reading', 'chores', 'learning', 'creativity', 'other']),
    (0, express_validator_1.body)('difficulty').isIn(['easy', 'medium', 'hard']),
    (0, express_validator_1.body)('estimatedTime').isInt({ min: 1, max: 480 }), // 1 minute to 8 hours
    (0, express_validator_1.body)('points').optional().isInt({ min: 1, max: 100 }),
    (0, express_validator_1.body)('requiresEvidence').optional().isBoolean(),
    (0, express_validator_1.body)('evidenceTypes').optional().isArray(),
    (0, express_validator_1.body)('tags').optional().isArray(),
    (0, express_validator_1.body)('isPublic').optional().isBoolean(),
];
const taskUpdateValidation = [
    (0, express_validator_1.body)('title').optional().isLength({ min: 1, max: 100 }),
    (0, express_validator_1.body)('description').optional().isLength({ min: 1, max: 500 }),
    (0, express_validator_1.body)('category').optional().isIn(['exercise', 'reading', 'chores', 'learning', 'creativity', 'other']),
    (0, express_validator_1.body)('difficulty').optional().isIn(['easy', 'medium', 'hard']),
    (0, express_validator_1.body)('estimatedTime').optional().isInt({ min: 1, max: 480 }),
    (0, express_validator_1.body)('points').optional().isInt({ min: 1, max: 100 }),
    (0, express_validator_1.body)('requiresEvidence').optional().isBoolean(),
    (0, express_validator_1.body)('evidenceTypes').optional().isArray(),
    (0, express_validator_1.body)('tags').optional().isArray(),
    (0, express_validator_1.body)('isPublic').optional().isBoolean(),
];
// All routes require authentication
router.use(auth_1.authenticateToken);
// Task CRUD routes
router.post('/', taskValidation, validation_1.validateRequest, taskController_1.createTask);
router.get('/', taskController_1.getTasks);
router.get('/:taskId', taskController_1.getTaskById);
router.put('/:taskId', taskUpdateValidation, validation_1.validateRequest, taskController_1.updateTask);
router.delete('/:taskId', taskController_1.deleteTask);
exports.default = router;
//# sourceMappingURL=taskRoutes.js.map