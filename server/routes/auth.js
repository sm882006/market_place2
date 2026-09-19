import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
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

// POST /api/signup & /api/auth/register
export const handleSignup = async (req, res) => {
  try {
    const { username, email, password, collegeRollNo, department, phone } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required.' });
    }

    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim().toLowerCase();

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

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const isStudentEmail = trimmedEmail.endsWith('@pict.edu') || trimmedEmail.endsWith('.edu');

    const newUser = await User.create({
      username: trimmedUsername,
      email: trimmedEmail,
      password: hashedPassword,
      collegeRollNo: collegeRollNo || '',
      department: department || '',
      phone: phone || '',
      role: trimmedUsername === 'admin' ? 'admin' : 'student',
      isVerified: isStudentEmail,
    });

    const token = generateToken(newUser);
    return res.status(201).json({
      message: 'User registered successfully',
      token,
      user: formatUser(newUser),
    });
  } catch (err) {
    console.error('[AUTH ERROR] Signup failed:', err);
    return res.status(500).json({ message: 'Internal server error during registration.' });
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

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.verificationCode = otp;
    user.otpExpiresAt = expiry;
    await user.save();

    console.log(`\n==================================================`);
    console.log(`[CAMPUS STUDENT VERIFICATION OTP]`);
    console.log(`User: ${user.username} (${user.email})`);
    console.log(`Code: ${otp}`);
    console.log(`Expires in: 10 minutes`);
    console.log(`==================================================\n`);

    return res.json({
      success: true,
      message: `OTP sent to ${user.email}. (Check server console for OTP in development)`,
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

    if (!user.verificationCode || user.verificationCode !== otp.trim()) {
      return res.status(400).json({ message: 'Invalid verification code.' });
    }

    if (user.otpExpiresAt && new Date() > user.otpExpiresAt) {
      return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
    }

    user.isVerified = true;
    user.verificationCode = null;
    user.otpExpiresAt = null;
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
