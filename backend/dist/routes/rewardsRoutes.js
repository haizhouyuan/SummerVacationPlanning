"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const rewardsController_1 = require("../controllers/rewardsController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
// Game time exchange validation
const gameTimeValidation = [
    (0, express_validator_1.body)('pointsToSpend').isInt({ min: 1, max: 100 }),
    (0, express_validator_1.body)('gameType').optional().isIn(['normal', 'educational']),
    (0, express_validator_1.body)('date').optional().isISO8601().toDate(),
];
const useGameTimeValidation = [
    (0, express_validator_1.body)('minutesToUse').isInt({ min: 1, max: 300 }), // max 5 hours
    (0, express_validator_1.body)('gameSession').optional().isLength({ max: 100 }),
];
// All routes require authentication
router.use(auth_1.authenticateToken);
// Game time management routes
router.post('/game-time/calculate', gameTimeValidation, validation_1.validateRequest, rewardsController_1.calculateGameTime);
router.get('/game-time/today', rewardsController_1.getTodayGameTime);
router.post('/game-time/use', useGameTimeValidation, validation_1.validateRequest, rewardsController_1.useGameTime);
// Special rewards
router.get('/special', rewardsController_1.getSpecialRewards);
exports.default = router;
//# sourceMappingURL=rewardsRoutes.js.map