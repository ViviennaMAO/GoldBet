// server/src/routes/prices.js
const express = require('express');
const router = express.Router();
const priceController = require('../controllers/priceController');

/**
 * GET /api/prices/current
 * 获取当前金价
 */
router.get('/current', priceController.getCurrentPrice);

/**
 * GET /api/prices/today
 * 获取今日价格数据
 */
router.get('/today', priceController.getTodayPrice);

/**
 * GET /api/prices/history
 * 获取历史价格数据
 */
router.get('/history', priceController.getPriceHistory);

module.exports = router;
