const router = require('express').Router();
const controller = require('../controllers/heritageController');
router.get('/', controller.list);
router.get('/:id', controller.get);
module.exports = router;
