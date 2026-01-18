// server/src/routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

/**
 * POST /api/auth/wallet-login
 * Luffa钱包登录
 */
router.post('/wallet-login', authController.walletLogin);

/**
 * POST /api/auth/verify
 * 验证Token
 */
router.post('/verify', authenticate, authController.verifyToken);

/**
 * POST /api/auth/logout
 * 退出登录
 */
router.post('/logout', authenticate, authController.logout);

module.exports = router;
