const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUserProfile, createUser } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/users', protect, authorize('super_admin'), createUser);
router.get('/profile', protect, getUserProfile);

module.exports = router;
