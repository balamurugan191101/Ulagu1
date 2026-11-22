const express = require('express');
const { registerUser, loginUser } = require('../controllers/authController');
const requireAuth = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();
router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.get('/me', requireAuth, (req, res) => {
  res.json({ success: true, user: { id: req.user.id, name: req.user.name, email: req.user.email } });
});

module.exports = router;
