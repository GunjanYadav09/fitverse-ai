import mongoose from 'mongoose';

const WeightEntrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  weight: {
    type: Number,
    required: true,
  },
  unit: {
    type: String,
    enum: ['kg', 'lbs'],
    default: 'kg',
  },
  recordedAt: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const WeightEntry = mongoose.models.WeightEntry || mongoose.model('WeightEntry', WeightEntrySchema);