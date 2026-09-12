import mongoose from 'mongoose';

const UserProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  dateOfBirth: Date,
  age: Number,
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer-not-to-say'],
  },
  height: Number,
  heightUnit: {
    type: String,
    enum: ['cm', 'ft'],
    default: 'cm',
  },
  weight: Number,
  weightUnit: {
    type: String,
    enum: ['kg', 'lbs'],
    default: 'kg',
  },
  activityLevel: {
    type: String,
    enum: ['sedentary', 'light', 'moderate', 'active', 'very-active'],
  },
  fitnessGoal: String,
  fitnessLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
  },
  currentRoutine: String,
  dietType: {
    type: String,
    enum: ['vegetarian', 'vegan', 'non-vegetarian', 'eggetarian', 'other'],
  },
  foodPreferences: [String],
  allergies: [String],
  workoutPreference: {
    type: String,
    enum: ['home', 'gym', 'outdoor', 'both'],
  },
  workoutDays: [Number],
  sleepHours: Number,
  waterGoal: {
    type: Number,
    default: 2500,
  },
  stressLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
  },
  preferredWorkoutTime: {
    type: String,
    enum: ['morning', 'afternoon', 'evening'],
  },
  // Meal Preferences
  mealPreferences: {
    allergies: [String],
    dislikes: [String],
    cuisinePreference: {
      type: String,
      enum: ['indian', 'continental', 'asian', 'mediterranean', 'mixed'],
      default: 'mixed',
    },
    spiceLevel: {
      type: String,
      enum: ['mild', 'medium', 'spicy'],
      default: 'medium',
    },
    mealComplexity: {
      type: String,
      enum: ['quick', 'moderate', 'elaborate'],
      default: 'moderate',
    },
    includeSnacks: {
      type: Boolean,
      default: true,
    },
    additionalNotes: String,
  },
}, {
  timestamps: true,
});

export const UserProfile = mongoose.models.UserProfile || mongoose.model('UserProfile', UserProfileSchema);