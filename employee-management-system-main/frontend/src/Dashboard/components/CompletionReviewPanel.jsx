import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Spinner, Alert, Modal, Form, Pagination } from 'react-bootstrap';
import { FaTasks, FaCheckCircle, FaTimesCircle, FaInfoCircle, FaExclamationTriangle, FaFilter, FaHourglassHalf, FaClock } from 'react-icons/fa';
import axios from 'axios';
import userContext from '../../context/userContext';
import './CompletionReviewPanel.css';

const CompletionReviewPanel = () => {
  const auth = useContext(userContext);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('pending');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  
  // State for task review
  const [selectedTask, setSelectedTask] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewStatus, setReviewStatus] = useState(null);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewFeedback, setReviewFeedback] = useState({ message: '', type: '' });
  
  // Success modal
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = tasks.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(tasks.length / itemsPerPage);

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Render pagination
  const renderPagination = () => {
    let items = [];
    for (let number = 1; number <= totalPages; number++) {
      items.push(
        <Pagination.Item 
          key={number} 
          active={number === currentPage}
          onClick={() => handlePageChange(number)}
        >
          {number}
        </Pagination.Item>
      );
    }

    return (
      <Pagination className="justify-content-center mt-3">
        <Pagination.Prev 
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        />
        {items}
        <Pagination.Next 
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        />
      </Pagination>
    );
  };

  // Fetch tasks that need approval
  const fetchTasks = async () => {
    if (!auth.isLoggedIn) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch tasks created by the current user with completion_requested status
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/tasks/created-by/${auth.userId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        // Filter tasks based on current filter status
        let filteredTasks = response.data.tasks;
        
        if (filterStatus === 'pending') {
          // Only show tasks with completion_requested status
          filteredTasks = filteredTasks.filter(task => task.status === 'completion_requested');
        } else if (filterStatus === 'completed') {
          // Show recently completed tasks
          filteredTasks = filteredTasks.filter(task => task.status === 'completed');
        }
        
        setTasks(filteredTasks);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    
    // Set up polling for task updates
    const intervalId = setInterval(fetchTasks, 60000); // Poll every minute
    
    return () => clearInterval(intervalId);
  }, [auth.isLoggedIn, auth.userId, filterStatus]);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle review task completion
  const handleReviewTask = (task, initialStatus = null) => {
    setSelectedTask(task);
    setReviewNotes('');
    setReviewStatus(initialStatus);
    setReviewFeedback({ message: '', type: '' });
    setShowReviewModal(true);
  };

  // Submit the review decision
  const submitReview = async () => {
    if (!selectedTask || !reviewStatus) {
      setReviewFeedback({ message: 'Please select approve or reject', type: 'warning' });
      return;
    }
    
    setReviewSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `${process.env.REACT_APP_BACKEND_URL}/api/tasks/${selectedTask._id}/review-completion`,
        { 
          approved: reviewStatus === 'approved',
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
          message: `Task ${reviewStatus === 'approved' ? 'approved' : 'rejected'} successfully!`, 
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
            fetchTasks(); // Refresh tasks
          }, 2000);
        }, 500);
      } else {
        setReviewFeedback({ message: response.data.message || 'Failed to submit review', type: 'danger' });
      }
    } catch (error) {
      console.error('Error processing review:', error);
      
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

  // Render priority badge
  const renderPriorityBadge = (priority) => {
    const priorityString = String(priority || '').toLowerCase();
    
    switch (priorityString) {
      case 'high':
        return <Badge bg="danger">High</Badge>;
      case 'medium':
        return <Badge bg="warning" text="dark">Medium</Badge>;
      case 'low':
        return <Badge bg="success">Low</Badge>;
      default:
        return <Badge bg="secondary">Normal</Badge>;
    }
  };

  // Get assignee names as string
  const getAssigneeNames = (assignees) => {
    if (!assignees || assignees.length === 0) return 'No Assignees';
    
    // If assignees is an array of objects with name property
    if (Array.isArray(assignees)) {
      const names = assignees.map(user => {
        if (typeof user === 'object' && user !== null) {
          return user.name || 'Unknown User';
        }
        return 'Unknown User';
      });
      return names.join(', ');
    }
    
    // If assignees is a single object with name property
    if (typeof assignees === 'object' && assignees !== null) {
      return assignees.name || 'Unknown User';
    }
    
    return 'Unknown User';
  };

  // Render the task list
  const renderTaskList = () => {
    if (tasks.length === 0) {
      return (
        <Alert variant="info">
          <FaInfoCircle className="me-2" />
          No tasks requiring review at this time.
        </Alert>
      );
    }

    return (
      <div className="task-list">
        <Table responsive hover className="completion-table">
          <thead>
            <tr>
              <th>Task</th>
              <th>Priority</th>
              <th>Employee</th>
              <th>Completion Time</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map(task => (
              <tr key={task._id}>
                <td>
                  <div className="task-title">{task.title}</div>
                  <div className="text-muted small">{task.description}</div>
                </td>
                <td>{renderPriorityBadge(task.priority)}</td>
                <td>
                  <div className="assignee-list">
                    {task.assignedTo && task.assignedTo.map((assignee, index) => {
                      const completion = task.assigneeCompletions?.find(c => c.assigneeId === assignee._id);
                      return (
                        <div key={index} className="assignee-item">
                          <span className="assignee-name">{assignee.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </td>
                <td>
                  {task.assigneeCompletions?.map((completion, index) => {
                    const assignee = task.assignedTo.find(a => a._id === completion.assigneeId);
                    return completion.completionRequestedAt ? (
                      <div key={index} className="completion-time-item">
                        <span className="assignee-name">{assignee?.name}: </span>
                        <span className="completion-time">
                          {new Date(completion.completionRequestedAt).toLocaleString()}
                        </span>
                      </div>
                    ) : null;
                  })}
                  {!task.assigneeCompletions?.some(c => c.completionRequestedAt) && (
                    <span className="text-muted">Awaiting completion</span>
                  )}
                </td>
                <td>
                  {task.assigneeCompletions?.map((completion, index) => {
                    const status = completion.status;
                    const isReviewed = completion.reviewedBy && completion.reviewedAt;
                    const isRejected = !completion.status === 'completed' && isReviewed;
                    
                    return (
                      <div key={index} className="status-info">
                        <span className="status-details">
                          {isRejected ? (
                            <Badge bg="danger">Rejected</Badge>
                          ) : status === 'completed' ? (
                            <Badge bg="success">Approved</Badge>
                          ) : status === 'completion_requested' ? (
                            <Badge bg="warning">Pending Review</Badge>
                          ) : (
                            <Badge bg="secondary">Pending</Badge>
                          )}
                          {isReviewed && (
                            <small className="text-muted d-block mt-1">
                              {isRejected ? 'Rejected' : 
                               status === 'completed' ? 'Approved' : 
                               'Pending Review'} by {completion.reviewedBy.name} at {new Date(completion.reviewedAt).toLocaleString()}
                            </small>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </td>
                <td>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleReviewTask(task)}
                  >
                    <FaHourglassHalf className="me-1" /> Review
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        {renderPagination()}
      </div>
    );
  };

  // If loading, show spinner
  if (loading && tasks.length === 0) {
    return (
      <Container className="my-4">
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading tasks...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="my-4 completion-review-panel">
      <h2 className="mb-4 d-flex align-items-center">
        <FaTasks className="me-2" /> Task Approval Dashboard
      </h2>
      
      {error && (
        <Alert variant="danger" className="mb-4">
          <FaExclamationTriangle className="me-2" />
          {error}
        </Alert>
      )}
      
      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Tasks Awaiting Review</h5>
          
          <div className="filter-buttons">
            <Button
              variant={filterStatus === 'pending' ? 'primary' : 'outline-primary'}
              size="sm"
              className="me-2"
              onClick={() => setFilterStatus('pending')}
            >
              <FaHourglassHalf className="me-1" /> Pending Approval
            </Button>
            <Button
              variant={filterStatus === 'completed' ? 'primary' : 'outline-primary'}
              size="sm"
              onClick={() => setFilterStatus('completed')}
            >
              <FaCheckCircle className="me-1" /> Recently Approved
            </Button>
          </div>
        </Card.Header>
        
        <Card.Body>
          {renderTaskList()}
        </Card.Body>
      </Card>
      
      {/* Review Modal */}
      <Modal show={showReviewModal} onHide={() => setShowReviewModal(false)}>
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
          <div className="d-flex gap-2">
            {!reviewStatus && (
              <>
                <Button 
                  variant="success" 
                  onClick={() => {
                    setReviewStatus('approved');
                    setTimeout(submitReview, 100);
                  }}
                  disabled={reviewSubmitting}
                >
                  <FaCheckCircle className="me-1" /> Approve
                </Button>
                <Button 
                  variant="danger" 
                  onClick={() => {
                    setReviewStatus('rejected');
                    setTimeout(submitReview, 100);
                  }}
                  disabled={reviewSubmitting}
                >
                  <FaTimesCircle className="me-1" /> Reject
                </Button>
              </>
            )}
            {reviewStatus && (
              <Button 
                variant={reviewStatus === 'approved' ? "success" : "danger"} 
                onClick={submitReview}
                disabled={reviewSubmitting}
              >
                {reviewSubmitting ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" className="me-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    {reviewStatus === 'approved' ? (
                      <><FaCheckCircle className="me-1" /> Confirm Approval</>
                    ) : (
                      <><FaTimesCircle className="me-1" /> Confirm Rejection</>
                    )}
                  </>
                )}
              </Button>
            )}
          </div>
        </Modal.Footer>
      </Modal>
      
      {/* Success Modal */}
      <Modal 
        show={showSuccessModal} 
        onHide={() => setShowSuccessModal(false)}
        centered
        size="sm"
      >
        <Modal.Body className="text-center p-4">
          <div className="mb-3">
            {reviewStatus === 'approved' ? (
              <FaCheckCircle size={50} color="#28a745" />
            ) : (
              <FaTimesCircle size={50} color="#dc3545" />
            )}
          </div>
          <h5 className="mb-3">{successMessage}</h5>
          <Button 
            variant="primary" 
            onClick={() => setShowSuccessModal(false)}
            className="mt-2"
            size="sm"
          >
            Close
          </Button>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default CompletionReviewPanel; 