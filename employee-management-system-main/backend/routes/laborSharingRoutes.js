const express = require('express');
const router = express.Router();
const LaborSharing = require('../models/LaborSharing');
const User = require('../models/User');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const nodemailer = require('nodemailer');

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Department capacity configuration
const DEPARTMENT_CAPACITY = {
  IT: 20,
  HR: 15,
  Finance: 15,
  Operations: 25
};

// Helper function to check department capacity
const checkDepartmentCapacity = async (department) => {
  const activeRequests = await LaborSharing.countDocuments({
    department,
    status: 'approved',
    endDate: { $gte: new Date() }
  });
  return activeRequests < DEPARTMENT_CAPACITY[department];
};

// Helper function to send email notifications
const sendEmailNotification = async (to, subject, text) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text
    });
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

// Get all labor sharing requests (admin only)
router.get('/requests', auth, adminAuth, async (req, res) => {
  try {
    const requests = await LaborSharing.find()
      .populate('employeeId', 'name department email')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });

    const formattedRequests = requests.map(request => ({
      _id: request._id,
      employeeName: request.employeeId.name,
      employeeEmail: request.employeeId.email,
      department: request.department,
      duration: request.duration,
      reason: request.reason,
      status: request.status,
      startDate: request.startDate,
      endDate: request.endDate,
      approvedBy: request.approvedBy ? request.approvedBy.name : null,
      approvedAt: request.approvedAt
    }));

    res.json(formattedRequests);
  } catch (error) {
    console.error('Error fetching labor sharing requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get department capacity information
router.get('/department-capacity', auth, async (req, res) => {
  try {
    const capacityInfo = {};
    for (const dept in DEPARTMENT_CAPACITY) {
      const activeCount = await LaborSharing.countDocuments({
        department: dept,
        status: 'approved',
        endDate: { $gte: new Date() }
      });
      capacityInfo[dept] = {
        total: DEPARTMENT_CAPACITY[dept],
        current: activeCount,
        available: DEPARTMENT_CAPACITY[dept] - activeCount
      };
    }
    res.json(capacityInfo);
  } catch (error) {
    console.error('Error fetching department capacity:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new labor sharing request
router.post('/request', auth, async (req, res) => {
  try {
    const { employeeId, department, duration, reason } = req.body;

    // Validation
    if (!employeeId || !department || !duration || !reason) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (duration < 1 || duration > 12) {
      return res.status(400).json({ message: 'Duration must be between 1 and 12 weeks' });
    }

    // Check if employee exists
    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Check if employee already has a pending request
    const existingRequest = await LaborSharing.findOne({
      employeeId,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'Employee already has a pending request' });
    }

    // Check if employee is already in a labor sharing program
    const activeRequest = await LaborSharing.findOne({
      employeeId,
      status: 'approved',
      endDate: { $gte: new Date() }
    });

    if (activeRequest) {
      return res.status(400).json({ message: 'Employee is already in a labor sharing program' });
    }

    // Check department capacity
    const hasCapacity = await checkDepartmentCapacity(department);
    if (!hasCapacity) {
      return res.status(400).json({ message: 'Department has reached its capacity' });
    }

    const newRequest = new LaborSharing({
      employeeId,
      department,
      duration,
      reason
    });

    await newRequest.save();

    // Send email notification to admin
    const admins = await User.find({ isSuperUser: true });
    const adminEmails = admins.map(admin => admin.email);
    
    await sendEmailNotification(
      adminEmails,
      'New Labor Sharing Request',
      `A new labor sharing request has been submitted by ${employee.name} for the ${department} department.`
    );

    res.status(201).json(newRequest);
  } catch (error) {
    console.error('Error creating labor sharing request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve labor sharing request (admin only)
router.put('/requests/:id/approve', auth, adminAuth, async (req, res) => {
  try {
    const request = await LaborSharing.findById(req.params.id)
      .populate('employeeId', 'name email department');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request is not pending' });
    }

    // Check department capacity again before approving
    const hasCapacity = await checkDepartmentCapacity(request.department);
    if (!hasCapacity) {
      return res.status(400).json({ message: 'Department has reached its capacity' });
    }

    request.status = 'approved';
    request.approvedBy = req.user.id;
    request.approvedAt = new Date();

    await request.save();

    // Send email notification to employee
    await sendEmailNotification(
      request.employeeId.email,
      'Labor Sharing Request Approved',
      `Your labor sharing request to the ${request.department} department has been approved.`
    );

    res.json(request);
  } catch (error) {
    console.error('Error approving labor sharing request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reject labor sharing request (admin only)
router.put('/requests/:id/reject', auth, adminAuth, async (req, res) => {
  try {
    const request = await LaborSharing.findById(req.params.id)
      .populate('employeeId', 'name email department');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request is not pending' });
    }

    request.status = 'rejected';
    request.approvedBy = req.user.id;
    request.approvedAt = new Date();

    await request.save();

    // Send email notification to employee
    await sendEmailNotification(
      request.employeeId.email,
      'Labor Sharing Request Rejected',
      `Your labor sharing request to the ${request.department} department has been rejected.`
    );

    res.json(request);
  } catch (error) {
    console.error('Error rejecting labor sharing request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get employee's labor sharing history
router.get('/employee-history', auth, async (req, res) => {
  try {
    const requests = await LaborSharing.find({ employeeId: req.user.id })
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching employee history:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 