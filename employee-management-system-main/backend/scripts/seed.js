require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const Task = require('../models/task');
const Leave = require('../models/leave');

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Clear database
const clearDatabase = async () => {
  try {
    await User.deleteMany({});
    await Task.deleteMany({});
    await Leave.deleteMany({});
    console.log('Database cleared successfully');
  } catch (error) {
    console.error('Error clearing database:', error.message);
    process.exit(1);
  }
};

// Create sample users
const createUsers = async () => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    const adminPassword = await bcrypt.hash('admin123', salt);

    const users = [
      {
        name: 'Admin User',
        email: 'admin@example.com',
        password: adminPassword,
        role: 'admin',
        position: 'System Administrator',
        department: 'IT',
        joinDate: new Date('2020-01-01'),
        isAdmin: true
      },
      {
        name: 'John Doe',
        email: 'john@example.com',
        password: hashedPassword,
        role: 'employee',
        position: 'Frontend Developer',
        department: 'Engineering',
        joinDate: new Date('2021-03-15')
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: hashedPassword,
        role: 'employee',
        position: 'Backend Developer',
        department: 'Engineering',
        joinDate: new Date('2021-05-20')
      },
      {
        name: 'Michael Johnson',
        email: 'michael@example.com',
        password: hashedPassword,
        role: 'manager',
        position: 'Engineering Manager',
        department: 'Engineering',
        joinDate: new Date('2019-11-10')
      },
      {
        name: 'Emily Brown',
        email: 'emily@example.com',
        password: hashedPassword,
        role: 'employee',
        position: 'UI/UX Designer',
        department: 'Design',
        joinDate: new Date('2022-01-05')
      }
    ];

    const createdUsers = await User.insertMany(users);
    console.log(`${createdUsers.length} users created`);
    return createdUsers;
  } catch (error) {
    console.error('Error creating users:', error.message);
    process.exit(1);
  }
};

// Create sample tasks
const createTasks = async (users) => {
  try {
    const admin = users.find(user => user.isAdmin);
    const manager = users.find(user => user.role === 'manager');
    const developers = users.filter(user => 
      user.position.includes('Developer') && user.role === 'employee'
    );
    const designer = users.find(user => user.position.includes('Designer'));

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const tasks = [
      {
        title: 'Create Homepage Design',
        description: 'Design a modern homepage for the company website',
        creator: admin._id,
        assignedTo: designer._id,
        status: 'in progress',
        priority: 'high',
        startDate: lastWeek,
        dueDate: tomorrow,
        progress: 75
      },
      {
        title: 'Fix Login Bug',
        description: 'Fix the authentication bug in the login form',
        creator: manager._id,
        assignedTo: developers[0]._id,
        status: 'open',
        priority: 'high',
        startDate: yesterday,
        dueDate: tomorrow,
        progress: 20
      },
      {
        title: 'Implement API Endpoints',
        description: 'Create necessary API endpoints for the user management module',
        creator: manager._id,
        assignedTo: developers[1]._id,
        status: 'in progress',
        priority: 'medium',
        startDate: lastWeek,
        dueDate: nextWeek,
        progress: 50
      },
      {
        title: 'Database Optimization',
        description: 'Optimize database queries for better performance',
        creator: admin._id,
        assignedTo: developers[1]._id,
        status: 'completed',
        priority: 'medium',
        startDate: lastWeek,
        dueDate: yesterday,
        progress: 100
      },
      {
        title: 'User Testing Session',
        description: 'Conduct user testing session for the new features',
        creator: manager._id,
        assignedTo: designer._id,
        status: 'on hold',
        priority: 'low',
        startDate: nextWeek,
        dueDate: new Date(nextWeek.getTime() + 3 * 24 * 60 * 60 * 1000),
        progress: 0
      },
      {
        title: 'Weekly Team Meeting',
        description: 'Discuss project progress and address any blockers',
        creator: manager._id,
        assignedTo: manager._id,
        status: 'open',
        priority: 'medium',
        startDate: tomorrow,
        dueDate: tomorrow,
        progress: 0
      },
      {
        title: 'Code Review',
        description: 'Review pull request for the authentication feature',
        creator: manager._id,
        assignedTo: developers[0]._id,
        status: 'open',
        priority: 'high',
        startDate: today,
        dueDate: tomorrow,
        progress: 0
      }
    ];

    const createdTasks = await Task.insertMany(tasks);
    console.log(`${createdTasks.length} tasks created`);
    return createdTasks;
  } catch (error) {
    console.error('Error creating tasks:', error.message);
    process.exit(1);
  }
};

// Create sample leave requests
const createLeaves = async (users) => {
  try {
    const developers = users.filter(user => 
      user.position.includes('Developer') && user.role === 'employee'
    );
    const designer = users.find(user => user.position.includes('Designer'));
    const manager = users.find(user => user.role === 'manager');

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const leaves = [
      {
        user: developers[0]._id,
        startDate: nextWeek,
        endDate: new Date(nextWeek.getTime() + 2 * 24 * 60 * 60 * 1000),
        reason: 'Family vacation',
        status: 'pending',
        leaveType: 'vacation'
      },
      {
        user: designers._id,
        startDate: nextWeek,
        endDate: new Date(nextWeek.getTime() + 1 * 24 * 60 * 60 * 1000),
        reason: 'Medical appointment',
        status: 'approved',
        leaveType: 'sick',
        approvedBy: manager._id,
        approvedAt: today
      },
      {
        user: developers[1]._id,
        startDate: lastWeek,
        endDate: new Date(lastWeek.getTime() + 1 * 24 * 60 * 60 * 1000),
        reason: 'Personal emergency',
        status: 'completed',
        leaveType: 'personal'
      },
      {
        user: manager._id,
        startDate: new Date(nextWeek.getTime() + 14 * 24 * 60 * 60 * 1000),
        endDate: new Date(nextWeek.getTime() + 18 * 24 * 60 * 60 * 1000),
        reason: 'Annual vacation',
        status: 'pending',
        leaveType: 'vacation'
      }
    ];

    const createdLeaves = await Leave.insertMany(leaves);
    console.log(`${createdLeaves.length} leave requests created`);
    return createdLeaves;
  } catch (error) {
    console.error('Error creating leave requests:', error.message);
    process.exit(1);
  }
};

// Main seeding function
const seedData = async () => {
  try {
    await connectDB();
    await clearDatabase();
    const users = await createUsers();
    await createTasks(users);
    await createLeaves(users);
    
    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error.message);
    process.exit(1);
  }
};

// Run the seeding function
seedData(); 
 