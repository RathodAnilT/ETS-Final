import React from 'react';
import { Modal, Button, Row, Col, Badge, Alert } from 'react-bootstrap';
import { FaCalendarAlt, FaClock, FaUser, FaBarcode, FaPrint, FaBuilding, FaTasks, FaInfoCircle, FaUsers, FaHourglassHalf, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import './TaskManagement.css';

const TaskDetailsModal = ({ show, onHide, task }) => {
  if (!task) return null;

  // Format date for display
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

  // Check if task is overdue
  const isTaskOverdue = () => {
    if (!task.dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  // Determine CSS classes based on task priority
  const getPriorityClass = () => {
    switch (task.priority?.toLowerCase()) {
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return 'priority-medium';
    }
  };

  // Determine CSS classes based on task status
  const getStatusClass = () => {
    const status = task.status?.toLowerCase() || 'incomplete';
    if (status === 'completed') return 'status-completed';
    if (status === 'on hold' || status === 'on_hold') return 'status-on_hold';
    if (status === 'completion_requested') return 'status-completion_requested';
    return 'status-incomplete';
  };

  // Get formatted status text
  const getStatusText = () => {
    if (!task.status) return 'Open';
    
    switch (task.status.toLowerCase()) {
      case 'incomplete': return 'Open';
      case 'completed': return 'Completed';
      case 'on_hold': return 'On Hold';
      case 'completion_requested': return 'Pending Approval';
      default: return task.status;
    }
  };

  // Keeping function for backward compatibility with other components
  const getStatusStyle = () => {
    return {}; // Return empty object as we now use CSS classes
  };

  // Check if there are multiple assignees
  const hasMultipleAssignees = () => {
    return Array.isArray(task.assignedTo) && task.assignedTo.length > 1;
  };

  // Check if the task has a completion request
  const hasCompletionRequest = () => {
    return task.status === 'completion_requested' || task.completionRequest;
  };

  // Get assignees for display
  const getAssignees = () => {
    if (!task.assignedTo) {
      return [];
    }
    
    if (Array.isArray(task.assignedTo)) {
      return task.assignedTo;
    }
    
    // If not an array, return as a single-item array
    return [task.assignedTo];
  };

  const handlePrintBarcode = () => {
    if (!task.id) {
      alert('Task ID is missing, cannot print barcode.');
      return;
    }
    
    try {
      // In a real implementation, you would generate and print a barcode here
      alert(`Printing barcode for Task #${task.id}. This would connect to your barcode printing system.`);
      
      // Code for actual printing would go here, e.g.:
      // printTaskBarcode(task.id, task.title);
    } catch (error) {
      console.error('Error printing barcode:', error);
      alert('Failed to print barcode. Please try again later.');
    }
  };

  // Render an assignee card
  const renderAssignee = (assignee, index) => {
    if (!assignee) return null;
    
    return (
      <div className="assigned-employee" key={assignee.id || index}>
        <div className="employee-avatar">
          {assignee.name ? assignee.name.charAt(0).toUpperCase() : 'U'}
        </div>
        <div className="employee-info">
          <div className="employee-name">{assignee.name || 'Unassigned'}</div>
          {assignee.department && (
            <div className="employee-detail department-info">
              <FaBuilding className="me-1" /> {assignee.department}
            </div>
          )}
          {assignee.position && (
            <div className="employee-detail">
              {assignee.position}
            </div>
          )}
          {assignee.email && (
            <div className="employee-detail">
              {assignee.email}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render completion request information
  const renderCompletionRequest = () => {
    if (!hasCompletionRequest()) return null;
    
    const completionRequest = task.completionRequest || {};
    const requestStatus = completionRequest.status || 'pending';
    
    return (
      <div className="task-detail-section completion-request-section">
        <h5><FaHourglassHalf className="me-2" /> Completion Request</h5>
        
        <Alert variant={
          requestStatus === 'approved' ? 'success' : 
          requestStatus === 'rejected' ? 'danger' : 'info'
        }>
          <div className="completion-request-header">
            <div>
              {requestStatus === 'approved' ? (
                <><FaCheckCircle className="me-2" /> <strong>Approved</strong></>
              ) : requestStatus === 'rejected' ? (
                <><FaTimesCircle className="me-2" /> <strong>Rejected</strong></>
              ) : (
                <><FaHourglassHalf className="me-2" /> <strong>Pending Approval</strong></>
              )}
            </div>
            
            {completionRequest.requestedAt && (
              <div className="text-muted small">
                Requested on {formatDate(completionRequest.requestedAt)}
              </div>
            )}
          </div>
          
          {completionRequest.notes && (
            <div className="completion-request-notes mt-2">
              <strong>Notes from assignee:</strong>
              <p className="mb-0 mt-1">{completionRequest.notes}</p>
            </div>
          )}
          
          {(requestStatus === 'approved' || requestStatus === 'rejected') && (
            <div className="completion-review-details mt-3">
              <div className="review-header">
                <strong>Review details:</strong>
                {completionRequest.reviewedAt && (
                  <span className="text-muted small ms-2">
                    Reviewed on {formatDate(completionRequest.reviewedAt)}
                  </span>
                )}
              </div>
              
              {completionRequest.reviewNotes && (
                <p className="mb-0 mt-1">{completionRequest.reviewNotes}</p>
              )}
            </div>
          )}
        </Alert>
      </div>
    );
  };

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      size="lg" 
      centered 
      className="task-detail-modal"
    >
      <Modal.Header closeButton className="task-modal-header">
        <div className="task-detail-title">
          <span className="task-id">Task #{task.id || 'New'}</span>
          <h5 className="task-title-display">{task.title || 'Untitled Task'}</h5>
        </div>
      </Modal.Header>
      
      <Modal.Body className="task-modal-body">
        <Row className="justify-content-center">
          <Col md={10}>
            <div className="task-attributes">
              <div className={`task-priority ${getPriorityClass()}`}>
                <i className="fas fa-flag me-2"></i>
                {task.priority || 'Medium'}
              </div>
              
              <div className={`task-badge ${getStatusClass()}`}>
                <i className="fas fa-circle me-2"></i>
                {getStatusText()}
              </div>
            </div>
            
            <div className={`task-dates ${isTaskOverdue() ? 'overdue' : ''}`}>
              <FaCalendarAlt className="me-2" /> Due: {formatDate(task.dueDate || 'Not set')}
              {isTaskOverdue() && <span className="overdue-badge ms-2"> (Overdue)</span>}
            </div>
            
            {/* Display completion request information if available */}
            {renderCompletionRequest()}
            
            <div className="task-description">
              <h5><FaTasks className="me-2" /> Description</h5>
              <p>{task.description || 'No description has been provided for this task.'}</p>
            </div>
            
            <div className="task-detail-section">
              <h5>
                {hasMultipleAssignees() ? <FaUsers className="me-2" /> : <FaUser className="me-2" />}
                Assigned To {hasMultipleAssignees() ? `(${getAssignees().length})` : ''}
              </h5>
              {getAssignees().length > 0 ? (
                <div className="assigned-employees-list">
                  {getAssignees().map((assignee, index) => renderAssignee(assignee, index))}
                </div>
              ) : (
                <div className="no-data">
                  <FaInfoCircle className="me-2" /> No employee has been assigned to this task yet.
                </div>
              )}
            </div>
            
            <div className="task-detail-section">
              <h5><FaClock className="me-2" /> Timestamps</h5>
              <div className="task-timestamps">
                <div><FaClock className="me-2" /> Created: {formatDate(task.createdAt)}</div>
                <div><FaClock className="me-2" /> Last Updated: {formatDate(task.updatedAt || task.modifiedAt)}</div>
              </div>
            </div>
            
            <div className="task-detail-section">
              <h5><FaBarcode className="me-2" /> Task Barcode</h5>
              {task.id ? (
                <div className="task-barcode-card">
                  <div className="barcode-header">
                    <span className="task-barcode-id">ID: {task.id}</span>
                    <span className={`task-barcode-priority ${getPriorityClass()}`}>{task.priority || 'Medium'}</span>
                  </div>
                  <div className="barcode-title">{task.title}</div>
                  <div className="barcode-details">
                    <div className="barcode-due-date">
                      <FaCalendarAlt className="me-1" /> {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date specified'}
                    </div>
                    <div className="barcode-assigned">
                      {hasMultipleAssignees() ? 
                        <><FaUsers className="me-1" /> {getAssignees().length} assignees</> : 
                        <><FaUser className="me-1" /> {getAssignees()[0]?.name || 'Unassigned'}</>
                      }
                    </div>
                    {!hasMultipleAssignees() && getAssignees()[0]?.department && (
                      <div className="barcode-department">
                        <FaBuilding className="me-1" /> {getAssignees()[0].department}
                      </div>
                    )}
                  </div>
                  <div className="text-center mt-3">
                    <Button 
                      variant="outline-primary" 
                      className="print-barcode-btn" 
                      onClick={handlePrintBarcode}
                    >
                      <FaPrint className="me-2" /> Print Barcode
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="no-data">
                  <FaInfoCircle className="me-2" /> Save the task first to generate a barcode for printing and tracking
                </div>
              )}
            </div>
          </Col>
        </Row>
      </Modal.Body>
      
      <Modal.Footer className="justify-content-center">
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default TaskDetailsModal; 