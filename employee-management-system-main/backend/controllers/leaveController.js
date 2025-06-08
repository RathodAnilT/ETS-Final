const userModel = require("../models/user");

const applyForLeave = async (req, res, next) => {
  try {
    const { leaveDays, leaveStartDate, leaveEndDate, reason } = req.body.leaveDate;
    const uid = req.params.uid;

    // Validate required fields
    if (!leaveDays || !leaveStartDate || !leaveEndDate) {
      return res.status(400).json({ 
        success: false,
        message: "Missing required fields: leaveDays, leaveStartDate, or leaveEndDate" 
      });
    }

    // Validate date format and logic
    const startDate = new Date(leaveStartDate);
    const endDate = new Date(leaveEndDate);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid date format" 
      });
    }

    if (startDate > endDate) {
      return res.status(400).json({ 
        success: false,
        message: "Start date cannot be after end date" 
      });
    }

    const user = await userModel.findOneAndUpdate(
      { _id: uid },
      {
        $push: {
          leaveDate: {
            startDate: leaveStartDate,
            leaveDate: leaveEndDate,
            leave_status: "pending",
            leaveDays: leaveDays,
            reason: reason || "",
            appliedAt: new Date(),
          },
        },
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    return res.status(200).json({ 
      success: true,
      message: "Leave request submitted successfully",
      user 
    });
  } catch (error) {
    console.error("Leave submission error:", error);
    return res.status(500).json({ 
      success: false,
      message: "Internal server error",
      error: error.message 
    });
  }
};

const leaveEmployee = async (req, res, next) => {
  try {
    const foundUser = await userModel.find({
      "leaveDate.leave_status": "pending",
    }).select('name email position leaveDate');

    if (!foundUser || foundUser.length === 0) {
      return res.status(200).json({ 
        message: "No pending leave requests found", 
        user: [] 
      });
    }

    return res.status(200).json({ 
      message: "Pending leave requests found", 
      user: foundUser 
    });
  } catch (error) {
    console.error("Error in leaveEmployee:", error);
    return res.status(500).json({ 
      message: "Internal server error",
      error: error.message 
    });
  }
};

const approveLeave = async (req, res, next) => {
  const { applyForLeave, approverId, approverName } = req.body;
  const permission = applyForLeave ? "approved" : "rejected";
  const leave_id = req.params.leaveId;

  try {
    const approver = await userModel.findById(approverId);
    if (!approver) {
      return res.status(404).json({ 
        message: "Approver not found",
        success: false 
      });
    }

    if (!approver.isSuperUser) {
      return res.status(403).json({ 
        message: "Only managers can approve leaves",
        success: false 
      });
    }

    const user = await userModel.findOne({
      "leaveDate._id": leave_id,
      "leaveDate.leave_status": "pending",
    });

    if (!user) {
      return res.status(404).json({ 
        message: "Could not find the user or leave is not pending!" 
      });
    }

    const updatedUser = await userModel.findOneAndUpdate(
      {
        "leaveDate._id": leave_id,
        "leaveDate.leave_status": "pending",
      },
      {
        $set: {
          "leaveDate.$.leave_status": permission,
          "leaveDate.$.approverId": approverId,
          "leaveDate.$.approverName": approverName,
          "leaveDate.$.approvedAt": new Date(),
        },
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ 
        message: "Could not update leave status" 
      });
    }

    return res.status(200).json({ 
      message: `Leave request ${permission} successfully`,
      success: true,
      user: updatedUser
    });
  } catch (error) {
    console.error("Error in approveLeave:", error);
    return res.status(500).json({ 
      message: "Internal server error",
      error: error.message 
    });
  }
};

const getLeaveData = async (req, res, next) => {
  try {
    // Get user ID from params or query
    const userId = req.params.userId || req.query.userId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required"
      });
    }
    
    console.log("Fetching leave data for user:", userId);
    
    const user = await userModel.findById(userId).select('leaveDate');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    return res.status(200).json({
      success: true,
      leaveData: user.leaveDate || []
    });
  } catch (error) {
    console.error("Get leave data error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching leave data",
      error: error.message
    });
  }
};

module.exports = {
  applyForLeave,
  leaveEmployee,
  approveLeave,
  getLeaveData,
};
