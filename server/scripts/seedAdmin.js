import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';

async function seedAdmin() {
  try {
    await connectDB();
    const username = 'Admin';
    const email = 'marketplacepict@gmail.com';
    const plainPassword = 'Admin@2006';
    const role = 'admin';

    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const existing = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existing) {
      existing.username = username;
      existing.email = email;
      existing.password = hashedPassword;
      existing.role = role;
      existing.isVerified = true;
      if (!existing.department) existing.department = 'PICT Administration';
      await existing.save();
      console.log('✅ Admin user updated successfully:', existing.toSafeObject());
    } else {
      const admin = await User.create({
        username,
        email,
        password: hashedPassword,
        role,
        isVerified: true,
        department: 'PICT Administration',
      });
      console.log('✅ Admin user created successfully:', admin.toSafeObject());
    }
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to seed admin user:', err);
    process.exit(1);
  }
}

seedAdmin();
