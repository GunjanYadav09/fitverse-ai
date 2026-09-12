import mongoose from 'mongoose';

const NutritionEntrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  foodName: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    default: '',
  },
  calories: {
    type: Number,
    default: 0,
  },
  protein: {
    type: Number,
    default: 0,
  },
  carbs: {
    type: Number,
    default: 0,
  },
  fat: {
    type: Number,
    default: 0,
  },
  fiber: {
    type: Number,
    default: 0,
  },
  sugar: {
    type: Number,
    default: 0,
  },
  sodium: {
    type: Number,
    default: 0,
  },
  healthScore: {
    type: Number,
    default: 0,
  },
  servingSize: {
    type: String,
    default: '100g',
  },
  detectedLabels: [String],
  mealType: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snack'],
    default: 'snack',
  },
  recordedAt: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

export const NutritionEntry = mongoose.models.NutritionEntry || mongoose.model('NutritionEntry', NutritionEntrySchema);