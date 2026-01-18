// server/src/routes/users.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');

/**
 * GET /api/users/stats
 * 获取用户统计数据
 */
router.get('/stats', authenticate, userController.getUserStats);

/**
 * GET /api/users/profile
 * 获取用户资料
 */
router.get('/profile', authenticate, userController.getUserProfile);

/**
 * PUT /api/users/profile
 * 更新用户资料
 */
router.put('/profile', authenticate, userController.updateUserProfile);

module.exports = router;
