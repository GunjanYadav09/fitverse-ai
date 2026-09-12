import mongoose from 'mongoose';

const CravingEntrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  craving: {
    type: String,
    required: true,
  },
  healthyAlternative: {
    type: String,
    required: true,
  },
  originalCalories: {
    type: Number,
    default: 0,
  },
  healthyCalories: {
    type: Number,
    default: 0,
  },
  caloriesSaved: {
    type: Number,
    default: 0,
  },
  cookingTime: {
    type: Number, // minutes
    default: 0,
  },
  ingredients: {
    type: [String],
    default: [],
  },
  steps: {
    type: [String],
    default: [],
  },
  nutrition: {
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fat: { type: Number, default: 0 },
    fiber: { type: Number, default: 0 },
  },
  tips: {
    type: [String],
    default: [],
  },
  saved: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

export const CravingEntry = mongoose.models.CravingEntry || mongoose.model('CravingEntry', CravingEntrySchema);