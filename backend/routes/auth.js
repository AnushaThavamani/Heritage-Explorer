const router = require('express').Router();
const { body } = require('express-validator');
const controller = require('../controllers/authController');
const validate = require('../middleware/validate');
const email = body('email').isEmail().withMessage('Valid email is required.').normalizeEmail();
router.post('/register', [body('name').trim().isLength({ min: 2 }), email, body('password').isLength({ min: 6 })], validate, controller.register);
router.post('/login', [email, body('password').notEmpty()], validate, controller.login);
module.exports = router;
