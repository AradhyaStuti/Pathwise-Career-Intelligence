import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema(
  {
    phone: { type: String, default: '' },
    location: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    github: { type: String, default: '' },
    skills: { type: [String], default: [] },
    experienceYears: { type: Number, default: 0 },
    background: { type: String, default: '' },
    targetRole: { type: String, default: '' },
    hoursPerWeek: { type: Number, default: 10 },
    experienceLevel: { type: String, default: 'beginner' },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    password: { type: String, required: true },
    profile: { type: profileSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
