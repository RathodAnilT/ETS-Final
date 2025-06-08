const express = require("express");
const {
  applyForLeave,
  approveLeave,
  leaveEmployee,
  getLeaveData
} = require("../controllers/leaveController");
const leaveRoutes = express.Router();
const checkAuth = require("../middleware/check-auth");

leaveRoutes.get("/applied-leave", checkAuth, leaveEmployee);
leaveRoutes.get("/leave-data", checkAuth, getLeaveData);
leaveRoutes.get("/user/:userId", checkAuth, getLeaveData);

leaveRoutes.post("/apply-leave/:uid", checkAuth, applyForLeave);
leaveRoutes.patch("/approve-leave/:leaveId", checkAuth, approveLeave);

module.exports = leaveRoutes;
