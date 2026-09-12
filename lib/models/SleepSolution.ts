import mongoose from 'mongoose';

const SleepSolutionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  problems: {
    type: [String],
    default: [],
  },
  details: {
    type: String,
    default: '',
  },
  isNightStudier: {
    type: Boolean,
    default: false,
  },
  studyHoursPerDay: {
    type: Number,
    default: 0,
  },
  preferredStudyTime: {
    type: String, // 'early-morning' | 'late-night' | 'flexible'
    default: 'flexible',
  },
  recommendedSchedule: {
    type: Object,
    default: {},
  },
  solutionsGiven: {
    type: [String],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

export const SleepSolution = mongoose.models.SleepSolution || mongoose.model('SleepSolution', SleepSolutionSchema);