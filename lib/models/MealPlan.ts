import mongoose from 'mongoose';

const MealPlanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  planName: {
    type: String,
    required: true,
  },
  goal: {
    type: String,
    required: true,
  },
  totalCalories: {
    type: Number,
    default: 0,
  },
  totalProtein: {
    type: Number,
    default: 0,
  },
  totalCarbs: {
    type: Number,
    default: 0,
  },
  totalFat: {
    type: Number,
    default: 0,
  },
  days: [{
    day: String,
    breakfast: {
      name: String,
      calories: Number,
      protein: Number,
      carbs: Number,
      fat: Number,
    },
    lunch: {
      name: String,
      calories: Number,
      protein: Number,
      carbs: Number,
      fat: Number,
    },
    dinner: {
      name: String,
      calories: Number,
      protein: Number,
      carbs: Number,
      fat: Number,
    },
    snacks: [{
      name: String,
      calories: Number,
      protein: Number,
      carbs: Number,
      fat: Number,
    }],
  }],
  preferences: {
    allergies: [String],
    dislikes: [String],
    cuisinePreference: String,
    spiceLevel: String,
    mealComplexity: String,
    includeSnacks: Boolean,
    additionalNotes: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

export const MealPlan = mongoose.models.MealPlan || mongoose.model('MealPlan', MealPlanSchema);