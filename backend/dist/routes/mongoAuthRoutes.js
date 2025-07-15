"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const mongoAuthController_1 = require("../controllers/mongoAuthController");
const mongoAuth_1 = require("../middleware/mongoAuth");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
// Registration validation
const registerValidation = [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('password').isLength({ min: 6 }),
    (0, express_validator_1.body)('displayName').isLength({ min: 2, max: 50 }),
    (0, express_validator_1.body)('role').isIn(['student', 'parent']),
    (0, express_validator_1.body)('parentEmail').optional().isEmail().normalizeEmail(),
];
// Login validation
const loginValidation = [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('password').notEmpty(),
];
// Profile update validation
const updateProfileValidation = [
    (0, express_validator_1.body)('displayName').optional().isLength({ min: 2, max: 50 }),
    (0, express_validator_1.body)('avatar').optional().isURL(),
];
// Public routes
router.post('/register', registerValidation, validation_1.validateRequest, mongoAuthController_1.register);
router.post('/login', loginValidation, validation_1.validateRequest, mongoAuthController_1.login);
// Protected routes
router.get('/profile', mongoAuth_1.authenticateToken, mongoAuthController_1.getProfile);
router.put('/profile', mongoAuth_1.authenticateToken, updateProfileValidation, validation_1.validateRequest, mongoAuthController_1.updateProfile);
exports.default = router;
//# sourceMappingURL=mongoAuthRoutes.js.map