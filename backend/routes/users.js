const router = require('express').Router();
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const controller = require('../controllers/authController');

router.use(auth);
router.get('/profile', controller.profile);
router.put('/profile', [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must contain at least 2 characters.'),
  body('mobile').optional().trim().matches(/^$|^\d{10}$/).withMessage('Mobile must be a 10-digit number.'),
  body('category').optional().trim().isLength({ max: 80 }),
], validate, controller.updateProfile);

module.exports = router;
