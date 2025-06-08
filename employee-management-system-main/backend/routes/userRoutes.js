const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const auth = require("../middleware/auth");

// Get admin users
router.get('/admins', auth, userController.getAdmins);

module.exports = router; 
router.get('/admins', auth, userController.getAdmins); 