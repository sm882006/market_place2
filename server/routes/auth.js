import express from 'express';
import bcrypt from 'bcryptjs';
import { createHash, randomInt, timingSafeEqual } from 'node:crypto';
import User from '../models/User.js';
import PendingSignup from '../models/PendingSignup.js';
import { isSignupEmailConfigured, sendEmailOtp } from '../utils/signupEmail.js';
import { verifyToken, generateToken } from '../middleware/auth.js';

const router = express.Router();

// Helper to format user response with both id and _id
const formatUser = (user) => {
  const safe = user.toSafeObject ? user.toSafeObject() : user;
  return {
    ...safe,
    id: user._id.toString(),
  };
};

const OTP_LIFETIME_MS = 10 * 60 * 1000;
const OTP_COOLDOWN_MS = 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;
const hashOtp = (email, otp) => createHash('sha256')
  .update(`${process.env.JWT_SECRET}:${email}:${otp}`)
  .digest('hex');

// POST /api/signup & /api/auth/register: request an email verification code
export const handleSignup = async (req, res) => {
  try {
    const { username, email, password, collegeRollNo, department, phone } = req.body;

    if (typeof username !== 'string' || typeof email !== 'string' || typeof password !== 'string' ||
        !username.trim() || !email.trim() || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required.' });
    }

    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim().toLowerCase();
    if (trimmedUsername.length < 3 || password.length < 6 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return res.status(400).json({ message: 'Enter a valid email, a username of at least 3 characters, and a password of at least 6 characters.' });
    }
    if (!isSignupEmailConfigured()) {
      return res.status(503).json({
        message: process.env.NODE_ENV === 'production'
          ? 'Email signup is temporarily unavailable. Please contact support.'
          : 'Email sending is not configured. Set SMTP_USER and SMTP_PASS in the server .env file, then restart the backend.',
      });
    }

    // Check duplicate
    const existingUser = await User.findOne({
      $or: [{ username: trimmedUsername }, { email: trimmedEmail }],
    });

    if (existingUser) {
      if (existingUser.username.toLowerCase() === trimmedUsername.toLowerCase()) {
        return res.status(409).json({ message: 'Username is already taken.' });
      }
      return res.status(409).json({ message: 'Email is already registered.' });
    }

    const pending = await PendingSignup.findOne({ email: trimmedEmail });
    if (pending && pending.lastSentAt > new Date(Date.now() - OTP_COOLDOWN_MS)) {
      return res.status(429).json({ message: 'Please wait one minute before requesting another code.' });
    }

    const otp = randomInt(100000, 1000000).toString();
    const now = new Date();
    const otpExpiresAt = new Date(now.getTime() + OTP_LIFETIME_MS);
    const signup = await PendingSignup.findOneAndUpdate(
      { email: trimmedEmail },
      { $set: {
      username: trimmedUsername,
      email: trimmedEmail,
      password: await bcrypt.hash(password, 10),
      collegeRollNo: collegeRollNo || '',
      department: department || '',
      phone: phone || '',
      otpHash: hashOtp(trimmedEmail, otp),
      otpExpiresAt,
      lastSentAt: now,
      expiresAt: otpExpiresAt,
      attempts: 0,
      } },
      { upsert: true, new: true }
    );

    try {
      await sendEmailOtp(trimmedEmail, otp);
    } catch (mailError) {
      await PendingSignup.deleteOne({ _id: signup._id, otpHash: signup.otpHash });
      console.error('[AUTH ERROR] Signup email failed:', mailError);
      return res.status(503).json({ message: 'Could not send the verification email. Please try again later.' });
    }

    return res.status(202).json({
      message: `A 6-digit verification code was sent to ${trimmedEmail}.`,
      email: trimmedEmail,
    });
  } catch (err) {
    console.error('[AUTH ERROR] Signup failed:', err);
    return res.status(500).json({ message: 'Internal server error during registration.' });
  }
};

// POST /api/auth/verify-signup-otp: create the user only after email ownership is proved
export const handleVerifySignupOtp = async (req, res) => {
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const otp = typeof req.body.otp === 'string' ? req.body.otp.trim() : '';
    if (!email || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ message: 'Enter the 6-digit verification code.' });
    }

    const signup = await PendingSignup.findOneAndUpdate(
      { email, otpExpiresAt: { $gt: new Date() }, attempts: { $lt: MAX_OTP_ATTEMPTS } },
      { $inc: { attempts: 1 } },
      { new: true }
    );
    if (!signup) {
      return res.status(400).json({ message: 'Code expired or too many attempts. Please request a new code.' });
    }

    const actual = Buffer.from(hashOtp(email, otp), 'hex');
    const expected = Buffer.from(signup.otpHash, 'hex');
    if (!timingSafeEqual(actual, expected)) {
      return res.status(400).json({ message: 'Invalid verification code.' });
    }

    const claimed = await PendingSignup.findOneAndDelete({
      _id: signup._id,
      otpHash: signup.otpHash,
      otpExpiresAt: { $gt: new Date() },
      attempts: { $lte: MAX_OTP_ATTEMPTS },
    });
    if (!claimed) {
      return res.status(400).json({ message: 'Code expired or already used. Please request a new code.' });
    }

    const existingUser = await User.findOne({ $or: [{ username: claimed.username }, { email }] });
    if (existingUser) {
      return res.status(409).json({ message: 'Username or email is already registered. Please sign in or choose another username.' });
    }

    const user = await User.create({
      username: claimed.username,
      email: claimed.email,
      password: claimed.password,
      collegeRollNo: claimed.collegeRollNo,
      department: claimed.department,
      phone: claimed.phone,
      role: 'student',
      isVerified: claimed.email.endsWith('@pict.edu'),
    });
    return res.status(201).json({
      message: 'Email verified and account created successfully.',
      token: generateToken(user),
      user: formatUser(user),
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Username or email is already registered.' });
    }
    console.error('[AUTH ERROR] Signup verification failed:', err);
    return res.status(500).json({ message: 'Internal server error verifying signup.' });
  }
};

// POST /api/login & /api/auth/login
export const handleLogin = async (req, res) => {
  try {
    const { identifier, username, email, password } = req.body;
    const loginId = (identifier || username || email || '').trim();

    if (!loginId || !password) {
      return res.status(400).json({ message: 'Username/email and password are required.' });
    }

    const user = await User.findOne({
      $or: [{ username: loginId }, { email: loginId.toLowerCase() }],
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid username/email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username/email or password.' });
    }

    const token = generateToken(user);
    return res.json({
      message: 'Login successful',
      token,
      user: formatUser(user),
    });
  } catch (err) {
    console.error('[AUTH ERROR] Login failed:', err);
    return res.status(500).json({ message: 'Internal server error during login.' });
  }
};

// GET /api/profile & /api/auth/me
export const handleGetProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    return res.json({ user: formatUser(user) });
  } catch (err) {
    console.error('[AUTH ERROR] Get profile failed:', err);
    return res.status(500).json({ message: 'Internal server error fetching profile.' });
  }
};

// PUT /api/profile
export const handleUpdateProfile = async (req, res) => {
  try {
    const { bio, phone, department, collegeRollNo, avatar } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (bio !== undefined) user.bio = bio;
    if (phone !== undefined) user.phone = phone;
    if (department !== undefined) user.department = department;
    if (collegeRollNo !== undefined) user.collegeRollNo = collegeRollNo;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();
    return res.json({
      message: 'Profile updated successfully',
      user: formatUser(user),
    });
  } catch (err) {
    console.error('[AUTH ERROR] Update profile failed:', err);
    return res.status(500).json({ message: 'Internal server error updating profile.' });
  }
};

// POST /api/auth/send-otp
export const handleSendOtp = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    if (!user.email.endsWith('@pict.edu')) {
      return res.status(400).json({ message: 'A @pict.edu email is required for student verification.' });
    }
    if (!isSignupEmailConfigured()) {
      return res.status(503).json({ message: 'Email verification is unavailable. Please contact support.' });
    }
    if (user.otpLastSentAt && user.otpLastSentAt > new Date(Date.now() - OTP_COOLDOWN_MS)) {
      return res.status(429).json({ message: 'Please wait one minute before requesting another code.' });
    }

    const otp = randomInt(100000, 1000000).toString();
    user.verificationCode = hashOtp(user.email, otp);
    user.otpExpiresAt = new Date(Date.now() + OTP_LIFETIME_MS);
    user.otpLastSentAt = new Date();
    user.verificationAttempts = 0;
    await user.save();

    try {
      await sendEmailOtp(user.email, otp, 'student verification');
    } catch (mailError) {
      user.verificationCode = null;
      user.otpExpiresAt = null;
      user.otpLastSentAt = null;
      await user.save();
      console.error('[AUTH ERROR] Student verification email failed:', mailError);
      return res.status(503).json({ message: 'Could not send the verification email. Please try again later.' });
    }

    return res.json({
      success: true,
      message: `OTP sent to ${user.email}.`,
    });
  } catch (err) {
    console.error('[AUTH ERROR] Send OTP failed:', err);
    return res.status(500).json({ message: 'Internal server error sending OTP.' });
  }
};

// POST /api/auth/verify-otp
export const handleVerifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp) {
      return res.status(400).json({ message: 'Verification OTP is required.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (!user.email.endsWith('@pict.edu')) {
      return res.status(400).json({ message: 'A @pict.edu email is required for student verification.' });
    }

    if (!user.verificationCode || !user.otpExpiresAt || user.otpExpiresAt <= new Date() ||
        user.verificationAttempts >= MAX_OTP_ATTEMPTS) {
      return res.status(400).json({ message: 'Code expired or too many attempts. Please request a new code.' });
    }
    const actual = Buffer.from(hashOtp(user.email, String(otp).trim()), 'hex');
    const expected = Buffer.from(user.verificationCode, 'hex');
    user.verificationAttempts += 1;
    if (!timingSafeEqual(actual, expected)) {
      await user.save();
      return res.status(400).json({ message: 'Invalid verification code.' });
    }

    user.isVerified = true;
    user.verificationCode = null;
    user.otpExpiresAt = null;
    user.verificationAttempts = 0;
    await user.save();

    return res.json({
      success: true,
      message: 'Student status verified successfully! "Verified Student" badge granted.',
      user: formatUser(user),
    });
  } catch (err) {
    console.error('[AUTH ERROR] Verify OTP failed:', err);
    return res.status(500).json({ message: 'Internal server error verifying OTP.' });
  }
};

// POST /api/auth/block
export const handleBlockUser = async (req, res) => {
  try {
    const { targetUsername } = req.body;
    if (!targetUsername) {
      return res.status(400).json({ message: 'Target username is required.' });
    }

    const user = await User.findById(req.user._id);
    if (!user.blockedUsers.includes(targetUsername)) {
      user.blockedUsers.push(targetUsername);
      await user.save();
    }

    return res.json({
      message: `User ${targetUsername} has been blocked.`,
      blockedUsers: user.blockedUsers,
    });
  } catch (err) {
    console.error('[AUTH ERROR] Block user failed:', err);
    return res.status(500).json({ message: 'Internal server error blocking user.' });
  }
};

// POST /api/auth/unblock
export const handleUnblockUser = async (req, res) => {
  try {
    const { targetUsername } = req.body;
    const user = await User.findById(req.user._id);
    user.blockedUsers = user.blockedUsers.filter((u) => u !== targetUsername);
    await user.save();

    return res.json({
      message: `User ${targetUsername} has been unblocked.`,
      blockedUsers: user.blockedUsers,
    });
  } catch (err) {
    console.error('[AUTH ERROR] Unblock user failed:', err);
    return res.status(500).json({ message: 'Internal server error unblocking user.' });
  }
};

// GET /api/users/:username
export const handleGetPublicProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.json({
      username: user.username,
      avatar: user.avatar,
      bio: user.bio,
      department: user.department,
      isVerified: user.isVerified,
      ratingsAverage: user.ratingsAverage,
      ratingsCount: user.ratingsCount,
      createdAt: user.createdAt,
    });
  } catch (err) {
    console.error('[AUTH ERROR] Get public profile failed:', err);
    return res.status(500).json({ message: 'Internal server error fetching user.' });
  }
};

// Mount route paths
router.post('/signup', handleSignup);
router.post('/register', handleSignup);
router.post('/verify-signup-otp', handleVerifySignupOtp);
router.post('/login', handleLogin);
router.get('/profile', verifyToken, handleGetProfile);
router.get('/me', verifyToken, handleGetProfile);
router.put('/profile', verifyToken, handleUpdateProfile);
router.post('/send-otp', verifyToken, handleSendOtp);
router.post('/verify-otp', verifyToken, handleVerifyOtp);
router.post('/block', verifyToken, handleBlockUser);
router.post('/unblock', verifyToken, handleUnblockUser);
router.get('/user/:username', handleGetPublicProfile);

export default router;
