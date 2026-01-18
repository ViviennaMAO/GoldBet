// server/src/models/GoldPrice.js
const mongoose = require('mongoose');

const goldPriceSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true
  },
  openPrice: {
    type: Number,
    required: true
  },
  highPrice: {
    type: Number,
    required: true
  },
  lowPrice: {
    type: Number,
    required: true
  },
  closePrice: {
    type: Number,
    default: null
  },
  currentPrice: {
    type: Number,
    required: true
  },
  previousClose: {
    type: Number,
    default: null
  },
  change: {
    type: Number,
    default: 0
  },
  changePercent: {
    type: Number,
    default: 0
  },
  volatility: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
goldPriceSchema.index({ date: -1 });

// Calculate change and volatility before save
goldPriceSchema.pre('save', function(next) {
  if (this.previousClose && this.currentPrice) {
    this.change = this.currentPrice - this.previousClose;
    this.changePercent = (this.change / this.previousClose) * 100;
  }

  if (this.openPrice && this.highPrice && this.lowPrice) {
    this.volatility = Math.abs(this.highPrice - this.lowPrice) / this.openPrice * 100;
  }

  next();
});

// Static methods
goldPriceSchema.statics.getTodayPrice = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return this.findOne({
    date: { $gte: today }
  }).sort({ date: -1 });
};

goldPriceSchema.statics.getLatestPrice = function() {
  return this.findOne().sort({ date: -1 });
};

goldPriceSchema.statics.getPriceHistory = function(days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.find({
    date: { $gte: startDate }
  }).sort({ date: -1 });
};

const GoldPrice = mongoose.model('GoldPrice', goldPriceSchema);

module.exports = GoldPrice;
