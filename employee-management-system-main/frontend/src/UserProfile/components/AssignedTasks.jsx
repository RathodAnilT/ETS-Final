import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Spinner, Container, Row, Col } from 'react-bootstrap';
import { FaListAlt, FaCalendarAlt, FaCheckCircle, FaClock, FaHourglassHalf } from 'react-icons/fa';
import axios from 'axios';
import './AssignedTasks.css';

const AssignedTasks = ({ userId }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssignedTasks = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      
      // First try to load from localStorage for immediate display
      try {
        const savedTasks = localStorage.getItem('taskManagementTasks');
        if (savedTasks) {
          const parsedTasks = JSON.parse(savedTasks);
          const userTasks = parsedTasks.filter(task => {
            if (!task.assignedTo) return false;
            const assignedId = task.assignedTo.id || task.assignedTo._id;
            return assignedId === userId;
          });
          
          if (userTasks.length > 0) {
            console.log(`Found ${userTasks.length} cached tasks for user:`, userId);
            setTasks(userTasks);
          }
        }
      } catch (err) {
        console.error('Error loading tasks from localStorage:', err);
      }
      
      // Try fetching from API
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.log("No auth token available");
          setLoading(false);
          return;
        }
        
        const apiUrl = `${process.env.REACT_APP_BACKEND_URL}/api/tasks`.replace(/([^:]\/)\/+/g, "$1");
        
        const response = await axios.get(
          apiUrl,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        if (response.data && response.data.tasks && Array.isArray(response.data.tasks)) {
          const userTasks = response.data.tasks.filter(task => {
            if (!task.assignedTo) return false;
            const assignedId = task.assignedTo._id || task.assignedTo.id;
            return assignedId === userId;
          });
          
          const formattedTasks = userTasks.map(task => ({
            id: task._id || task.id,
            taskId: task.taskId || `TASK-${Math.floor(Math.random() * 1000)}`,
            title: task.title || 'Untitled Task',
            description: task.description || '',
            dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : null,
            priority: task.priority || 'Medium',
            status: task.status || 'incomplete',
            createdAt: task.createdAt || new Date().toISOString(),
            modifiedAt: task.updatedAt || task.modifiedAt || new Date().toISOString(),
            assignedTo: task.assignedTo || {}
          }));
          
          console.log(`Found ${formattedTasks.length} tasks on server for user:`, userId);
          if (formattedTasks.length > 0) {
            setTasks(formattedTasks);
          }
        } else {
          console.log("No tasks found in response or invalid response format");
        }
      } catch (err) {
        console.error('Error fetching tasks from API:', err);
        // No error message displayed to the user, we use cached data if available
      } finally {
        setLoading(false);
      }
    };

    fetchAssignedTasks();
  }, [userId]);

  // Render a badge for priority
  const renderPriorityBadge = (priority) => {
    const priorityString = String(priority || '').toLowerCase();
    
    switch (priorityString) {
      case 'high':
        return <span className="task-badge priority-high">High</span>;
      case 'medium':
        return <span className="task-badge priority-medium">Medium</span>;
      case 'low':
        return <span className="task-badge priority-low">Low</span>;
      default:
        return <span className="task-badge priority-medium">Normal</span>;
    }
  };

  // Render a badge for status
  const renderStatusBadge = (status) => {
    const statusString = String(status || '').toLowerCase();
    
    let statusClass = '';
    let statusText = '';
    let icon = null;
    
    switch (statusString) {
      case 'completed':
        statusClass = 'status-completed';
        statusText = 'Completed';
        icon = <FaCheckCircle className="me-1" />;
        break;
      case 'completion_requested':
        statusClass = 'status-awaiting';
        statusText = 'Awaiting Approval';
        icon = <FaHourglassHalf className="me-1" />;
        break;
      case 'incomplete':
        statusClass = 'status-incomplete';
        statusText = 'Open';
        icon = <FaListAlt className="me-1" />;
        break;
      case 'on_hold':
      case 'on hold':
        statusClass = 'status-on_hold';
        statusText = 'On Hold';
        icon = <FaClock className="me-1" />;
        break;
      default:
        statusClass = 'status-incomplete';
        statusText = 'Unknown';
        icon = <FaListAlt className="me-1" />;
    }
    
    return (
      <span className={`task-badge ${statusClass}`}>
        {icon} {statusText}
      </span>
    );
  };

  // Check if a task is overdue
  const isTaskOverdue = (dueDate) => {
    if (!dueDate) return false;
    
    try {
      const dueDateTime = new Date(dueDate);
      dueDateTime.setHours(23, 59, 59, 999);
      const now = new Date();
      return dueDateTime < now;
    } catch {
      return false;
    }
  };
  
  // Check if a task is due today
  const isTaskDueToday = (dueDate) => {
    if (!dueDate) return false;
    
    try {
      const dueDateTime = new Date(dueDate);
      const now = new Date();
      
      return (
        dueDateTime.getFullYear() === now.getFullYear() &&
        dueDateTime.getMonth() === now.getMonth() &&
        dueDateTime.getDate() === now.getDate()
      );
    } catch {
      return false;
    }
  };

  // Only show active tasks (not completed)
  const activeTasks = tasks.filter(task => task.status !== 'completed');

  return (
    <div className="task-tracker-container">
      <Card className="task-list-card">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h3 className="mb-0 task-title">
            <FaListAlt className="me-2" />
            Assigned Tasks
          </h3>
        </Card.Header>
        <Card.Body className="p-0">
          {loading ? (
            <div className="task-loading-spinner">
              <i className="fas fa-circle-notch fa-spin"></i>
              <span>Loading your tasks...</span>
            </div>
          ) : activeTasks.length === 0 ? (
            <div className="no-tasks-message">
              <i className="fas fa-check-circle"></i>
              <p>No active tasks assigned</p>
            </div>
          ) : (
            <div className="task-table-container">
              <Table hover className="task-table mb-0">
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {activeTasks.map((task) => (
                    <tr key={task.id || task.taskId} className={isTaskOverdue(task.dueDate) ? 'overdue-task' : ''}>
                      <td>
                        <div className="task-title-cell">
                          <div className="fw-bold">{task.title || 'Untitled Task'}</div>
                          {task.description && (
                            <small className="d-block text-muted mt-1">
                              {task.description.length > 100 
                                ? `${task.description.substring(0, 100)}...` 
                                : task.description}
                            </small>
                          )}
                          {task.assignedTo && task.assignedTo.department && (
                            <small className="d-block text-primary mt-1">
                              Department: {task.assignedTo.department}
                            </small>
                          )}
                          {task.assignedTo && task.assignedTo.email && (
                            <small className="d-block text-email mt-1 text-truncate">
                              {task.assignedTo.email}
                            </small>
                          )}
                        </div>
                      </td>
                      <td>
                        {renderPriorityBadge(task.priority)}
                      </td>
                      <td>
                        {renderStatusBadge(task.status)}
                      </td>
                      <td>
                        <div className={`due-date ${isTaskOverdue(task.dueDate) ? 'text-danger' : isTaskDueToday(task.dueDate) ? 'text-warning' : ''}`}>
                          <FaCalendarAlt className="me-1" />
                          <span>
                            {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}
                          </span>
                          {isTaskOverdue(task.dueDate) && (
                            <span className="overdue-indicator">Overdue</span>
                          )}
                          {isTaskDueToday(task.dueDate) && (
                            <span className="today-indicator">Today</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default AssignedTasks; 