// server/src/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  username: {
    type: String,
    trim: true,
    default: null
  },
  totalPredictions: {
    type: Number,
    default: 0
  },
  correctPredictions: {
    type: Number,
    default: 0
  },
  accuracy: {
    type: Number,
    default: 0,
    get: function(val) {
      return Math.round(val * 100) / 100;
    }
  },
  points: {
    type: Number,
    default: 0
  },
  consecutiveWins: {
    type: Number,
    default: 0
  },
  lastPredictionDate: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

// Indexes
userSchema.index({ points: -1 });
userSchema.index({ accuracy: -1 });
userSchema.index({ consecutiveWins: -1 });

// Calculate accuracy before save
userSchema.pre('save', function(next) {
  if (this.totalPredictions > 0) {
    this.accuracy = (this.correctPredictions / this.totalPredictions) * 100;
  } else {
    this.accuracy = 0;
  }
  next();
});

// Instance methods
userSchema.methods.addPoints = function(points) {
  this.points += points;
  return this.save();
};

userSchema.methods.incrementPredictions = function(correct) {
  this.totalPredictions += 1;
  if (correct) {
    this.correctPredictions += 1;
    this.consecutiveWins += 1;
  } else {
    this.consecutiveWins = 0;
  }
  return this.save();
};

// Static methods
userSchema.statics.findByWallet = function(walletAddress) {
  return this.findOne({ walletAddress: walletAddress.toLowerCase() });
};

userSchema.statics.getLeaderboard = function(sortBy = 'points', limit = 50) {
  const sortOptions = {};
  sortOptions[sortBy] = -1;

  return this.find({})
    .sort(sortOptions)
    .limit(limit)
    .select('-__v');
};

const User = mongoose.model('User', userSchema);

module.exports = User;
