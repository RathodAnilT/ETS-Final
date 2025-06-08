import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import userContext from '../../context/userContext';
import { Spinner, Table, Badge, Button, Modal, Form, Alert, Card, Row, Col } from 'react-bootstrap';
import { FaTasks, FaCalendarAlt, FaCheckCircle, FaClock, FaExclamationTriangle, FaHourglassHalf, FaSync, FaInfoCircle, FaUser, FaBuilding, FaCheck, FaPause, FaSpinner, FaFlag, FaExclamationCircle, FaMediumM, FaArrowDown, FaTimes } from 'react-icons/fa';
import './UserTasks.css';

const UserTasks = ({ userId }) => {
  const auth = useContext(userContext);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // State for completion request modal
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestFeedback, setRequestFeedback] = useState({ message: '', type: '' });
  const [isManagerOrAdmin, setIsManagerOrAdmin] = useState(false);

  // State for task details modal
  const [showTaskDetailsModal, setShowTaskDetailsModal] = useState(false);

  // State for review modal
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewStatus, setReviewStatus] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewFeedback, setReviewFeedback] = useState({ message: '', type: '' });

  // State for success notification modal
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [noTasksFound, setNoTasksFound] = useState(false);

  const fetchUserTasks = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('userToken');
      const userId = auth.userId;
      
      console.log('Fetching tasks for user ID:', userId);
      
      const allTasksResponse = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/tasks`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      // Debug the API response structure
      console.log('API Response:', allTasksResponse.data);
      
      // Check if we have valid data
      if (!allTasksResponse.data) {
        setError('No data received from server');
        setLoading(false);
        return;
      }
      
      // Handle different response structures
      const allTasks = allTasksResponse.data.tasks || allTasksResponse.data.data || [];
      
      // Filter tasks assigned to the current user
      const userTasks = allTasks.filter(task => {
        if (!task.assignedTo) return false;
        
        // Handle different assignedTo structures
        if (Array.isArray(task.assignedTo)) {
          // If assignedTo is an array of user IDs
          return task.assignedTo.some(assignee => 
            (typeof assignee === 'string' && assignee === userId) ||
            (assignee._id && assignee._id === userId)
          );
        } else if (typeof task.assignedTo === 'object') {
          // If assignedTo is a user object
          return task.assignedTo._id === userId;
        } else {
          // If assignedTo is a user ID string
          return task.assignedTo === userId;
        }
      });
      
      console.log('Filtered user tasks:', userTasks.length);
      
      if (userTasks.length === 0) {
        setNoTasksFound(true);
        setError("No tasks assigned to you");
      } else {
        setTasks(userTasks);
        setNoTasksFound(false);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Failed to fetch tasks. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserTasks();
    
    // Check if user is manager or admin
    const checkUserRole = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        // Get current user profile to determine role
        const response = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/api/users/profile`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        if (response.data.success && response.data.user) {
          // Set isManagerOrAdmin based on user role
          const userRole = response.data.user.role;
          setIsManagerOrAdmin(userRole === 'Admin' || userRole === 'Manager');
        }
      } catch (error) {
        console.error("Error checking user role:", error);
      }
    };
    
    checkUserRole();
    
    // Set up a refresh interval to keep tasks updated
    const interval = setInterval(() => fetchUserTasks(), 300000); // Refresh every 5 minutes
    
    return () => clearInterval(interval);
  }, [userId, auth.userId]);

  // Handle manual refresh
  const handleManualRefresh = () => {
    fetchUserTasks();
  };

  // Priority badge component
  const PriorityBadge = ({ priority }) => {
    const priorityLower = priority?.toLowerCase() || "low";
    
    const getIcon = () => {
      switch (priorityLower) {
        case "high":
          return <FaExclamationCircle className="me-1" />;
        case "medium":
          return <FaMediumM className="me-1" />;
        case "low":
          return <FaArrowDown className="me-1" />;
        default:
          return <FaFlag className="me-1" />;
      }
    };
    
    return (
      <div className="badge-container">
        <span className={`task-priority-badge priority-${priorityLower}`}>
          {getIcon()} {priority}
        </span>
      </div>
    );
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    const statusLower = status?.toLowerCase() || "incomplete";
    
    const getIcon = () => {
      switch (statusLower) {
        case "completed":
          return <FaCheck className="me-1" />;
        case "completion_requested":
          return <FaClock className="me-1" />;
        case "on_hold":
          return <FaPause className="me-1" />;
        case "rejected":
          return <FaTimes className="me-1" />;
        default:
          return <FaSpinner className="me-1" />;
      }
    };
    
    const getDisplayText = () => {
      switch (statusLower) {
        case "completion_requested":
          return "Pending Approval";
        case "on_hold":
          return "On Hold";
        case "rejected":
          return "Rejected";
        default:
          return status;
      }
    };
    
    return (
      <div className="badge-container">
        <span className={`task-status-badge status-${statusLower}`}>
          {getIcon()} {getDisplayText()}
        </span>
      </div>
    );
  };

  // Check if task is overdue
  const isTaskOverdue = (dueDate) => {
    if (!dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(dueDate);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate < today;
  };

  // Check if task is due today
  const isTaskDueToday = (dueDate) => {
    if (!dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(dueDate);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate.getTime() === today.getTime();
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "No date";
    
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Handle opening the completion request modal
  const handleRequestCompletion = (task) => {
    setSelectedTask(task);
    setCompletionNotes('');
    setRequestFeedback({ message: '', type: '' });
    setShowCompletionModal(true);
  };

  // Submit task completion request
  const submitCompletionRequest = async () => {
    if (!selectedTask || !selectedTask._id) {
      console.error("Task ID not available:", selectedTask);
      setRequestFeedback({ message: 'Task ID is missing. Please try again or refresh the page.', type: 'danger' });
      return;
    }

    console.log("Submitting completion request for task:", selectedTask._id);
    setRequestSubmitting(true);
    setRequestFeedback({ message: '', type: '' });
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/tasks/${selectedTask._id}/completion-request`,
        { completionNotes },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        setRequestFeedback({ 
          message: response.data.message || 'Task completion requested successfully!', 
          type: 'success' 
        });
        
        // Show success message
        setSuccessMessage(response.data.message || 'Your completion request has been submitted!');
        
        setTimeout(() => {
          setShowCompletionModal(false);
          setShowSuccessModal(true);
          
          // Close success modal after some time and refresh tasks
          setTimeout(() => {
            setShowSuccessModal(false);
            fetchUserTasks(); // Refresh tasks
          }, 2000);
        }, 500);
      } else {
        setRequestFeedback({ message: response.data.message || 'Failed to submit request', type: 'danger' });
      }
    } catch (error) {
      console.error('Error submitting completion request:', error);
      
      // Check if we got a specific error message from the server
      const errorMessage = error.response?.data?.message || 'Failed to submit completion request';
      
      // If error is about existing completion request, show a more helpful message
      if (errorMessage.includes('already requested completion')) {
        setRequestFeedback({ 
          message: 'You have already submitted your part of this task.', 
          type: 'warning' 
        });
      } else {
        setRequestFeedback({ message: errorMessage, type: 'danger' });
      }
    } finally {
      setRequestSubmitting(false);
    }
  };

  // Check if the current user is viewing their own tasks (not someone else's)
  const isCurrentUserView = !userId || userId === auth.userId;

  // Open task details modal
  const handleViewTaskDetails = (task) => {
    setSelectedTask(task);
    setShowTaskDetailsModal(true);
  };

  // Group tasks by status
  const groupedTasks = tasks.reduce((acc, task) => {
    const status = task.status?.toLowerCase() || 'incomplete';
    
    // If task was rejected, it should be in pending/incomplete
    if (status === 'rejected') {
      acc.pending.push(task);
    } else if (status === 'completed') {
      acc.completed.push(task);
    } else if (status === 'completion_requested') {
      acc.awaitingApproval.push(task);
    } else {
      acc.pending.push(task);
    }
    
    return acc;
  }, {
    pending: [],
    completed: [],
    awaitingApproval: []
  });

  // Check if the current user is the creator of the task
  const isTaskCreator = (task) => {
    if (!task || !task.createdBy || !auth.userId) return false;
    
    // Check if createdBy is an object with _id or id property
    if (typeof task.createdBy === 'object') {
      return task.createdBy._id === auth.userId || task.createdBy.id === auth.userId;
    }
    
    // Check if createdBy is a direct ID reference
    return task.createdBy === auth.userId;
  };
  
  // Check if the user can review task completion
  const canReviewTaskCompletion = (task) => {
    // Only task creators can review task completions (or managers/admins)
    return isTaskCreator(task) || isManagerOrAdmin;
  };

  // Handle opening the review completion modal
  const handleReviewCompletion = (task, initialStatus) => {
    setSelectedTask(task);
    setReviewStatus(initialStatus); // 'approved' or 'rejected'
    setReviewNotes('');
    setReviewFeedback({ message: '', type: '' });
    setShowReviewModal(true);
  };

  // Handle submitting the review decision
  const submitCompletionReview = async () => {
    if (!selectedTask || !reviewStatus) return;
    
    setReviewSubmitting(true);
    setReviewFeedback({ message: '', type: '' });
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `${process.env.REACT_APP_BACKEND_URL}/api/tasks/${selectedTask._id}/review-completion`,
        { 
          status: reviewStatus,
          reviewNotes: reviewNotes
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        setReviewFeedback({ 
          message: `Task completion ${reviewStatus === 'approved' ? 'approved' : 'rejected'} successfully!`, 
          type: 'success' 
        });
        
        // Show the success modal with proper message
        setSuccessMessage(reviewStatus === 'approved' 
          ? 'Task approved successfully!' 
          : 'Task rejected and returned to assignee.'
        );
        
        setTimeout(() => {
          setShowReviewModal(false);
          setShowSuccessModal(true);
          
          // Close success modal after some time and refresh tasks
          setTimeout(() => {
            setShowSuccessModal(false);
            fetchUserTasks(); // Refresh tasks
          }, 2000);
        }, 500);
      } else {
        setReviewFeedback({ message: response.data.message || 'Failed to submit review', type: 'danger' });
      }
    } catch (error) {
      console.error('Error submitting completion review:', error);
      let errorMessage = 'Failed to submit review';
      
      if (error.response && error.response.data) {
        // Get detailed error message
        errorMessage = error.response.data.message || errorMessage;
      }
      
      setReviewFeedback({ 
        message: errorMessage,
        type: 'danger' 
      });
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <div className="user-tasks-wrapper">
      <div className="tasks-header">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="tasks-title">
            <FaTasks className="me-2" /> 
            {userId && userId !== auth.userId ? "Assigned Tasks" : "My Tasks"}
          </h4>
          <div>
            <Badge bg="primary" className="task-count-badge me-2">
              {tasks.length} {tasks.length === 1 ? 'Task' : 'Tasks'}
            </Badge>
            <Button 
              variant="outline-primary" 
              size="sm" 
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="refresh-btn"
            >
              <FaSync className={refreshing ? "spin-animation" : ""} />
            </Button>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="loading-container">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : noTasksFound ? (
        <Alert variant="info" className="text-center p-4">
          <FaInfoCircle className="me-2" />
          No tasks assigned to you. Check back later!
        </Alert>
      ) : (
        <>
          {tasks.length === 0 ? (
            <div className="no-tasks">
              <div className="no-tasks-icon">
                <FaCheckCircle />
              </div>
              <h5>No Tasks Assigned</h5>
              <p>{error || 'There are currently no tasks assigned.'}</p>
            </div>
          ) : (
            <div className="tasks-sections">
              {/* Tasks that need attention first (in progress, overdue, due today) */}
              {groupedTasks.pending.length > 0 && (
                <div className="task-section mb-4">
                  <h5 className="section-heading">
                    <FaClock className="me-2" /> In Progress
                    <Badge bg="primary" pill className="ms-2">{groupedTasks.pending.length}</Badge>
                  </h5>
                  <div className="tasks-table-wrapper">
                    <Table hover responsive className="tasks-table">
                      <thead>
                        <tr>
                          <th>Task</th>
                          <th>Priority</th>
                          <th>Status</th>
                          <th>Due&nbsp;Date</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupedTasks.pending.map(task => (
                          <tr 
                            key={task._id || task.id} 
                            className={isTaskOverdue(task.dueDate) ? 'overdue-row' : isTaskDueToday(task.dueDate) ? 'due-today-row' : ''}
                            onClick={() => handleViewTaskDetails(task)}
                          >
                            <td className="task-name-cell-clickable">
                              <div className="task-name-cell">
                                <div className="task-name">{task.title}</div>
                                {task.description && (
                                  <div className="task-description">{task.description}</div>
                                )}
                                <small className="text-muted">
                                  Created by: {task.createdBy?.name || 'Unknown'}
                                </small>
                              </div>
                            </td>
                            <td><PriorityBadge priority={task.priority} /></td>
                            <td><StatusBadge status={task.status} /></td>
                            <td>
                              <div className="due-date-cell">
                                <FaCalendarAlt className="calendar-icon" />
                                <span className={
                                  isTaskOverdue(task.dueDate) ? 'text-danger' : 
                                  isTaskDueToday(task.dueDate) ? 'text-warning' : ''
                                }>
                                  {task.dueDate ? formatDate(task.dueDate) : 'Not set'}
                                  {isTaskOverdue(task.dueDate) && (
                                    <Badge bg="danger" pill className="ms-1">Overdue</Badge>
                                  )}
                                  {isTaskDueToday(task.dueDate) && (
                                    <Badge bg="warning" text="dark" pill className="ms-1">Today</Badge>
                                  )}
                                </span>
                              </div>
                            </td>
                            <td onClick={(e) => e.stopPropagation()}>
                              <Button 
                                variant="outline-success" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRequestCompletion(task);
                                }}
                                className="task-action-btn"
                              >
                                <FaCheckCircle className="me-1" /> Complete
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </div>
              )}
              
              {/* Tasks awaiting approval - Only show to task creators or managers/admins */}
              {groupedTasks.awaitingApproval.length > 0 && (isManagerOrAdmin || groupedTasks.awaitingApproval.some(task => isTaskCreator(task))) && (
                <div className="task-section mb-4">
                  <h5 className="section-heading">
                    <FaHourglassHalf className="me-2" /> Awaiting Approval
                    <Badge bg="info" pill className="ms-2">
                      {groupedTasks.awaitingApproval.filter(task => isTaskCreator(task) || isManagerOrAdmin).length}
                    </Badge>
                    {isManagerOrAdmin && 
                      <span className="ms-2 badge bg-light text-dark">Manager View</span>
                    }
                  </h5>
                  <div className="tasks-table-wrapper">
                    <Table hover responsive className="tasks-table">
                      <thead>
                        <tr>
                          <th>Task</th>
                          <th>Priority</th>
                          <th>Status</th>
                          <th>Due&nbsp;Date</th>
                          <th>Requested</th>
                          {/* Only show Actions column if user can review */}
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupedTasks.awaitingApproval
                          // Only show tasks the user created or is allowed to review
                          .filter(task => isTaskCreator(task) || isManagerOrAdmin)
                          .map(task => (
                          <tr 
                            key={task._id || task.id} 
                            className="awaiting-approval-row" 
                            onClick={() => handleViewTaskDetails(task)}
                          >
                            <td className="task-name-cell-clickable">
                              <div className="task-name-cell">
                                <div className="task-name">{task.title}</div>
                                {task.description && (
                                  <div className="task-description">{task.description}</div>
                                )}
                                <small className="text-muted">
                                  Created by: {task.createdBy?.name || 'Unknown'}
                                </small>
                              </div>
                            </td>
                            <td><PriorityBadge priority={task.priority} /></td>
                            <td>
                              <Badge bg="info" className="pending-approval-badge">
                                <FaHourglassHalf className="me-1" /> Awaiting
                              </Badge>
                            </td>
                            <td>
                              <div className="due-date-cell">
                                <FaCalendarAlt className="calendar-icon" />
                                {task.dueDate ? formatDate(task.dueDate) : 'Not set'}
                              </div>
                            </td>
                            <td>
                              {task.completionRequest?.requestedAt ? 
                                formatDate(task.completionRequest.requestedAt) : 
                                'Just now'}
                            </td>
                            {/* Show actions column for everyone, but with different content */}
                            <td onClick={(e) => e.stopPropagation()}>
                              {canReviewTaskCompletion(task) ? (
                                <div className="d-flex justify-content-center gap-2">
                                  <Button 
                                    variant="outline-success" 
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleReviewCompletion(task, 'approved');
                                    }}
                                    className="task-action-btn"
                                  >
                                    <FaCheck className="me-1" /> Approve
                                  </Button>
                                  <Button 
                                    variant="outline-danger" 
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleReviewCompletion(task, 'rejected');
                                    }}
                                    className="task-action-btn"
                                  >
                                    <FaTimes className="me-1" /> Reject
                                  </Button>
                                </div>
                              ) : (
                                <Badge bg="secondary" className="not-authorized-badge">
                                  <FaInfoCircle className="me-1" /> Awaiting Creator Review
                                </Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </div>
              )}
              
              {/* Completed tasks */}
              {groupedTasks.completed.length > 0 && (
                <div className="task-section mb-4">
                  <h5 className="section-heading">
                    <FaCheckCircle className="me-2" /> Completed
                    <Badge bg="success" pill className="ms-2">{groupedTasks.completed.length}</Badge>
                  </h5>
                  <div className="tasks-table-wrapper">
                    <Table hover responsive className="tasks-table">
                      <thead>
                        <tr>
                          <th>Task</th>
                          <th>Priority</th>
                          <th>Status</th>
                          <th>Due&nbsp;Date</th>
                          <th>Completed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupedTasks.completed.map(task => (
                          <tr 
                            key={task._id || task.id} 
                            className="completed-row"
                            onClick={() => handleViewTaskDetails(task)}
                          >
                            <td className="task-name-cell-clickable">
                              <div className="task-name-cell">
                                <div className="task-name">{task.title}</div>
                                {task.description && (
                                  <div className="task-description">{task.description}</div>
                                )}
                                <small className="text-muted">
                                  Created by: {task.createdBy?.name || 'Unknown'}
                                </small>
                              </div>
                            </td>
                            <td><PriorityBadge priority={task.priority} /></td>
                            <td><StatusBadge status={task.status} /></td>
                            <td>
                              <div className="due-date-cell">
                                <FaCalendarAlt className="calendar-icon" />
                                {task.dueDate ? formatDate(task.dueDate) : 'Not set'}
                              </div>
                            </td>
                            <td>
                              {task.completedAt ? formatDate(task.completedAt) : 'Unknown'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Task Completion Request Modal */}
      <Modal 
        show={showCompletionModal} 
        onHide={() => setShowCompletionModal(false)}
        centered
        className="completion-request-modal"
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title>Request Task Completion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedTask && (
            <div>
              <h5>{selectedTask.title}</h5>
              <p className="text-muted small mb-3">{selectedTask.description || 'No description'}</p>
              
              {selectedTask.assignedTo && selectedTask.assignedTo.length > 1 && (
                <Alert variant="info" className="mb-3">
                  <FaInfoCircle className="me-2" /> 
                  <strong>Multi-assignee task:</strong> This task is assigned to multiple people. Each person should submit their own part when complete. The task will only be marked fully complete when all assignees have submitted their parts.
                </Alert>
              )}
              
              <Alert variant="info">
                <FaInfoCircle className="me-2" /> 
                This will notify the task creator that you have completed your part of this task. They will review and approve or reject your request.
              </Alert>
              
              <Form.Group className="mb-3">
                <Form.Label>Completion Notes (Optional)</Form.Label>
                <Form.Control 
                  as="textarea" 
                  rows={3} 
                  placeholder="Add any notes about how you completed your part of the task..."
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                />
              </Form.Group>

              {requestFeedback.message && (
                <Alert variant={requestFeedback.type} className="mt-3">
                  {requestFeedback.message}
                </Alert>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCompletionModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="success" 
            onClick={submitCompletionRequest}
            disabled={requestSubmitting}
            className="task-action-btn"
          >
            {requestSubmitting ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                Submitting...
              </>
            ) : (
              <>
                <FaCheckCircle className="me-1" /> Submit Request
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Task Details Modal */}
      <Modal 
        show={showTaskDetailsModal} 
        onHide={() => setShowTaskDetailsModal(false)}
        size="lg"
        centered
        className="task-details-modal"
        dialogClassName="modal-dialog-centered"
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title>Task Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedTask && (
            <div className="task-details-content">
              <div className="task-detail-header">
                <h4>{selectedTask.title}</h4>
                <div className="d-flex gap-2 mt-2">
                  <PriorityBadge priority={selectedTask.priority} />
                  <StatusBadge status={selectedTask.status} />
                </div>
              </div>
              
              <Row className="mt-4">
                <Col md={6}>
                  <div className="detail-section">
                    <h5 className="detail-section-title">
                      <FaCalendarAlt className="me-2" /> Timeline
                    </h5>
                    <div className="detail-item">
                      <span className="detail-label">Due Date:</span>
                      <span className={`detail-value ${isTaskOverdue(selectedTask.dueDate) ? 'text-danger' : ''}`}>
                        {selectedTask.dueDate ? formatDate(selectedTask.dueDate) : 'Not set'}
                        {isTaskOverdue(selectedTask.dueDate) && (
                          <Badge bg="danger" pill className="ms-2">Overdue</Badge>
                        )}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Created:</span>
                      <span className="detail-value">
                        {selectedTask.createdAt ? formatDate(selectedTask.createdAt) : 'Unknown'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Last Updated:</span>
                      <span className="detail-value">
                        {selectedTask.updatedAt ? formatDate(selectedTask.updatedAt) : 'Unknown'}
                      </span>
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="detail-section">
                    <h5 className="detail-section-title">
                      <FaUser className="me-2" /> People
                    </h5>
                    <div className="detail-item">
                      <span className="detail-label">Created By:</span>
                      <span className="detail-value">
                        {selectedTask.createdBy?.name || 'Unknown'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Assigned To:</span>
                      <span className="detail-value">
                        {Array.isArray(selectedTask.assignedTo) 
                          ? selectedTask.assignedTo.map(user => user.name || 'Unknown').join(', ')
                          : selectedTask.assignedTo?.name || 'Unassigned'}
                      </span>
                    </div>
                    {selectedTask.assignedTo && Array.isArray(selectedTask.assignedTo) && selectedTask.assignedTo[0]?.department && (
                      <div className="detail-item">
                        <span className="detail-label">Department:</span>
                        <span className="detail-value">
                          <FaBuilding className="me-1" />
                          {selectedTask.assignedTo[0].department}
                        </span>
                      </div>
                    )}
                  </div>
                </Col>
              </Row>
              
              <div className="detail-section mt-3">
                <h5 className="detail-section-title">Description</h5>
                <div className="task-description-box">
                  {selectedTask.description || 'No description provided.'}
                </div>
              </div>
              
              {selectedTask.completionRequest && (
                <div className="detail-section mt-3">
                  <h5 className="detail-section-title">Completion Request</h5>
                  <Card className="completion-request-info">
                    <Card.Body>
                      <div className="detail-item">
                        <span className="detail-label">Requested By:</span>
                        <span className="detail-value">
                          {selectedTask.completionRequest.requestedBy?.name || 'Unknown'}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Requested On:</span>
                        <span className="detail-value">
                          {selectedTask.completionRequest.requestedAt ? formatDate(selectedTask.completionRequest.requestedAt) : 'Unknown'}
                        </span>
                      </div>
                      {selectedTask.completionRequest.notes && (
                        <div className="detail-item">
                          <span className="detail-label">Notes:</span>
                          <div className="completion-notes">
                            {selectedTask.completionRequest.notes}
                          </div>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <div>
            <Button variant="secondary" onClick={() => setShowTaskDetailsModal(false)}>
              Close
            </Button>
          </div>
          {selectedTask && selectedTask.status !== 'completed' && selectedTask.status !== 'completion_requested' && (
            <div>
              <Button 
                variant="success"
                className="task-action-btn"
                onClick={() => {
                  setShowTaskDetailsModal(false);
                  handleRequestCompletion(selectedTask);
                }}
              >
                <FaCheckCircle className="me-1" /> Request Completion
              </Button>
            </div>
          )}
          {selectedTask && selectedTask.status === 'completion_requested' && canReviewTaskCompletion(selectedTask) && (
            <div className="d-flex gap-2">
              <Button 
                variant="success"
                className="task-action-btn"
                onClick={() => {
                  setShowTaskDetailsModal(false);
                  handleReviewCompletion(selectedTask, 'approved');
                }}
              >
                <FaCheck className="me-1" /> Approve
              </Button>
              <Button 
                variant="danger"
                className="task-action-btn"
                onClick={() => {
                  setShowTaskDetailsModal(false);
                  handleReviewCompletion(selectedTask, 'rejected');
                }}
              >
                <FaTimes className="me-1" /> Reject
              </Button>
            </div>
          )}
        </Modal.Footer>
      </Modal>

      {/* Task Completion Review Modal */}
      <Modal 
        show={showReviewModal} 
        onHide={() => setShowReviewModal(false)}
        centered
        className="completion-request-modal"
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {reviewStatus === 'approved' ? 'Approve Task Completion' : 'Reject Task Completion'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedTask && (
            <div>
              <h5>{selectedTask.title}</h5>
              <p className="text-muted small mb-3">{selectedTask.description || 'No description'}</p>
              
              <Alert variant={reviewStatus === 'approved' ? 'success' : 'warning'}>
                <FaInfoCircle className="me-2" /> 
                {reviewStatus === 'approved' 
                  ? 'You are about to approve this task as complete.' 
                  : 'You are about to reject this completion request. The task will return to incomplete status.'
                }
              </Alert>
              
              {selectedTask.completionRequest?.notes && (
                <div className="mb-3">
                  <h6>Completion Notes from Assignee:</h6>
                  <div className="p-2 bg-light rounded">
                    {selectedTask.completionRequest.notes}
                  </div>
                </div>
              )}
              
              <Form.Group className="mb-3">
                <Form.Label>
                  {reviewStatus === 'approved' ? 'Approval Notes (Optional)' : 'Rejection Reason (Optional)'}
                </Form.Label>
                <Form.Control 
                  as="textarea" 
                  rows={3} 
                  placeholder={reviewStatus === 'approved' 
                    ? "Add any notes about the task completion..." 
                    : "Provide feedback about why the task completion is being rejected..."
                  }
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                />
              </Form.Group>

              {reviewFeedback.message && (
                <Alert variant={reviewFeedback.type} className="mt-3">
                  {reviewFeedback.message}
                </Alert>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowReviewModal(false)}>
            Cancel
          </Button>
          <Button 
            variant={reviewStatus === 'approved' ? "success" : "danger"} 
            onClick={submitCompletionReview}
            disabled={reviewSubmitting}
            className="task-action-btn"
          >
            {reviewSubmitting ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                Submitting...
              </>
            ) : (
              <>
                {reviewStatus === 'approved' ? (
                  <><FaCheck className="me-1" /> Approve Task</>
                ) : (
                  <><FaTimes className="me-1" /> Reject Task</>
                )}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Success Notification Modal */}
      <Modal 
        show={showSuccessModal} 
        onHide={() => setShowSuccessModal(false)}
        centered
        size="sm"
        backdrop="static"
        keyboard={false}
      >
        <Modal.Body className="text-center p-4">
          <div className="mb-3">
            <svg width="50" height="50" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#52c41a"/>
            </svg>
          </div>
          <h4 className="mb-3">{successMessage}</h4>
          <p className="text-muted">Refreshing task data...</p>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default UserTasks; 