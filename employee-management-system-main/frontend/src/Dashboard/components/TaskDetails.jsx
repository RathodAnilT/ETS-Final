import React, { useEffect, useState } from 'react';
import { Modal, Button, Badge, Row, Col, ProgressBar, Spinner, Alert, Container } from 'react-bootstrap';
import { 
  FaCalendarAlt, FaInfoCircle, FaUsersCog, FaTag, FaBriefcase,
  FaCheckCircle, FaTimesCircle, FaList, FaClipboardList, FaUserCheck, FaUserClock, FaUserAlt, FaClock, FaTags, FaCheck, FaTimes, FaHourglassHalf, FaUsers, FaLayerGroup, FaStickyNote, FaBell, FaTasks, FaExclamationTriangle, FaClipboardCheck, FaRegStickyNote
} from 'react-icons/fa';
import axios from 'axios';
import './TaskDetails.css';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';

const TaskDetails = ({ task, show, handleClose, onAction }) => {
  const [assigneeDetails, setAssigneeDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  // Fetch assignee details when task changes
  useEffect(() => {
    const fetchAssigneeDetails = async () => {
      if (!task || !task.assignees || task.assignees.length === 0) {
        setAssigneeDetails([]);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const promises = task.assignees.map(assigneeId => 
          axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/users/${assigneeId}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          })
        );
        
        const responses = await Promise.all(promises);
        const details = responses.map(res => res.data);
        setAssigneeDetails(details);
      } catch (error) {
        console.error('Error fetching assignee details:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (show && task) {
      fetchAssigneeDetails();
    }
  }, [show, task]);

  if (!task) return null;

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    try {
      return format(parseISO(dateString), 'MMM dd, yyyy');
    } catch (e) {
      return 'Invalid date';
    }
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return '';
    try {
      return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
    } catch (e) {
      return '';
    }
  };

  // Render status badge
  const renderStatusBadge = (status) => {
    let badgeColor = 'secondary';
    let icon = <FaInfoCircle className="icon-sm" />;
    let text = 'Unknown';

    switch (status) {
      case 'pending':
        badgeColor = 'warning';
        icon = <FaClock className="icon-sm" />;
        text = 'Pending';
        break;
      case 'in_progress':
        badgeColor = 'primary';
        icon = <FaTasks className="icon-sm" />;
        text = 'In Progress';
        break;
      case 'completed':
        badgeColor = 'success';
        icon = <FaCheckCircle className="icon-sm" />;
        text = 'Completed';
        break;
      case 'cancelled':
        badgeColor = 'danger';
        icon = <FaTimesCircle className="icon-sm" />;
        text = 'Cancelled';
        break;
      case 'completion_requested':
        badgeColor = 'info';
        icon = <FaClipboardCheck className="icon-sm" />;
        text = 'Completion Requested';
        break;
      default:
        break;
    }

    return <Badge bg={badgeColor}>{icon} {text}</Badge>;
  };

  // Render priority badge
  const renderPriorityBadge = (priority) => {
    let badgeColor = 'secondary';
    let icon = <FaInfoCircle className="icon-sm" />;
    let text = 'Normal';

    switch (priority) {
      case 'low':
        badgeColor = 'success';
        text = 'Low';
        break;
      case 'medium':
        badgeColor = 'warning';
        icon = <FaExclamationTriangle className="icon-sm" />;
        text = 'Medium';
        break;
      case 'high':
        badgeColor = 'danger';
        icon = <FaExclamationTriangle className="icon-sm" />;
        text = 'High';
        break;
      default:
        break;
    }

    return <Badge bg={badgeColor}>{icon} {text}</Badge>;
  };
  
  // Calculate completion percentage
  const calculateCompletionPercentage = () => {
    if (!task.assigneeCompletions || task.assigneeCompletions.length === 0) {
      return 0;
    }
    
    const completedCount = task.assigneeCompletions.filter(
      completion => completion.status === 'completed'
    ).length;
    
    return Math.round((completedCount / task.assigneeCompletions.length) * 100);
  };

  const renderAssigneeCompletions = () => {
    if (!task.assigneeCompletions || task.assigneeCompletions.length === 0) {
      return <Alert variant="info"><FaInfoCircle className="icon-sm" /> No assignee completion information available.</Alert>;
    }
    
    const completionPercentage = calculateCompletionPercentage();
    
    return (
      <div>
        <div className="completion-progress">
          <div className="d-flex justify-content-between mb-2">
            <span>Completion Progress</span>
            <span><strong>{completionPercentage}%</strong></span>
          </div>
          <ProgressBar 
            now={completionPercentage} 
            variant={completionPercentage === 100 ? "success" : "primary"} 
          />
        </div>
        
        <div className="assignee-status-list">
          {task.assigneeCompletions.map((completion, index) => {
            const assignee = task.assignedTo.find(a => a._id === completion.assigneeId);
            const assigneeName = assignee ? assignee.name : 'Unknown User';
            
            return (
              <div key={index} className="assignee-status-item">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="assignee-name">
                    <FaUserAlt className="icon-sm" /> {assigneeName}
                  </div>
                  <Badge bg={getStatusBadgeColor(completion.status)}>
                    {getStatusText(completion.status)}
                  </Badge>
                </div>
                
                {/* Completion Time */}
                {completion.completionRequestedAt && (
                  <div className="completion-time text-muted small">
                    <FaClock className="me-1" />
                    Completed on: {new Date(completion.completionRequestedAt).toLocaleString()}
                  </div>
                )}
                
                {/* Review Time */}
                {completion.reviewedAt && (
                  <div className="review-time text-muted small">
                    <FaClock className="me-1" />
                    Reviewed on: {new Date(completion.reviewedAt).toLocaleString()}
                  </div>
                )}
                
                {completion.completionNotes && (
                  <div className="assignee-status-note">
                    <FaRegStickyNote className="mt-1 me-2" />
                    <div>{completion.completionNotes}</div>
                  </div>
                )}
                
                {completion.reviewNotes && (
                  <div className="assignee-status-note">
                    <FaRegStickyNote className="mt-1 me-2" />
                    <div><strong>Review Notes:</strong> {completion.reviewNotes}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'completion_requested':
        return 'warning';
      case 'rejected':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'completion_requested':
        return 'Pending Review';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Pending';
    }
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered className="task-details-modal">
      <Modal.Header closeButton>
        <Modal.Title className="task-title">
          <FaClipboardList /> {task.title}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="task-info-section">
          <Row>
            <Col md={6}>
              <div className="task-info-item">
                <span className="task-info-label"><FaCalendarAlt className="icon-sm" /> Created:</span>
                <span className="task-info-value">
                  {formatDate(task.createdAt)} ({getTimeAgo(task.createdAt)})
                </span>
              </div>
              <div className="task-info-item">
                <span className="task-info-label"><FaCalendarAlt className="icon-sm" /> Due Date:</span>
                <span className="task-info-value">{formatDate(task.dueDate)}</span>
              </div>
            </Col>
            <Col md={6}>
              <div className="task-info-item">
                <span className="task-info-label"><FaLayerGroup className="icon-sm" /> Status:</span>
                <span className="task-info-value">
                  {renderStatusBadge(task.status)}
                </span>
              </div>
              <div className="task-info-item">
                <span className="task-info-label"><FaLayerGroup className="icon-sm" /> Priority:</span>
                <span className="task-info-value">
                  {renderPriorityBadge(task.priority)}
                </span>
              </div>
            </Col>
          </Row>
          
          <div className="task-info-item">
            <span className="task-info-label"><FaUserAlt className="icon-sm" /> Created by:</span>
            <span className="task-info-value">
              {task.createdBy?.name || 'Unknown'}
            </span>
          </div>
          
          {task.assignees && task.assignees.length > 0 && (
            <div className="task-info-item">
              <span className="task-info-label"><FaUsers className="icon-sm" /> Assignees:</span>
              <span className="task-info-value">
                {loading ? 'Loading...' : assigneeDetails.map(a => a.name).join(', ')}
              </span>
            </div>
          )}
          
          {task.hasOwnProperty('isMultiAssignee') && task.isMultiAssignee && (
            <div className="completion-progress">
              <div className="d-flex justify-content-between mb-1">
                <span>Completion Progress:</span>
                <span>{calculateCompletionPercentage()}%</span>
              </div>
              <ProgressBar 
                now={calculateCompletionPercentage()} 
                variant={
                  calculateCompletionPercentage() === 100 ? "success" : 
                  calculateCompletionPercentage() > 50 ? "primary" : 
                  "warning"
                }
              />
            </div>
          )}
        </div>
        
        {/* Task Description */}
        <div className="task-description-section">
          <h5 className="section-title">
            <FaInfoCircle className="icon-sm me-1" /> Description
          </h5>
          <p className="task-description">
            {task.description || 'No description provided'}
          </p>
        </div>
        
        {/* Display assignee completion status */}
        {task.assigneeCompletions && task.assigneeCompletions.length > 0 && (
          <div className="assignee-completion-section">
            <h5 className="section-title">
              <FaUsers className="icon-sm" /> Assignee Completion Status
            </h5>
            {loading ? (
              <div className="text-center py-3">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2">Loading assignee information...</p>
              </div>
            ) : (
              renderAssigneeCompletions()
            )}
          </div>
        )}
        
        {/* Display task tags */}
        {task.tags && task.tags.length > 0 && (
          <div className="task-tags-section">
            <h5 className="section-title">
              <FaTag className="icon-sm" /> Tags
            </h5>
            <div className="tag-list">
              {task.tags.map((tag, index) => (
                <span key={index} className="task-tag">{tag}</span>
              ))}
            </div>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Close
        </Button>
        {onAction && (
          <Button variant="primary" onClick={() => onAction(task)}>
            <FaClipboardList className="me-2" /> Task Actions
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default TaskDetails; 