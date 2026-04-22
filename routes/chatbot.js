// src/routes/chatbot.js
const router = require('express').Router();
const ctrl   = require('../controllers/chatbotEngine');

router.post('/message', ctrl.handle);

module.exports = router;
