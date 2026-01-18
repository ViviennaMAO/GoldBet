// server/src/models/Prediction.js
const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  walletAddress: {
    type: String,
    required: true,
    lowercase: true
  },
  date: {
    type: Date,
    required: true
  },
  priceDirection: {
    type: String,
    enum: ['up', 'down'],
    required: true
  },
  volatility: {
    type: String,
    enum: ['small', 'medium', 'large'],
    required: true
  },
  basePrice: {
    type: Number,
    required: true
  },
  resultPrice: {
    type: Number,
    default: null
  },
  resultVolatility: {
    type: Number,
    default: null
  },
  directionCorrect: {
    type: Boolean,
    default: null
  },
  volatilityCorrect: {
    type: Boolean,
    default: null
  },
  pointsEarned: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'settled'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Indexes
predictionSchema.index({ userId: 1, date: -1 });
predictionSchema.index({ walletAddress: 1, date: -1 });
predictionSchema.index({ status: 1, date: 1 });
predictionSchema.index({ date: -1 });

// Compound index for checking today's prediction
predictionSchema.index({ userId: 1, date: 1 }, { unique: true });

// Instance methods
predictionSchema.methods.settle = function(actualPrice, actualVolatility) {
  // Check direction prediction
  const priceChange = actualPrice - this.basePrice;
  if (this.priceDirection === 'up' && priceChange > 0) {
    this.directionCorrect = true;
  } else if (this.priceDirection === 'down' && priceChange < 0) {
    this.directionCorrect = true;
  } else {
    this.directionCorrect = false;
  }

  // Check volatility prediction
  let volatilityLevel;
  if (actualVolatility < 0.5) {
    volatilityLevel = 'small';
  } else if (actualVolatility <= 2) {
    volatilityLevel = 'medium';
  } else {
    volatilityLevel = 'large';
  }
  this.volatilityCorrect = (this.volatility === volatilityLevel);

  // Calculate points
  let points = 0;
  if (this.directionCorrect) points += 10;
  if (this.volatilityCorrect) points += 5;

  this.resultPrice = actualPrice;
  this.resultVolatility = actualVolatility;
  this.pointsEarned = points;
  this.status = 'settled';

  return this.save();
};

// Static methods
predictionSchema.statics.getTodayPrediction = function(userId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return this.findOne({
    userId: userId,
    date: { $gte: startOfDay, $lte: endOfDay }
  });
};

predictionSchema.statics.getPendingPredictions = function(targetDate) {
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  return this.find({
    status: 'pending',
    date: { $gte: startOfDay, $lte: endOfDay }
  }).populate('userId');
};

const Prediction = mongoose.model('Prediction', predictionSchema);

module.exports = Prediction;
