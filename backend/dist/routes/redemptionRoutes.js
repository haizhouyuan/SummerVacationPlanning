"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const redemptionController_1 = require("../controllers/redemptionController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
// Redemption validation
const redemptionValidation = [
    (0, express_validator_1.body)('rewardTitle').isLength({ min: 1, max: 100 }),
    (0, express_validator_1.body)('rewardDescription').optional().isLength({ max: 300 }),
    (0, express_validator_1.body)('pointsCost').isInt({ min: 1, max: 1000 }),
    (0, express_validator_1.body)('notes').optional().isLength({ max: 200 }),
];
const redemptionUpdateValidation = [
    (0, express_validator_1.body)('status').isIn(['pending', 'approved', 'rejected']),
    (0, express_validator_1.body)('notes').optional().isLength({ max: 200 }),
];
// All routes require authentication
router.use(auth_1.authenticateToken);
// Redemption routes
router.post('/', redemptionValidation, validation_1.validateRequest, redemptionController_1.createRedemption);
router.get('/', redemptionController_1.getRedemptions);
router.put('/:redemptionId', redemptionUpdateValidation, validation_1.validateRequest, redemptionController_1.updateRedemptionStatus);
router.delete('/:redemptionId', redemptionController_1.deleteRedemption);
router.get('/stats', redemptionController_1.getRedemptionStats);
exports.default = router;
//# sourceMappingURL=redemptionRoutes.js.map