import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  onboardingCompleted: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true, // This automatically adds createdAt and updatedAt
});

// Remove the pre-save hook entirely
export const User = mongoose.models.User || mongoose.model('User', UserSchema);