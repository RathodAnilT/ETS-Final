import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Spinner, Button, Modal, Form, Alert } from 'react-bootstrap';
import { FaListAlt, FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaInfoCircle } from 'react-icons/fa';
import axios from 'axios';
import './AssignedTasks.css'; // Reuse styles from AssignedTasks

const CreatorTaskApprovals = ({ userId }) => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for review modal
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewFeedback, setReviewFeedback] = useState({ message: '', type: '' });

  useEffect(() => {
    fetchPendingRequests();
  }, [userId]);

  // Fetch pending completion requests
  const fetchPendingRequests = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }
      
      // Fetch tasks created by the current user
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/tasks/created-by/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        console.log("Tasks created by user:", response.data.tasks);
        
        // Filter for completion_requested status
        const pendingTasks = response.data.tasks.filter(task => 
          task.status === 'completion_requested'
        );
        
        console.log("Pending approval tasks:", pendingTasks);
        setPendingRequests(pendingTasks);
      } else {
        setError(response.data.message || 'Failed to fetch completion requests');
      }
    } catch (error) {
      console.error('Error fetching completion requests:', error);
      setError('Failed to load completion requests. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Handle reviewing a request
  const handleReviewRequest = (task) => {
    console.log("Selected task for review:", task);
    
    // Normalize task ID
    const taskWithId = {
      ...task,
      id: task._id || task.id,
      _id: task._id || task.id
    };
    
    setSelectedTask(taskWithId);
    setReviewNotes('');
    setReviewFeedback({ message: '', type: '' });
    setShowReviewModal(true);
  };

  // Submit the review (approve or reject)
  const submitReview = async (status) => {
    if (!selectedTask) return;
    
    console.log("Submitting review for task:", selectedTask);
    setReviewSubmitting(true);
    setReviewFeedback({ message: '', type: '' });
    
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
        setReviewFeedback({ 
          message: `Task completion request ${status === 'approved' ? 'approved' : 'rejected'} successfully!`, 
          type: 'success' 
        });
        
        setTimeout(() => {
          setShowReviewModal(false);
          fetchPendingRequests(); // Refresh the list
        }, 1500);
      } else {
        setReviewFeedback({ 
          message: response.data.message || 'Failed to process request', 
          type: 'danger' 
        });
      }
    } catch (error) {
      console.error('Error processing review:', error);
      console.error('Error details:', error.response?.data);
      
      // If we get a 403 Forbidden error, show a more helpful message
      if (error.response?.status === 403) {
        setReviewFeedback({
          message: "You are not authorized to review this task. Only the task creator can approve or reject completion requests.",
          type: 'warning'
        });
      } else {
        setReviewFeedback({ 
          message: error.response?.data?.message || 'Failed to process review', 
          type: 'danger' 
        });
      }
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Get assignee names as string
  const getAssigneeName = (assignedTo) => {
    if (!assignedTo) return 'Unassigned';
    
    if (Array.isArray(assignedTo)) {
      return assignedTo.map(user => user.name).join(', ');
    } else if (typeof assignedTo === 'object') {
      return assignedTo.name || 'Unknown';
    }
    
    return 'Unknown';
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="task-tracker-container mb-4">
      <Card className="task-list-card">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h3 className="mb-0 task-title">
            <FaHourglassHalf className="me-2" />
            Tasks Awaiting Your Approval
          </h3>
          {pendingRequests.length > 0 && (
            <Badge bg="info" pill>{pendingRequests.length}</Badge>
          )}
        </Card.Header>
        <Card.Body className="p-0">
          {loading ? (
            <div className="task-loading-spinner">
              <Spinner animation="border" variant="primary" />
              <span>Loading completion requests...</span>
            </div>
          ) : error ? (
            <Alert variant="danger" className="m-3">{error}</Alert>
          ) : pendingRequests.length === 0 ? (
            <div className="no-tasks-message">
              <FaCheckCircle className="icon-large mb-3" />
              <p>No pending completion requests</p>
              <small className="text-muted">
                When someone requests to mark a task you created as complete, it will appear here for your approval.
              </small>
            </div>
          ) : (
            <div className="p-3">
              <div className="info-banner mb-3">
                <FaInfoCircle className="me-2" />
                <span>As the creator of these tasks, only you can approve or reject completion requests.</span>
              </div>
              <Table hover responsive className="task-table mb-0">
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Assignee</th>
                    <th>Requested On</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingRequests.map(task => (
                    <tr key={task._id || task.id}>
                      <td>
                        <div className="task-title-cell">
                          <div className="fw-bold">{task.title}</div>
                          {task.description && (
                            <small className="d-block text-muted mt-1">
                              {task.description.length > 80 
                                ? `${task.description.substring(0, 80)}...` 
                                : task.description}
                            </small>
                          )}
                        </div>
                      </td>
                      <td>
                        {getAssigneeName(task.assignedTo)}
                      </td>
                      <td>
                        {task.completionRequest ? 
                          formatDate(task.completionRequest.requestedAt) : 
                          formatDate(task.updatedAt)}
                      </td>
                      <td>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleReviewRequest(task)}
                        >
                          <FaHourglassHalf className="me-1" /> Review
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
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

export default CreatorTaskApprovals; 