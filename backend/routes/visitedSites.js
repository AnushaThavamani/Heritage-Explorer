const router = require('express').Router();
const { body, param } = require('express-validator');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const controller = require('../controllers/visitedController');
router.use(auth);
router.post('/', [body('userId').isMongoId(), body('siteId').notEmpty(), body('visitedAt').optional().isISO8601()], validate, controller.add);
router.get('/:userId', [param('userId').isMongoId()], validate, controller.list);
module.exports = router;
