import mongoose from 'mongoose';

const WaterEntrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number, // in ml
    required: true,
  },
  date: {
    type: String, // YYYY-MM-DD format for grouping by day
    required: true,
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

export const WaterEntry = mongoose.models.WaterEntry || mongoose.model('WaterEntry', WaterEntrySchema);