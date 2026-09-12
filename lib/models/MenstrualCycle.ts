import mongoose from 'mongoose';

const MenstrualCycleSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  lastPeriodStart: Date,
  cycleLength: Number,
  periodDuration: Number,
  isRegular: Boolean,
  symptoms: [String],
  notes: String,
  trackingEnabled: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

export const MenstrualCycle = mongoose.models.MenstrualCycle || mongoose.model('MenstrualCycle', MenstrualCycleSchema);