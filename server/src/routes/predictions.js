// server/src/routes/predictions.js
const express = require('express');
const router = express.Router();
const predictionController = require('../controllers/predictionController');
const { authenticate } = require('../middleware/auth');

/**
 * POST /api/predictions/submit
 * 提交预测
 */
router.post('/submit', authenticate, predictionController.submitPrediction);

/**
 * GET /api/predictions/my
 * 获取我的预测记录
 */
router.get('/my', authenticate, predictionController.getMyPredictions);

/**
 * GET /api/predictions/today
 * 检查今日是否已预测
 */
router.get('/today', authenticate, predictionController.checkTodayPrediction);

/**
 * GET /api/predictions/:id
 * 获取预测详情
 */
router.get('/:id', authenticate, predictionController.getPredictionDetail);

module.exports = router;
