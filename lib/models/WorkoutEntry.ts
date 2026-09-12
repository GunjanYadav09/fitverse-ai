import mongoose from 'mongoose';

const WorkoutEntrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  workoutName: {
    type: String,
    required: true,
  },
  workoutType: {
    type: String,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  caloriesBurned: {
    type: Number,
    default: 0,
  },
  intensity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  exercises: [{
    name: String,
    sets: Number,
    reps: Number,
    duration: Number,
    rest: Number,
  }],
  completed: {
    type: Boolean,
    default: false,
  },
  completedAt: {
    type: Date,
    default: null,
  },
  notes: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

export const WorkoutEntry = mongoose.models.WorkoutEntry || mongoose.model('WorkoutEntry', WorkoutEntrySchema);