import './TaskManagement.css';
import React, { useState, useEffect, useCallback, useContext } from 'react';
import axios from 'axios';
import {  Row, Col, Card, Form, Button, Table, Badge, Tabs, Tab, ProgressBar, Dropdown, Alert, Modal, Spinner } from 'react-bootstrap';
import { FaTasks,  FaExclamationCircle, FaCheckCircle, FaListAlt, FaClock, FaCalendarDay, FaPause, FaCheck, FaChartPie, FaHourglassHalf, FaTimesCircle, FaInfoCircle, FaEye, FaEdit, FaTrash } from 'react-icons/fa';
import userContext from '../context/userContext';
import { triggerStatsUpdate } from '../utils/helpers';

import './TaskManagement.css';
import TaskDetailsModal from './TaskDetailsModal';
import { generateTaskId, ensureValidTaskId } from '../utils/taskHelpers';
import { isTokenValid, authRequest, handleAuthError } from '../utils/authUtils';

const TaskManagement = () => {
  const auth = useContext(userContext);
  
  // Validate the backend URL at component initialization
  useEffect(() => {
    console.log("Backend URL configured as:", process.env.REACT_APP_BACKEND_URL);
    
    if (!process.env.REACT_APP_BACKEND_URL) {
      console.error("REACT_APP_BACKEND_URL is not defined. Tasks will only be stored locally.");
    }
    
    // For easy debugging in case of URL-related issues
    const testTaskUrl = `${process.env.REACT_APP_BACKEND_URL}/api/tasks`.replace(/([^:]\/)\/+/g, "$1");
    console.log("Test task URL:", testTaskUrl);
  }, []);
  
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [pendingCompletionRequests, setPendingCompletionRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assignedTo: [],
    priority: 'medium',
    dueDate: '',
    status: 'incomplete'
  });
  const [viewMode, setViewMode] = useState('dashboard');
  const [stats, setStats] = useState({
    total: 0,
    incomplete: 0,
    overdue: 0,
    dueToday: 0,
    completed: 0,
    pendingApproval: 0
  });
  const [activeTab, setActiveTab] = useState('all');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTaskId, setEditTaskId] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // State for completion review
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedCompletionRequest, setSelectedCompletionRequest] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewFeedback, setReviewFeedback] = useState({ message: '', type: '' });

  // Update tasks in localStorage whenever tasks state changes
  useEffect(() => {
    if (tasks.length > 0) {
      localStorage.setItem('taskManagementTasks', JSON.stringify(tasks));
    }
  }, [tasks]);

  // Add useEffect to refresh tasks when refreshTrigger changes
  useEffect(() => {
    // This effect will run whenever refreshTrigger changes
    if (refreshTrigger > 0) {
      console.log("Refresh triggered, fetching tasks...");
      fetchTasks();
    }
  }, [refreshTrigger]);

  // Helper function to show notifications
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    // Auto-hide after 3 seconds
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const updateTaskStats = (taskList) => {
    console.log("Updating task stats with task list:", taskList);
    
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    const total = taskList.length;
    const incomplete = taskList.filter(task => task.status === 'incomplete').length;
    
    // Use our improved functions to calculate overdue and due today
    const overdue = taskList.filter(task => 
      task.status !== 'completed' && 
      isTaskOverdue(task.dueDate)
    ).length;
    
    const dueToday = taskList.filter(task => 
      task.status !== 'completed' && 
      isTaskDueToday(task.dueDate)
    ).length;
    
    const completed = taskList.filter(task => task.status === 'completed').length;
    
    // Count tasks with pending completion requests
    const pendingApproval = taskList.filter(task => 
      task.status === 'completion_requested'
    ).length;
    
    const newStats = {
      total,
      incomplete,
      overdue,
      dueToday,
      completed,
      pendingApproval
    };
    
    console.log("New task stats:", newStats);
    setStats(newStats);
  };

  const fetchTasks = async () => {
    console.log("Fetching all tasks...");
    try {
      // Get auth token with fallback options
      let token = auth.token;
      
      // If token from context is missing, try localStorage directly
      if (!token) {
        token = localStorage.getItem('token');
        console.log("Using token from localStorage instead of context for fetching tasks");
      }
      
      // Check if we have item-based storage to try as well
      if (!token) {
        const items = localStorage.getItem('items');
        if (items) {
          try {
            const parsedItems = JSON.parse(items);
            if (parsedItems && parsedItems.token) {
              token = parsedItems.token;
              console.log("Using token from items storage for fetching tasks");
            }
          } catch (e) {
            console.error("Error parsing items from localStorage:", e);
          }
        }
      }
      
      if (!token) {
        console.error('No token found for tasks');
        // Initialize with empty tasks
        setTasks([]);
        updateTaskStats([]);
        setLoading(false);
        return;
      }
      
      // Ensure trailing slash is handled correctly
      const apiUrl = `${process.env.REACT_APP_BACKEND_URL}/api/tasks`.replace(/([^:]\/)\/+/g, "$1");
      console.log("API URL for fetching all tasks:", apiUrl);
      
      // Format token correctly
      const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      console.log("Using formatted auth header for tasks:");
      
      // Attempt to fetch tasks from API
      console.log("Calling tasks API endpoint");
      const response = await axios.get(
        apiUrl,
        {
          headers: {
            'Authorization': formattedToken
          }
        }
      );
      
      console.log("Raw API response:", response);
      console.log("Tasks API response data:", response.data);
      
      // Check if we have tasks in the response
      if (response.data && response.data.success) {
        // Get tasks from the data property
        const tasksData = response.data.data || [];
        
        console.log("Processed tasks data:", tasksData);
        
        if (tasksData.length > 0) {
          // Format tasks from backend to match frontend structure
          let formattedTasks = tasksData.map(task => {
            console.log("Processing task:", task);
            return {
              id: task._id || task.id,
              taskId: task.taskId || `TASK${Date.now()}`,
              title: task.title || 'Untitled Task',
              description: task.description || '',
              assignedTo: task.assignedTo ? {
                id: task.assignedTo._id || task.assignedTo.id || '',
                name: task.assignedTo.name || 'Unassigned',
                email: task.assignedTo.email || '',
                position: task.assignedTo.position || '',
                department: task.assignedTo.department || ''
              } : null,
              createdBy: task.createdBy ? {
                id: task.createdBy._id || task.createdBy.id || '',
                name: task.createdBy.name || 'Unknown',
                email: task.createdBy.email || ''
              } : null,
              dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : null,
              priority: task.priority || 'medium',
              status: task.status || 'incomplete',
              progress: task.progress || 0,
              createdAt: task.createdAt || new Date().toISOString(),
              modifiedAt: task.updatedAt || new Date().toISOString()
            };
          });
          
          console.log("Formatted tasks before validation:", formattedTasks);
          
          // Ensure all tasks have valid taskIds
          formattedTasks = formattedTasks.map(task => ensureValidTaskId(task, formattedTasks));
          
          console.log("Final formatted tasks:", formattedTasks);
          
          setTasks(formattedTasks);
          
          // Calculate stats
          updateTaskStats(formattedTasks);
          
          // Store in localStorage as backup
          localStorage.setItem('taskManagementTasks', JSON.stringify(formattedTasks));
        } else {
          console.warn("No tasks found in the response");
          setTasks([]);
          updateTaskStats([]);
        }
      } else {
        console.warn("Invalid or empty tasks data received from API");
        setTasks([]);
        updateTaskStats([]);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        console.error('Error status:', error.response.status);
      }
      
      // Try to load from localStorage as fallback
      const savedTasks = localStorage.getItem('taskManagementTasks');
      if (savedTasks) {
        try {
          console.log("Loading tasks from localStorage");
          const parsedTasks = JSON.parse(savedTasks);
          
          // Make sure tasks loaded from localStorage also have valid taskIds
          const validatedTasks = parsedTasks.map(task => ensureValidTaskId(task, parsedTasks));
          
          console.log("Parsed and validated tasks from localStorage:", validatedTasks);
          setTasks(validatedTasks);
          updateTaskStats(validatedTasks);
          showNotification('Loaded tasks from local storage. Some data may be outdated.', 'warning');
        } catch (parseError) {
          console.error('Error parsing tasks from localStorage:', parseError);
          setTasks([]);
          updateTaskStats([]);
        }
      } else {
        setTasks([]);
        updateTaskStats([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Add this function to fetch all employees, including newly registered ones
  const fetchAllUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/users`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data && response.data.user) {
        console.log("Successfully found users via API:", response.data.user.length);
        // Format users to match employee structure
        const formattedEmployees = response.data.user.map(user => ({
          id: user._id,
          name: user.name,
          email: user.email,
          position: user.position || 'Employee',
          department: user.department || 'General',
          employeeId: user.employeeId || ''
        }));
        setEmployees(formattedEmployees);
      } else {
        console.log("Failed to fetch users or no users found");
        // Initialize with empty employees
        setEmployees([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      // Fallback to empty employees
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  // Replace the employee fetching useEffect with this one
  useEffect(() => {
    // Fetch employees (users) when component mounts
    fetchAllUsers();
    
    // Fetch tasks initially
    fetchTasks();
    
    // Schedule periodic refresh
    const interval = setInterval(() => {
      fetchTasks();
      // Also refresh users periodically to catch newly registered users
      fetchAllUsers();
    }, 300000); // 5 minutes
    
    return () => clearInterval(interval);
  }, []);

  // Add a new useEffect to ensure employee list refreshes when needed
  useEffect(() => {
    // The empty dependency array on the previous useEffect means it only runs once
    // This effect will run whenever refreshTrigger changes
    if (refreshTrigger > 0) {
      console.log("Refresh triggered, updating employee list...");
      fetchAllUsers();
    }
  }, [refreshTrigger]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTaskForm({
      ...taskForm,
      [name]: value
    });
  };
  
  // Special handler for multi-select
  const handleAssigneeChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setTaskForm({
      ...taskForm,
      assignedTo: selectedOptions
    });
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/tasks`,
        taskForm,
        {
          headers: {
            'Authorization': `Bearer ${auth.token}`
          }
        }
      );

      if (response.data.success) {
        showNotification('Task created successfully');
        triggerStatsUpdate();
        resetForm();
        fetchTasks();
      }
    } catch (error) {
      console.error('Error creating task:', error);
      showNotification(error.response?.data?.message || 'Failed to create task', 'danger');
    }
  };

  const handleEditTask = (task) => {
    setIsEditing(true);
    
    // Make sure we have both IDs for debugging
    console.log("Task edit - MongoDB ID:", task.id);
    console.log("Task edit - Task ID:", task.taskId);
    
    // Store the task's MongoDB ID as a string, not the taskId
    setEditTaskId(task.id);
    
    console.log("Editing task with ID:", task.id);
    console.log("Full task details:", task);
    
    // Extract assignee IDs from task.assignedTo objects
    const assigneeIds = Array.isArray(task.assignedTo) 
      ? task.assignedTo.map(assignee => assignee.id) 
      : task.assignedTo?.id ? [task.assignedTo.id] : [];
    
    setTaskForm({
      title: task.title,
      description: task.description,
      assignedTo: assigneeIds,
      priority: task.priority,
      dueDate: task.dueDate,
      status: task.status
    });
    
    setViewMode('create');
  };

  const resetForm = () => {
    setTaskForm({
      title: '',
      description: '',
      assignedTo: [],
      priority: 'medium',
      dueDate: '',
      status: 'incomplete'
    });
    setIsEditing(false);
    setEditTaskId(null);
  };

  const cancelEdit = () => {
    resetForm();
    showNotification('Editing cancelled');
    setViewMode('dashboard');
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const response = await axios.patch(
        `${process.env.REACT_APP_BACKEND_URL}/api/tasks/${taskId}`,
        { status: newStatus },
        {
          headers: {
            'Authorization': `Bearer ${auth.token}`
          }
        }
      );

      if (response.data.success) {
        showNotification('Task status updated successfully');
        triggerStatsUpdate();
        fetchTasks();
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      showNotification(error.response?.data?.message || 'Failed to update task status', 'danger');
    }
  };

  const deleteTask = async (taskId) => {
    try {
      const response = await axios.delete(
        `${process.env.REACT_APP_BACKEND_URL}/api/tasks/${taskId}`,
        {
          headers: {
            'Authorization': `Bearer ${auth.token}`
          }
        }
      );

      if (response.data.success) {
        showNotification('Task deleted successfully');
        triggerStatsUpdate();
        fetchTasks();
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      showNotification(error.response?.data?.message || 'Failed to delete task', 'danger');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'incomplete':
        return 'primary';
      case 'on_hold':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  const renderStatusIcon = (status) => {
    if (!status) return <FaListAlt className="me-1" />;
    
    switch (status.toLowerCase()) {
      case 'completed':
        return <FaCheckCircle className="me-1" />;
      case 'incomplete':
        return <FaListAlt className="me-1" />;
      case 'on_hold':
        return <FaClock className="me-1" />;
      case 'completion_requested':
        return <FaHourglassHalf className="me-1" />;
      default:
        return <FaListAlt className="me-1" />;
    }
  };

  const getPriorityBadge = (priority) => {
    if (!priority) return <Badge bg="secondary">N/A</Badge>;
    
    switch (priority.toLowerCase()) {
      case 'high':
        return <Badge bg="danger">High</Badge>;
      case 'medium':
        return <Badge bg="warning">Medium</Badge>;
      case 'low':
        return <Badge bg="success">Low</Badge>;
      default:
        return <Badge bg="secondary">Normal</Badge>;
    }
  };

  const isTaskOverdue = (dueDate) => {
    if (!dueDate) return false;
    
    try {
      // Parse the due date properly
      const dueDateTime = new Date(dueDate);
      
      // Set to end of day to avoid time issues
      dueDateTime.setHours(23, 59, 59, 999);
      
      // Get current date (without time component)
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      
      // Compare the dates
      return dueDateTime < now;
    } catch (error) {
      console.error('Error checking if task is overdue:', error);
      return false;
    }
  };

  const isTaskDueToday = (dueDate) => {
    if (!dueDate) return false;
    
    try {
      // Parse the due date
      const dueDateTime = new Date(dueDate);
      
      // Get current date
      const now = new Date();
      
      // Compare year, month, and day
      return (
        dueDateTime.getFullYear() === now.getFullYear() &&
        dueDateTime.getMonth() === now.getMonth() &&
        dueDateTime.getDate() === now.getDate()
      );
    } catch (error) {
      console.error('Error checking if task is due today:', error);
      return false;
    }
  };

  const viewTask = (task) => {
    try {
      if (!task) {
        console.error('Cannot view task: Task data is missing');
        showNotification('Cannot view task details: Missing task data', 'danger');
        return;
      }
      
      // Validate task ID before proceeding
      if (!task.id && !task.taskId) {
        console.error('Cannot view task: Task ID is missing', task);
        showNotification('Task cannot be viewed: Invalid task identifier', 'danger');
        return;
      }
      
      // Check for required task properties
      if (!task.title) {
        console.warn('Task missing title, using fallback value');
      }
      
      // Create a clean task object with fallback values
      const cleanTask = {
        id: task.id || null,
        taskId: task.taskId || `TASK-${Date.now()}`,
        title: task.title || 'Untitled Task',
        description: task.description || '',
        priority: task.priority || 'Medium',
        status: task.status || 'Open',
        dueDate: task.dueDate || null,
        assignedTo: task.assignedTo || null,
        createdAt: task.createdAt || null,
        modifiedAt: task.modifiedAt || task.createdAt || null
      };
      
      // Check due date format if present
      if (cleanTask.dueDate) {
        try {
          // Validate the date format
          const dueDate = new Date(cleanTask.dueDate);
          if (isNaN(dueDate.getTime())) {
            console.warn('Invalid due date format', cleanTask.dueDate);
            cleanTask.dueDate = null;
          }
        } catch (dateError) {
          console.error('Error parsing task due date:', dateError);
          cleanTask.dueDate = null;
        }
      }
      
      // Log information for debugging
      console.log('Viewing task details:', cleanTask);
      
      setSelectedTask(cleanTask);
      setShowModal(true);
    } catch (error) {
      console.error('Error viewing task:', error);
      showNotification('An error occurred while viewing task details', 'danger');
      
      // Check for specific types of errors
      if (error instanceof TypeError) {
        console.error('Type error when processing task data');
      } else if (error instanceof SyntaxError) {
        console.error('Syntax error when processing task data');
      }
      
      // In case of any error, don't show the modal
      setShowModal(false);
      setSelectedTask(null);
    }
  };

  const closeTaskModal = () => {
    try {
      setShowModal(false);
      setSelectedTask(null);
    } catch (error) {
      console.error('Error closing task modal:', error);
    }
  };

  const getFilteredTasks = () => {
    switch (activeTab) {
      case 'assigned':
        return tasks.filter(task => 
          Array.isArray(task.assignedTo) 
            ? task.assignedTo.some(assignee => assignee.id === auth.userId) 
            : task.assignedTo?.id === auth.userId
        );
      case 'incomplete':
        return tasks.filter(task => task.status === 'incomplete');
      case 'overdue':
        return tasks.filter(task => 
          task.status !== 'completed' && 
          isTaskOverdue(task.dueDate)
        );
      case 'due_today':
        return tasks.filter(task => 
          task.status !== 'completed' && 
          isTaskDueToday(task.dueDate)
        );
      case 'completed':
        return tasks.filter(task => task.status === 'completed');
      default:
        return tasks;
    }
  };

  // Fetch tasks with pending completion requests
  const fetchPendingCompletionRequests = async () => {
    console.log("Fetching pending completion requests...");
    try {
      if (!isTokenValid()) {
        console.error('No valid token found for fetching completion requests');
        setPendingCompletionRequests([]);
        return;
      }
      
      // We'll filter our regular tasks endpoint for completion_requested status
      const formattedTasks = tasks.filter(task => task.status === 'completion_requested');
      
      // Set the pending completion requests
      setPendingCompletionRequests(formattedTasks);
      console.log("Pending completion requests:", formattedTasks);
      
    } catch (error) {
      console.error('Error fetching pending completion requests:', error);
      setPendingCompletionRequests([]);
    }
  };

  // Update useEffect to fetch pending completion requests when tasks change
  useEffect(() => {
    fetchPendingCompletionRequests();
  }, [tasks]);
  
  // Handle opening the completion review modal
  const handleReviewCompletionRequest = (task) => {
    console.log("Selected task for review:", task);
    
    // Use the task ID property that is available (_id or id)
    const taskWithId = {
      ...task,
      id: task.id || task._id,
      _id: task._id || task.id
    };
    
    console.log("Task with normalized IDs:", taskWithId);
    setSelectedCompletionRequest(taskWithId);
    setReviewNotes('');
    setReviewFeedback({ message: '', type: '' });
    setShowReviewModal(true);
  };

  // Handle approval/rejection of completion request
  const submitCompletionReview = async (status) => {
    if (!selectedCompletionRequest) return;
    
    console.log("Submitting review for task:", selectedCompletionRequest);
    setReviewSubmitting(true);
    setReviewFeedback({ message: '', type: '' });
    
    // Get task ID, handling different property names
    const taskId = selectedCompletionRequest._id || selectedCompletionRequest.id;
    console.log("Using task ID for submission:", taskId);
    
    try {
      const apiUrl = `${process.env.REACT_APP_BACKEND_URL}/api/tasks/${taskId}/review-completion`;
      console.log("API URL:", apiUrl);
      
      // Ensure we're using the correct token
      const token = localStorage.getItem('token');
      const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};
      
      const response = await axios.patch(
        apiUrl, 
        { 
          status: status, // 'approved' or 'rejected'
          reviewNotes: reviewNotes 
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      console.log("Review response:", response.data);
      
      if (response.data?.success) {
        setReviewFeedback({ 
          message: `Task completion request ${status === 'approved' ? 'approved' : 'rejected'} successfully!`, 
          type: 'success' 
        });
        
        setTimeout(() => {
          setShowReviewModal(false);
          // Refresh tasks to update the UI
          setRefreshTrigger(prev => prev + 1);
        }, 1500);
      } else {
        setReviewFeedback({ 
          message: response.data?.message || 'Failed to process request', 
          type: 'danger' 
        });
      }
    } catch (error) {
      console.error('Error processing completion review:', error);
      console.error('Error details:', error.response?.data);
      
      // If we get a 403 Forbidden error, show a more helpful message
      if (error.response?.status === 403) {
        setReviewFeedback({
          message: "You are not authorized to review this task. Only the task creator can approve or reject completion requests.",
          type: 'warning'
        });
      } else {
        setReviewFeedback({ 
          message: error.response?.data?.message || 'Failed to process completion review', 
          type: 'danger' 
        });
      }
    } finally {
      setReviewSubmitting(false);
    }
  };
  
  // Get count for pending badge
  const getPendingCompletionCount = () => {
    return stats.pendingApproval || 0;
  };

  // Add this enhanced function to render pending completion requests
  const renderPendingCompletionRequests = () => {
    // Get current user ID
    const currentUserId = auth.userId;
    
    console.log("Current user ID:", currentUserId);
    console.log("All tasks:", tasks);
    
    // Filter tasks with completion_requested status that were created by the current user
    const pendingRequests = tasks.filter(task => {
      // Debug information
      if (task.status === 'completion_requested') {
        console.log("Found completion request task:", task.id || task._id);
        console.log("Task createdBy:", task.createdBy);
        
        // Check different formats of createdBy
        const creatorId = typeof task.createdBy === 'object' 
          ? (task.createdBy._id || task.createdBy.id) 
          : task.createdBy;
          
        console.log("Creator ID:", creatorId);
        console.log("Matches current user:", creatorId === currentUserId);
        
        return task.status === 'completion_requested' && creatorId === currentUserId;
      }
      return false;
    });
    
    console.log("Filtered pending requests:", pendingRequests);
    
    if (pendingRequests.length === 0) {
      return (
        <div className="no-requests-message">
          <FaCheckCircle />
          <p>No pending completion requests for tasks you created at this time.</p>
          <small className="text-muted">Note: Only task creators can approve completion requests.</small>
        </div>
      );
    }
    
    return (
      <div className="completion-requests-container">
        <div className="info-banner mb-3">
          <FaInfoCircle className="me-2" />
          <span>As the creator of these tasks, only you can approve or reject their completion requests.</span>
        </div>
        <Table hover responsive className="completion-requests-table">
          <thead>
            <tr>
              <th>Task</th>
              <th>Assignee</th>
              <th>Due Date</th>
              <th>Requested</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingRequests.map(task => (
              <tr key={task.id || task._id} className="completion-request-row">
                <td>
                  <div className="task-title-cell">
                    {task.title}
                    <small className="d-block text-muted">
                      {task.description?.length > 50 
                        ? `${task.description.substring(0, 50)}...` 
                        : task.description}
                    </small>
                  </div>
                </td>
                <td>
                  <div className="requester-info">
                    <div>
                      {Array.isArray(task.assignedTo) 
                        ? task.assignedTo.map(user => user.name).join(', ')
                        : task.assignedTo?.name || 'Unknown'}
                    </div>
                    <small className="text-muted">
                      {Array.isArray(task.assignedTo) 
                        ? task.assignedTo[0]?.department
                        : task.assignedTo?.department || ''}
                    </small>
                  </div>
                </td>
                <td>
                  {task.dueDate 
                    ? new Date(task.dueDate).toLocaleDateString()
                    : 'Not set'}
                </td>
                <td>
                  {task.completionRequest?.requestedAt
                    ? new Date(task.completionRequest.requestedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })
                    : 'Unknown'}
                </td>
                <td>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleReviewCompletionRequest(task)}
                  >
                    <FaHourglassHalf className="me-1" /> Review
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    );
  };

  return (
    <div className="task-tracker-container">
      {/* Notification Alert */}
      {notification.show && (
        <Alert 
          variant={notification.type} 
          className="notification-alert"
          onClose={() => setNotification({...notification, show: false})} 
          dismissible
        >
          {notification.message}
        </Alert>
      )}
      
      {/* Header Bar */}
      <div className="task-header">
        <div className="btn-create-task-container">
          <Button 
            variant="primary" 
            className="btn-create-task"
            onClick={() => setViewMode('create')}
          >
            <FaTasks className="me-1" /> Create new Task
          </Button>
        </div>
        
        <div className="empty-space"></div>
        
        <div className="title-container">
          <h2 className="mb-0">
            <FaTasks className="me-2" />
            Task Management
          </h2>
          <span className="text-muted">Global Dashboard</span>
        </div>
      </div>
      
      {viewMode === 'create' ? (
        <div className="create-task-view">
          <div className="custom-task-card">
            <div className="custom-task-card-header">
              <h5 className="mb-0">{isEditing ? 'Edit Task' : 'Create New Task'}</h5>
              <button 
                type="button"
                className="custom-btn custom-btn-outline"
                onClick={() => isEditing ? cancelEdit() : setViewMode('dashboard')}
              >
                Back to Dashboard
              </button>
            </div>
            <div className="custom-task-card-body">
              <form className="custom-task-form" onSubmit={handleCreateTask} autoComplete="off">
                <div className="custom-form-group">
                  <label className="custom-form-label">
                    Task Title <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    className="custom-form-control"
                    value={taskForm.title}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter a descriptive task title"
                  />
                </div>
                <div className="custom-form-group">
                  <label className="custom-form-label">Priority</label>
                  <select
                    name="priority"
                    className="custom-form-control"
                    value={taskForm.priority}
                    onChange={handleInputChange}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="custom-form-group custom-form-span-2">
                  <label className="custom-form-label">Task Description</label>
                  <textarea
                    name="description"
                    className="custom-form-control"
                    rows={3}
                    value={taskForm.description}
                    onChange={handleInputChange}
                    placeholder="Provide detailed information about this task"
                  />
                </div>
                <div className="custom-form-group">
                  <label className="custom-form-label">
                    Assigned To <span className="required">*</span>
                    <div className="custom-text-muted">(Multiple selection allowed)</div>
                  </label>
                  <select
                    name="assignedTo"
                    className="custom-form-control custom-employee-select"
                    value={taskForm.assignedTo}
                    onChange={handleAssigneeChange}
                    required
                    multiple
                  >
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name} - {employee.position || 'Employee'} ({employee.department || 'N/A'})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="custom-form-group">
                  <label className="custom-form-label">
                    Due Date <span className="required">*</span>
                  </label>
                  <input
                    type="date"
                    name="dueDate"
                    className="custom-form-control"
                    value={taskForm.dueDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                {isEditing && (
                  <div className="custom-form-group custom-form-span-2">
                    <label className="custom-form-label">Status</label>
                    <select
                      name="status"
                      className="custom-form-control"
                      value={taskForm.status}
                      onChange={handleInputChange}
                    >
                      <option value="incomplete">Open</option>
                      <option value="on_hold">On Hold</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                )}
                <div className="custom-form-button-group">
                  <button type="submit" className="custom-btn custom-btn-primary">
                    {isEditing ? 'Update Task' : 'Create Task'}
                  </button>
                  <button
                    type="button"
                    className="custom-btn custom-btn-secondary"
                    onClick={() => isEditing ? cancelEdit() : resetForm()}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : (
        /* Task Dashboard */
        <>
        
          {/* Task Statistics */}
          <div className="row mb-4">
            <div className="col-md-8 mb-3">
              <div className="row">
                <div className="col-md-3 mb-3">
                  <div className="dashboard-card">
                    <div className="icon-wrapper">
                      <FaTasks />
                    </div>
                    <div className="content">
                      <h3>All Tasks</h3>
                      <div className="stats-value">{stats.total || 0}</div>
                    </div>
                  </div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className="dashboard-card">
                    <div className="icon-wrapper">
                      <FaListAlt />
                    </div>
                    <div className="content">
                      <h3>Incomplete</h3>
                      <div className="stats-value">{stats.incomplete || 0}</div>
                    </div>
                  </div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className="dashboard-card">
                    <div className="icon-wrapper">
                      <FaExclamationCircle />
                    </div>
                    <div className="content">
                      <h3>Overdue</h3>
                      <div className="stats-value">{stats.overdue || 0}</div>
                    </div>
                  </div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className="dashboard-card">
                    <div className="icon-wrapper">
                      <FaCalendarDay />
                    </div>
                    <div className="content">
                      <h3>Due Today</h3>
                      <div className="stats-value">{stats.dueToday || 0}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4 mb-3">
              <Card className="h-100">
                <Card.Header className="d-flex align-items-center">
                  <FaChartPie className="me-2" /> Task Statistics
                </Card.Header>
                <Card.Body>
                  <div className="task-stats-chart">
                    <svg viewBox="0 0 42 42" className="donut-chart">
                      {/* Background circle */}
                      <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#f0f0f0" strokeWidth="4"></circle>
                      
                      {/* Calculate the stroke dasharray and offset for each segment */}
                      {stats.total > 0 && (
                        <>
                          {/* Open Tasks */}
                          <circle 
                            className="chart-segment chart-open"
                            cx="21" 
                            cy="21" 
                            r="15.91549430918954" 
                            fill="transparent"
                            strokeWidth="4"
                            strokeDasharray={`${stats.incomplete / stats.total * 100} ${100 - stats.incomplete / stats.total * 100}`}
                            strokeDashoffset="0"
                          ></circle>
                          
                          {/* Completed Tasks */}
                          <circle 
                            className="chart-segment chart-completed"
                            cx="21" 
                            cy="21" 
                            r="15.91549430918954" 
                            fill="transparent"
                            strokeWidth="4"
                            strokeDasharray={`${stats.completed / stats.total * 100} ${100 - stats.completed / stats.total * 100}`}
                            strokeDashoffset={100 - (stats.incomplete / stats.total * 100)}
                          ></circle>
                          
                          {/* Overdue Tasks */}
                          <circle 
                            className="chart-segment chart-overdue"
                            cx="21" 
                            cy="21" 
                            r="15.91549430918954" 
                            fill="transparent"
                            strokeWidth="4"
                            strokeDasharray={`${stats.overdue / stats.total * 100} ${100 - stats.overdue / stats.total * 100}`}
                            strokeDashoffset={100 - ((stats.incomplete + stats.completed) / stats.total * 100)}
                          ></circle>
                          
                          {/* Due Today Tasks */}
                          <circle 
                            className="chart-segment chart-due-today"
                            cx="21" 
                            cy="21" 
                            r="15.91549430918954" 
                            fill="transparent"
                            strokeWidth="4"
                            strokeDasharray={`${stats.dueToday / stats.total * 100} ${100 - stats.dueToday / stats.total * 100}`}
                            strokeDashoffset={100 - ((stats.incomplete + stats.completed + stats.overdue) / stats.total * 100)}
                          ></circle>
                        </>
                      )}
                    </svg>
                    <div className="chart-label">
                      <div className="chart-count">{stats.total}</div>
                      <div className="chart-label-text">Open Tasks</div>
                    </div>
                  </div>
                  
                  <div className="chart-legend">
                    <div className="legend-item">
                      <div className="legend-color legend-open"></div>
                      <span>Open</span>
                    </div>
                    <div className="legend-item">
                      <div className="legend-color legend-completed"></div>
                      <span>Completed</span>
                    </div>
                    <div className="legend-item">
                      <div className="legend-color legend-overdue"></div>
                      <span>Overdue</span>
                    </div>
                    <div className="legend-item">
                      <div className="legend-color legend-due-today"></div>
                      <span>Due Today</span>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </div>
          </div>
          
          {/* Task List Table */}
          <Card className="task-list-card">
            <Card.Header>
              <h5 className="mb-0">All Tasks</h5>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="task-table-container">
                <Table hover className="task-table mb-0">
                  <thead>
                    <tr>
                      <th>Task ID</th>
                      <th>Title</th>
                      <th>Description</th>
                      <th>Assigned To</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Due Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task) => (
                      <tr key={task.id} className={isTaskOverdue(task.dueDate) ? 'overdue-task' : ''}>
                        <td>{task.taskId || 'N/A'}</td>
                        <td>
                          <div className="task-title-cell">
                            {task.title || 'Untitled Task'}
                          </div>
                        </td>
                        <td>
                          <div className="task-description">
                            {task.description?.length > 50 
                              ? `${task.description.substring(0, 50)}...` 
                              : task.description || 'No description'}
                          </div>
                        </td>
                        <td>
                          <div className="assigned-users">
                            {Array.isArray(task.assignedTo) 
                              ? task.assignedTo.map(user => (
                                  <div key={user.id} className="user-badge">
                                    {user.name}
                                    <small className="d-block text-muted">
                                      {user.department || 'No Department'}
                                    </small>
                                  </div>
                                ))
                              : task.assignedTo?.name || 'Unassigned'}
                          </div>
                        </td>
                        <td>
                          {getPriorityBadge(task.priority)}
                        </td>
                        <td>
                          <div className={`status-badge ${task.status}`}>
                            {task.status === 'incomplete' ? 'Open' : 
                             task.status === 'completed' ? 'Completed' : 
                             task.status === 'on_hold' ? 'On Hold' : 'Open'}
                            {isTaskOverdue(task.dueDate) && task.status !== 'completed' && (
                              <Badge bg="danger" className="ms-2">Overdue</Badge>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className={`due-date ${isTaskOverdue(task.dueDate) ? 'text-danger' : isTaskDueToday(task.dueDate) ? 'text-warning' : ''}`}>
                            <FaCalendarDay className="me-1" />
                            {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}
                            {isTaskDueToday(task.dueDate) && (
                              <Badge bg="warning" className="ms-2">Today</Badge>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <Button 
                              variant="link" 
                              size="sm" 
                              className="p-0 me-2 text-primary"
                              title="View Task"
                              onClick={() => viewTask(task)}
                            >
                              <FaEye />
                            </Button>
                            <Button 
                              variant="link" 
                              size="sm" 
                              className="p-0 me-2 text-warning"
                              title="Edit Task"
                              onClick={() => handleEditTask(task)}
                            >
                              <FaEdit />
                            </Button>
                            <Button 
                              variant="link" 
                              size="sm" 
                              className="p-0 text-danger"
                              title="Delete Task"
                              onClick={() => deleteTask(task.id)}
                            >
                              <FaTrash />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </>
      )}
      
      {/* Task Details Modal */}
      {showModal && selectedTask && (
        <TaskDetailsModal 
          show={showModal} 
          onHide={closeTaskModal} 
          task={selectedTask}
        />
      )}
      
      {/* Completion Review Modal */}
      <Modal show={showReviewModal} onHide={() => setShowReviewModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Review Task Completion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedCompletionRequest && (
            <div>
              <h5>{selectedCompletionRequest.title}</h5>
              <p className="text-muted small mb-3">{selectedCompletionRequest.description || 'No description'}</p>
              
              <div className="mb-3">
                <strong>Priority:</strong> {getPriorityBadge(selectedCompletionRequest.priority)}
              </div>
              
              <div className="mb-3">
                <strong>Assigned To:</strong>{' '}
                {Array.isArray(selectedCompletionRequest.assignedTo) 
                  ? selectedCompletionRequest.assignedTo.map(user => user.name).join(', ')
                  : selectedCompletionRequest.assignedTo?.name || 'Unknown'
                }
              </div>
              
              <div className="mb-3">
                <strong>Due Date:</strong>{' '}
                {selectedCompletionRequest.dueDate 
                  ? new Date(selectedCompletionRequest.dueDate).toLocaleDateString() 
                  : 'No date'
                }
              </div>
              
              <Form.Group className="mb-3">
                <Form.Label>Review Notes (Optional)</Form.Label>
                <Form.Control 
                  as="textarea" 
                  rows={3} 
                  placeholder="Add any feedback on the completed task..."
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
          <Button 
            variant="secondary" 
            onClick={() => setShowReviewModal(false)}
            disabled={reviewSubmitting}
          >
            Close
          </Button>
          <Button 
            variant="danger" 
            onClick={() => submitCompletionReview('rejected')}
            disabled={reviewSubmitting}
            className="me-2"
          >
            {reviewSubmitting ? (
              <Spinner animation="border" size="sm" />
            ) : (
              <>
                <FaTimesCircle className="me-1" /> Reject
              </>
            )}
          </Button>
          <Button 
            variant="success" 
            onClick={() => submitCompletionReview('approved')}
            disabled={reviewSubmitting}
          >
            {reviewSubmitting ? (
              <Spinner animation="border" size="sm" />
            ) : (
              <>
                <FaCheck className="me-1" /> Approve
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default TaskManagement; 