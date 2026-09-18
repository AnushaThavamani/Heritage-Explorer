const router = require('express').Router();
const { body, param } = require('express-validator');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const controller = require('../controllers/quizScoreController');
router.use(auth);
router.post('/', [body('userId').isMongoId(), body('quizId').notEmpty(), body('score').isFloat({ min: 0 }), body('dateTaken').optional().isISO8601()], validate, controller.create);
router.get('/:userId', [param('userId').isMongoId()], validate, controller.list);
module.exports = router;
