import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  
  // NEW: Fields for tracking password reset OTP codes - Ken
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },

  profile: {
    age: String,
    gender: String,
    height: String,
    weight: String,
    voiceGender: String,
    activityLevel: { type: String, default: 'Sedentary (office job)' },
    goal: { type: String, default: 'Maintenance' }, // Default fixed to match frontend
    isProfileComplete: { type: Boolean, default: false }
  }
});

export default mongoose.models.User || mongoose.model('User', UserSchema);