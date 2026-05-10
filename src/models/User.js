import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  firstName: { 
    type: String, 
    required: true 
  },
  middleName: { 
    type: String, 
    default: '' 
  },
  lastName: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: { 
    type: String, 
    required: true 
  },
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