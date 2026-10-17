import mongoose from 'mongoose';

const pendingSignupSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  collegeRollNo: { type: String, default: '' },
  department: { type: String, default: '' },
  phone: { type: String, default: '' },
  otpHash: { type: String, required: true },
  otpExpiresAt: { type: Date, required: true },
  lastSentAt: { type: Date, required: true },
  attempts: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true },
});

pendingSignupSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.PendingSignup || mongoose.model('PendingSignup', pendingSignupSchema);
