import mongoose from 'mongoose';

const SleepEntrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true,
  },
  bedtime: {
    type: String,
    required: true,
  },
  wakeTime: {
    type: String,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  quality: {
    type: Number,
    min: 1,
    max: 5,
    default: 3,
  },
  notes: {
    type: String,
    default: '',
  },
  // NEW: Sleep problems
  problems: {
    type: [String],
    default: [],
  },
  problemDetails: {
    type: String,
    default: '',
  },
  recordedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

export const SleepEntry = mongoose.models.SleepEntry || mongoose.model('SleepEntry', SleepEntrySchema);