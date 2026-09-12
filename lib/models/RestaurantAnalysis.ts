import mongoose from 'mongoose';

const MenuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  calories: { type: Number, default: 0 },
  protein: { type: Number, default: 0 },
  carbs: { type: Number, default: 0 },
  fat: { type: Number, default: 0 },
  fiber: { type: Number, default: 0 },
  healthScore: { type: Number, default: 50 },
  verdict: {
    type: String,
    enum: ['excellent', 'good', 'moderate', 'avoid'],
    default: 'moderate',
  },
  reason: { type: String, default: '' },
});

const RestaurantAnalysisSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  restaurantName: {
    type: String,
    required: true,
  },
  cuisineType: {
    type: String,
    default: 'mixed',
  },
  menuText: {
    type: String,
    default: '',
  },
  recommended: [MenuItemSchema],
  alternatives: [MenuItemSchema],
  avoid: [MenuItemSchema],
  summary: {
    type: String,
    default: '',
  },
  userGoal: {
    type: String,
    default: 'general-wellness',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

export const RestaurantAnalysis = mongoose.models.RestaurantAnalysis || mongoose.model('RestaurantAnalysis', RestaurantAnalysisSchema);