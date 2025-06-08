const express = require("express");
const {
  displayUser,
  editEmployee,
  getUserById,
  applyForLeave,
  leaveEmployee,
  approveLeave,
  signup,
  loginUser,
  updateUser,
  updateUserImage,
  createTestUser
} = require("../controllers/userController");
const { upload, handleMulterError } = require("../middleware/file-upload");
const checkAuth = require("../middleware/check-auth");
const userRoutes = express.Router();

// Public routes
userRoutes.get("/", displayUser);
userRoutes.get("/:uid", getUserById);
userRoutes.post("/signup", signup);
userRoutes.post("/login", loginUser);
userRoutes.post("/create-test-user", createTestUser);

// Protected routes
userRoutes.use(checkAuth);

userRoutes.patch(
  "/editEmployee/:uid",
  editEmployee
);

userRoutes.patch("/:uid", updateUser);
userRoutes.patch(
  "/:uid/image",
  upload.single("image"),
  handleMulterError,
  updateUserImage
);

module.exports = userRoutes;
