// src/routes/notifications.js
const router = require('express').Router();
const ctrl   = require('../controllers/notificationsController');
const auth   = require('../middlewares/authMiddleware');

router.get('/:userId',   auth(), ctrl.list);
router.put('/tout-lire', auth(), ctrl.toutLire);
router.put('/:id/lue',   auth(), ctrl.marquerLue);

module.exports = router;
