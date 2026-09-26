const router = require('express').Router();
const controller = require('../controllers/heritageController');

router.get('/', controller.list);
router.get('/explore', controller.explore);
router.get('/:id', controller.get);

// Keeping basic definitions for create, update, remove
const auth = require('../middleware/auth');
router.post('/', auth, auth.adminOnly, controller.create);
router.put('/:id', auth, auth.adminOnly, controller.update);
router.delete('/:id', auth, auth.adminOnly, controller.remove);

module.exports = router;
