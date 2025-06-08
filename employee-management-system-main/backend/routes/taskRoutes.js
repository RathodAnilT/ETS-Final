const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const {
  getTasks,
  getTasksByUserCreated,
  getTasksByUserAssigned,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  getTaskById,
  getTaskStatistics,
  getTaskStats,
  requestTaskCompletion,
  reviewTaskCompletion,
  getPendingCompletionRequests,
  addComment
} = require("../controllers/taskController");
const checkAuth = require("../middleware/check-auth");

// Apply auth middleware to all routes
router.use(checkAuth);

// Get all tasks with filtering and pagination
router.get("/", getTasks);

// Get task statistics
router.get("/statistics", getTaskStatistics);

// Get pending completion requests
router.get("/pending-requests", getPendingCompletionRequests);

// Get task statistics and pending approvals (legacy endpoint)
router.get("/stats", getTaskStatistics);

// Get tasks created by a specific user
router.get("/created-by/:userId", getTasksByUserCreated);

// Get tasks assigned to a specific user
router.get("/assigned-to/:userId", getTasksByUserAssigned);

// Get a single task by ID
router.get("/:taskId", getTaskById);

// Create a new task
router.post(
  "/",
  [
    check("title", "Title is required").not().isEmpty(),
    check("title", "Title must be between 3 and 100 characters").isLength({ min: 3, max: 100 }),
    check("priority").optional().isIn(['low', 'medium', 'high']),
    check("status").optional().isIn(['incomplete', 'on_hold', 'completion_requested', 'completed']),
    check("dueDate").optional().isISO8601().withMessage('Invalid date format')
  ],
  createTask
);

// Update a task
router.put("/:taskId", [
  check("title").optional().isLength({ min: 3, max: 100 }),
  check("priority").optional().isIn(['low', 'medium', 'high']),
  check("status").optional().isIn(['incomplete', 'on_hold', 'completion_requested', 'completed']),
  check("dueDate").optional().isISO8601().withMessage('Invalid date format')
], updateTask);

// Update task status
router.patch("/:taskId/status", updateTaskStatus);

// Add a comment to a task
router.post("/:taskId/comments", [
  check('content', 'Comment content is required').not().isEmpty()
], addComment);

// Request task completion (by assignee)
router.post("/:taskId/completion-request", requestTaskCompletion);

// Review task completion request (approve/reject by manager)
router.patch("/:taskId/review-completion", [
  check("status").isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected'),
], reviewTaskCompletion);

// Delete a task
router.delete("/:taskId", deleteTask);

module.exports = router; 