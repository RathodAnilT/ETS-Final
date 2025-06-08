import React, { useState, useEffect, useContext } from 'react';
import { Card, Badge, Button, Spinner, Alert, Modal, Form, ListGroup } from 'react-bootstrap';
import { FaHourglassHalf, FaCheckCircle, FaTimesCircle, FaTasks, FaBell, FaInfoCircle, FaCheck, FaTimes, FaCheckDouble, FaUserClock, FaUserCheck, FaUsers } from 'react-icons/fa';
import axios from 'axios';
import userContext from '../../context/userContext';
import './NotificationCenter.css';

/**
 * NotificationCenter component for displaying task completion requests
 * This component should ONLY be rendered for users who:
 * 1. Are task creators (have created tasks that are assigned to others)
 * 2. Are managers or admins who need to review completion requests
 */
const NotificationCenter = () => {
  const auth = useContext(userContext);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [isTaskCreator, setIsTaskCreator] = useState(false);
  const [createdTasks, setCreatedTasks] = useState([]);
  
  // State for review modal
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewFeedback, setReviewFeedback] = useState({ message: '', type: '' });

  // State for toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState('success');

  // Check if current user is a task creator
  useEffect(() => {
    const checkIfTaskCreator = async () => {
      if (!auth.isLoggedIn) return;
      
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/api/tasks/created-by/${auth.userId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        if (response.data.success && response.data.tasks) {
          const hasTasks = response.data.tasks.length > 0;
          setIsTaskCreator(hasTasks);
          setCreatedTasks(response.data.tasks);
        }
      } catch (err) {
        console.error('Error checking if user is a task creator:', err);
      }
    };
    
    checkIfTaskCreator();
  }, [auth.isLoggedIn, auth.userId]);

  // Fetch notifications function
  const fetchNotifications = async () => {
    if (!auth.isLoggedIn) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/notifications?limit=10`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        // Filter notifications to only show those related to tasks created by the user
        let filteredNotifications = response.data.data;
        
        if (!auth.isSuperUser && isTaskCreator && createdTasks.length > 0) {
          // Get IDs of tasks created by this user
          const createdTaskIds = createdTasks.map(task => task._id);
          
          // Only show notifications for tasks created by this user
          filteredNotifications = response.data.data.filter(notification => 
            notification.task && createdTaskIds.includes(notification.task._id)
          );
        }
        
        setNotifications(filteredNotifications);
        
        // Count unread notifications
        const unread = filteredNotifications.filter(n => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  // Fetch notifications
  useEffect(() => {
    fetchNotifications();
    
    // Set up polling for new notifications
    const intervalId = setInterval(fetchNotifications, 60000); // Poll every minute
    
    return () => clearInterval(intervalId);
  }, [auth.isLoggedIn, isTaskCreator, createdTasks]);

  // Mark notifications as read
  const markAsRead = async (notificationIds = [], markAll = false) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${process.env.REACT_APP_BACKEND_URL}/api/notifications/read`,
        {
          notificationIds,
          markAll
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      // Update local state
      if (markAll) {
        setNotifications(prevNotifications => 
          prevNotifications.map(notification => ({
            ...notification,
            isRead: true
          }))
        );
        setUnreadCount(0);
      } else {
        setNotifications(prevNotifications => 
          prevNotifications.map(notification => 
            notificationIds.includes(notification._id)
              ? { ...notification, isRead: true }
              : notification
          )
        );
        setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
      }
      
      setSuccessMessage('Notifications marked as read');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error marking notifications as read:', err);
      setError('Failed to update notifications');
      setTimeout(() => setError(null), 3000);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSecs < 60) {
      return 'just now';
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }
  };

  // Get icon for notification type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'task_completion':
        return <FaUserClock className="notification-icon" />;
      case 'all_assignees_completed':
        return <FaUsers className="notification-icon all-completed" />;
      case 'task_completion_review':
        return <FaUserCheck className="notification-icon" />;
      default:
        return <FaBell className="notification-icon" />;
    }
  };

  // Handle notification click (navigate to task detail)
  const handleNotificationClick = async (notification) => {
    // If not read, mark as read
    if (!notification.isRead) {
      await markAsRead([notification._id]);
    }
    
    // For task completion notifications, open the review modal
    if (notification.type === 'task_completion' || notification.type === 'all_assignees_completed') {
      if (notification.task) {
        handleReviewRequest(notification.task);
      }
    } else {
      // Navigate to task details or handle click based on notification type
      if (notification.task && notification.task._id) {
        // Implementation would depend on your routing strategy
        // window.location.href = `/tasks/${notification.task._id}`;
        console.log('Navigate to task:', notification.task._id);
      }
    }
  };

  // Handle reviewing a request
  const handleReviewRequest = async (task) => {
    console.log("Selected task for review:", task);
    
    // If task doesn't have complete details, fetch them
    let taskWithDetails = task;
    
    if (!task.completionRequest || !task.assignedTo) {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/api/tasks/${task._id}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        if (response.data.success && response.data.data) {
          taskWithDetails = response.data.data;
          console.log("Retrieved complete task details:", taskWithDetails);
        }
      } catch (error) {
        console.error("Error fetching task details:", error);
        // Continue with what we have
      }
    }
    
    setSelectedTask(taskWithDetails);
    setReviewNotes('');
    setReviewFeedback({ message: '', type: '' });
    setShowReviewModal(true);
    handleNotificationInteraction(); // Clear new request flag when user reviews
  };

  // Submit the review (approve or reject)
  const submitReview = async (status) => {
    if (!selectedTask) return;
    
    console.log("Submitting review for task:", selectedTask);
    
    // Check if this is a direct action (without modal) or from modal
    const isDirectAction = !showReviewModal;
    
    if (!isDirectAction) {
      setReviewSubmitting(true);
      setReviewFeedback({ message: '', type: '' });
    }
    
    // Get task ID, handling different property names
    const taskId = selectedTask._id || selectedTask.id;
    console.log("Using task ID for submission:", taskId);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `${process.env.REACT_APP_BACKEND_URL}/api/tasks/${taskId}/review-completion`,
        { 
          status, 
          reviewNotes
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      console.log("Review response:", response.data);
      
      if (response.data.success) {
        const successMessage = `Task completion ${status === 'approved' ? 'approved' : 'rejected'} successfully!`;
        
        if (isDirectAction) {
          // Show toast for direct actions
          setToastMessage(successMessage);
          setToastVariant(status === 'approved' ? 'success' : 'warning');
          setShowToast(true);
          setTimeout(() => setShowToast(false), 3000);
        } else {
          // Show feedback in modal
          setReviewFeedback({ 
            message: successMessage, 
            type: 'success' 
          });
          
          setTimeout(() => {
            setShowReviewModal(false);
          }, 1500);
        }
        
        // Refresh notifications in either case
        fetchNotifications();
      } else {
        const errorMessage = response.data.message || 'Failed to process request';
        
        if (isDirectAction) {
          setToastMessage(errorMessage);
          setToastVariant('danger');
          setShowToast(true);
          setTimeout(() => setShowToast(false), 3000);
        } else {
          setReviewFeedback({ 
            message: errorMessage, 
            type: 'danger' 
          });
        }
      }
    } catch (error) {
      console.error('Error processing review:', error);
      console.error('Error details:', error.response?.data);
      
      let errorMessage = error.response?.data?.message || 'Failed to process review';
      
      // If we get a 403 Forbidden error, show a more helpful message
      if (error.response?.status === 403) {
        errorMessage = "You are not authorized to review this task. Only the task creator can approve or reject completion requests.";
      }
      
      if (isDirectAction) {
        setToastMessage(errorMessage);
        setToastVariant('danger');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      } else {
        setReviewFeedback({
          message: errorMessage,
          type: 'warning'
        });
      }
    } finally {
      if (!isDirectAction) {
        setReviewSubmitting(false);
      }
    }
  };

  // Get assignee names as string
  const getAssigneeNames = (assignees) => {
    if (!assignees || assignees.length === 0) return 'Unassigned';
    
    return Array.isArray(assignees)
      ? assignees.map(user => user.name).join(', ')
      : assignees.name || 'Unknown';
  };

  // Render completion request card
  const renderRequestCard = (task) => {
    return (
      <Card key={task._id} className="completion-request-card mb-3">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0 task-title">{task.title}</h5>
          <Badge bg="info" className="request-badge">
            <FaHourglassHalf className="me-1" /> Pending Review
          </Badge>
        </Card.Header>
        <Card.Body>
          <div className="request-details">
            <p className="task-description">{task.description || 'No description provided'}</p>
            
            <div className="request-meta">
              <div className="assignee-info">
                <strong>Requested by:</strong> {getAssigneeNames(task.assignedTo)}
              </div>
              
              {task.completionRequest?.requestedAt && (
                <div className="request-time">
                  <strong>Requested on:</strong> {formatDate(task.completionRequest.requestedAt)}
                </div>
              )}
              
              {task.completionRequest?.notes && (
                <div className="request-notes mt-2">
                  <strong>Completion Notes:</strong>
                  <p className="notes-text">{task.completionRequest.notes}</p>
                </div>
              )}
            </div>
            
            <div className="request-actions mt-3">
              <Button 
                variant="success" 
                className="me-2"
                onClick={() => handleReviewRequest(task)}
              >
                <FaCheckCircle className="me-1" /> Review Request
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>
    );
  };

  // When user interacts with notifications, clear the new flag
  const handleNotificationInteraction = () => {
    fetchNotifications();
  };

  if (loading) {
    return (
      <div className="text-center my-4">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading notifications...</p>
      </div>
    );
  }

  // Show message if user doesn't have any created tasks
  if (!auth.isSuperUser && !isTaskCreator && !loading) {
    return (
      <Alert variant="info">
        <FaInfoCircle className="me-2" />
        You don't have any tasks that you've created. When you create and assign tasks to others, you'll be able to see completion requests here.
      </Alert>
    );
  }

  return (
    <div className="notification-center">
      <Alert variant="info" className="notification-info">
        <FaInfoCircle className="me-2" />
        This section shows completion requests for tasks you have created. Only you can approve or reject these requests.
      </Alert>
      
      {/* Feedback Toast for direct actions */}
      {showToast && (
        <div className="notification-toast-container">
          <Alert 
            variant={toastVariant} 
            className="notification-toast"
            dismissible
            onClose={() => setShowToast(false)}
          >
            {toastMessage}
          </Alert>
        </div>
      )}
      
      {successMessage && (
        <Alert variant="success" className="mb-3">
          {successMessage}
        </Alert>
      )}
      
      {error && (
        <Alert variant="danger" className="mb-3">
          {error}
        </Alert>
      )}
      
      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <FaBell className="me-2" />
            Notifications
            {unreadCount > 0 && (
              <Badge bg="danger" pill className="ms-2">
                {unreadCount}
              </Badge>
            )}
          </h5>
          
          {notifications.length > 0 && (
            <Button 
              variant="outline-secondary" 
              size="sm"
              onClick={() => markAsRead([], true)}
              disabled={unreadCount === 0}
            >
              <FaCheckDouble className="me-1" />
              Mark All Read
            </Button>
          )}
        </Card.Header>
        
        <ListGroup variant="flush">
          {notifications.length === 0 ? (
            <ListGroup.Item className="text-center py-4">
              <p className="text-muted mb-0">No notifications to display</p>
            </ListGroup.Item>
          ) : (
            notifications.map(notification => (
              <ListGroup.Item 
                key={notification._id}
                className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="notification-content">
                  <div className="notification-icon-wrapper">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="notification-body">
                    <div className="notification-message">
                      {notification.message}
                    </div>
                    
                    <div className="notification-meta">
                      <span className="notification-time">
                        {formatDate(notification.createdAt)}
                      </span>
                      
                      {notification.type === 'all_assignees_completed' && (
                        <Badge bg="success" pill className="ms-2">
                          All Complete
                        </Badge>
                      )}
                      
                      {!notification.isRead && (
                        <Badge bg="primary" pill className="ms-2">
                          New
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="notification-actions">
                  {(notification.type === 'task_completion' || notification.type === 'all_assignees_completed') && notification.task && (
                    <>
                      <Button 
                        variant="outline-success" 
                        size="sm"
                        className="me-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTask(notification.task);
                          setReviewNotes('');
                          submitReview('approved');
                        }}
                        title="Approve"
                      >
                        <FaCheck />
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        className="me-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTask(notification.task);
                          setReviewNotes('');
                          submitReview('rejected');
                        }}
                        title="Reject"
                      >
                        <FaTimes />
                      </Button>
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        className="me-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReviewRequest(notification.task);
                        }}
                        title="Review Details"
                      >
                        <FaInfoCircle />
                      </Button>
                    </>
                  )}
                  
                  {!notification.isRead && (
                    <Button 
                      variant="outline-secondary" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead([notification._id]);
                      }}
                      title="Mark as Read"
                    >
                      <FaCheck />
                    </Button>
                  )}
                </div>
              </ListGroup.Item>
            ))
          )}
        </ListGroup>
        
        {notifications.length > 0 && (
          <Card.Footer className="text-center">
            <Button 
              variant="link" 
              size="sm"
              className="text-muted"
              onClick={() => {/* Implementation for view all notifications */}}
            >
              View all notifications
            </Button>
          </Card.Footer>
        )}
      </Card>
      
      {/* Review Modal */}
      <Modal show={showReviewModal} onHide={() => setShowReviewModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Review Completion Request</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedTask && (
            <div>
              <h5>{selectedTask.title}</h5>
              <p className="text-muted small">{selectedTask.description || 'No description'}</p>
              
              {selectedTask.completionRequest?.notes && (
                <div className="mb-3">
                  <Alert variant="info">
                    <strong>Notes from assignee:</strong>
                    <p className="mb-0 mt-1">{selectedTask.completionRequest.notes}</p>
                  </Alert>
                </div>
              )}
              
              <Form.Group className="mb-3">
                <Form.Label>Review Notes (Optional)</Form.Label>
                <Form.Control 
                  as="textarea" 
                  rows={3} 
                  placeholder="Add feedback or notes about this completion..."
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
            variant="danger" 
            onClick={() => submitReview('rejected')}
            disabled={reviewSubmitting}
            className="me-2"
          >
            <FaTimesCircle className="me-1" /> Reject
          </Button>
          <Button 
            variant="success" 
            onClick={() => submitReview('approved')}
            disabled={reviewSubmitting}
          >
            <FaCheckCircle className="me-1" /> Approve
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default NotificationCenter; 