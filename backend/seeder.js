const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Ministry = require('./models/Ministry');
const Complaint = require('./models/Complaint');

dotenv.config();

// NOTE: Ministries should be created by a Super Admin through the API.
// This seeder will only create a default super admin and some citizen test users.

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for Seeding...');

    // Clear existing data
    await User.deleteMany();
    await Ministry.deleteMany();
    await Complaint.deleteMany();
    console.log('Database cleared.');

    // 1. Create Super Admin
    await User.create({
      name: 'Super Admin',
      email: 'superadmin@gov.com',
      password: 'superadmin123',
      role: 'super_admin'
    });

    console.log('=====================================================');
    console.log('Super Admin seeded:');
    console.log('  email: superadmin@gov.com');
    console.log('  password: superadmin123');
    console.log('=====================================================');

    // 2. Create Citizens (optional for testing)
    const citizens = [];
    for (let i = 1; i <= 5; i++) {
      const citizen = await User.create({
        name: `Citizen User ${i}`,
        email: `citizen${i}@test.com`,
        password: 'citizen123',
        role: 'citizen'
      });
      citizens.push(citizen);
    }

    console.log('Seed data created: Super Admin and sample citizens.');

    console.log('Database successfully seeded with realistic test data!');
    process.exit();
  } catch (error) {
    console.error('Error with data import', error);
    process.exit(1);
  }
};

seedDatabase();
