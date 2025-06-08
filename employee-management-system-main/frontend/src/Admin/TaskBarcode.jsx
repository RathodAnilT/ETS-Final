import React from 'react';
import Barcode from 'react-barcode';
import { Card, Row, Col } from 'react-bootstrap';
import './TaskManagement.css';

const TaskBarcode = ({ taskId, title, priority, dueDate, assignedTo }) => {
  // Format the date for display
  const formatDate = (dateString) => {
    if (!dateString) return "No date set";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid date";
      return date.toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return "Error with date";
    }
  };

  // Get priority class for styling
  const getPriorityClass = (priority) => {
    if (!priority) return '';
    
    try {
      switch (priority.toLowerCase()) {
        case 'high':
          return 'task-priority-high';
        case 'medium':
          return 'task-priority-medium';
        case 'low':
          return 'task-priority-low';
        default:
          return '';
      }
    } catch (error) {
      return '';
    }
  };

  // Handle barcode generation errors
  const generateBarcode = () => {
    try {
      if (!taskId) return null;
      
      return (
        <Barcode 
          value={taskId.toString()} 
          width={1.5}
          height={50}
          fontSize={14}
          margin={10}
          displayValue={true}
        />
      );
    } catch (error) {
      console.error('Error generating barcode:', error);
      return <p className="text-danger">Unable to generate barcode</p>;
    }
  };

  return (
    <Card className="task-barcode-card">
      <Card.Body>
        <div className="text-center mb-3">
          <h5 className="task-id">Task ID: {taskId || 'N/A'}</h5>
          {taskId && generateBarcode()}
        </div>
        <Row className="task-details">
          <Col xs={12} className="text-center">
            <p className="task-title">{title || 'Untitled Task'}</p>
            <p className={`task-priority ${getPriorityClass(priority)}`}>
              Priority: {priority ? priority.charAt(0).toUpperCase() + priority.slice(1) : 'Not specified'}
            </p>
            <p className="task-due-date">
              Due: {formatDate(dueDate)}
            </p>
            {assignedTo && (
              <p className="task-assigned-to">
                Assigned to: {assignedTo.name || 'Unassigned'}
              </p>
            )}
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default TaskBarcode; 
 