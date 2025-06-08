const express = require('express');
const router = express.Router();
const Task = require('../models/taskModel');
const Leave = require('../models/Leave');
const Attendance = require('../models/Attendance');
const jwt = require('jsonwebtoken');

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    return res.status(403).json({ message: 'Invalid token' });
  }
};

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get task analytics
router.get('/tasks/analytics', async (req, res) => {
  try {
    console.log('Fetching task analytics...');
    const tasks = await Task.find();
    console.log('Found tasks:', tasks);
    
    // If no tasks found, return sample data for testing
    if (!tasks || tasks.length === 0) {
      console.log('No tasks found, returning sample data');
      return res.json([
        { name: 'completed', value: 15 },
        { name: 'pending', value: 8 },
        { name: 'in-progress', value: 12 }
      ]);
    }

    console.log('Processing task data...');
    const analytics = tasks.reduce((acc, task) => {
      const status = task.status ? task.status.toLowerCase() : 'unknown';
      if (!acc[status]) {
        acc[status] = 0;
      }
      acc[status]++;
      return acc;
    }, {});

    const data = Object.entries(analytics).map(([name, value]) => ({
      name,
      value
    }));

    console.log('Sending analytics data:', data);
    res.json(data);
  } catch (error) {
    console.error('Detailed error in task analytics:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      message: 'Error fetching task analytics',
      error: error.message,
      details: error.stack
    });
  }
});

// Get leave analytics
router.get('/leaves/analytics', async (req, res) => {
  try {
    console.log('Fetching leave analytics...');
    const leaves = await Leave.find();
    console.log('Found leaves:', leaves);
    
    // If no leaves found, return sample data for testing
    if (!leaves || leaves.length === 0) {
      console.log('No leaves found, returning sample data');
      return res.json([
        { name: 'Sick', value: 5 },
        { name: 'Casual', value: 8 },
        { name: 'Annual', value: 12 },
        { name: 'Unpaid', value: 2 }
      ]);
    }

    console.log('Processing leave data...');
    const analytics = leaves.reduce((acc, leave) => {
      const type = leave.type ? leave.type.toLowerCase() : 'unknown';
      if (!acc[type]) {
        acc[type] = 0;
      }
      acc[type]++;
      return acc;
    }, {});

    const data = Object.entries(analytics).map(([name, value]) => ({
      name,
      value
    }));

    console.log('Sending analytics data:', data);
    res.json(data);
  } catch (error) {
    console.error('Detailed error in leave analytics:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      message: 'Error fetching leave analytics',
      error: error.message,
      details: error.stack
    });
  }
});

// Get attendance analytics
router.get('/attendance/analytics', async (req, res) => {
  try {
    console.log('Fetching attendance analytics...');
    const attendance = await Attendance.find()
      .sort({ date: -1 })
      .limit(30);
    console.log('Found attendance records:', attendance);
    
    // If no attendance records found, return sample data for testing
    if (!attendance || attendance.length === 0) {
      console.log('No attendance records found, returning sample data');
      const sampleData = [];
      const today = new Date();
      for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        sampleData.push({
          date: date.toISOString().split('T')[0],
          present: Math.floor(Math.random() * 20) + 15,
          absent: Math.floor(Math.random() * 5) + 1
        });
      }
      return res.json(sampleData);
    }

    console.log('Processing attendance data...');
    const data = attendance.map(record => ({
      date: record.date.toISOString().split('T')[0],
      present: record.status === 'present' ? 1 : 0,
      absent: record.status === 'absent' ? 1 : 0
    }));

    console.log('Sending analytics data:', data);
    res.json(data);
  } catch (error) {
    console.error('Detailed error in attendance analytics:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      message: 'Error fetching attendance analytics',
      error: error.message,
      details: error.stack
    });
  }
});

module.exports = router; 