const mongoose = require('mongoose');
require('dotenv').config();

const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'manager', 'accountant', 'viewer'], default: 'viewer' },
  active: { type: Boolean, default: true },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function registerAdmin() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/rkco';
    await mongoose.connect(mongoUri);
    console.log('Connected to database');

    const adminEmail = 'admin@rkco.com';
    const existing = await User.findOne({ email: adminEmail });

    if (existing) {
      console.log('✅ Admin user already exists!');
      console.log('Email:', existing.email);
      console.log('Role:', existing.role);
      await mongoose.disconnect();
      process.exit(0);
    }

    // Hash password manually
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    const admin = await User.create({
      name: 'Admin User',
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
      active: true,
    });

    console.log('✅ Admin user created successfully!');
    console.log('Email:', admin.email);
    console.log('Password: admin123');
    console.log('Role: admin');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

registerAdmin();

