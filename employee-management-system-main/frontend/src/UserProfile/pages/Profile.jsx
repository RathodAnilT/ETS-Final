import React, { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, Row, Col, Nav, Container, Badge, Button } from "react-bootstrap";
import { Spin, message } from "antd";
import { FaUser, FaTasks, FaComments, FaCalendarAlt, FaCheckCircle, FaClock, FaExclamationCircle, FaDownload, FaHourglassHalf, FaArrowLeft, FaCamera } from "react-icons/fa";

import userContext from "../../context/userContext";
import EditEmployee from "../../User/pages/EditEmployee";
import CreatorTaskApprovals from "../components/CreatorTaskApprovals";
import "./Profile.css";
import getIcon from "../../utils/getIcon";

const Profile = () => {
  const auth = useContext(userContext);
  const navigate = useNavigate();
  const { uid } = useParams();
  const [editMode, setEditMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState(undefined);
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState("about");
  const [loading, setLoading] = useState(true);
  const [photoUploading, setPhotoUploading] = useState(false);

  const fetchUserTasks = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return [];
      
      // Try to load from localStorage first for immediate data
      const savedTasks = localStorage.getItem('taskManagementTasks');
      let userTasks = [];
      
      if (savedTasks) {
        const parsedTasks = JSON.parse(savedTasks);
        userTasks = parsedTasks.filter(task => {
          if (!task.assignedTo) return false;
          const assignedId = task.assignedTo.id || task.assignedTo._id;
          return assignedId === userId;
        });
      }
      
      // Also try to get from API
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
        const serverTasks = response.data.tasks.filter(task => {
          if (!task.assignedTo) return false;
          const assignedId = task.assignedTo._id || task.assignedTo.id;
          return assignedId === userId;
        }).map(task => ({
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
        
        if (serverTasks.length > 0) {
          return serverTasks;
        }
      }
      
      return userTasks.length > 0 ? userTasks : [];
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
  };

  useEffect(() => {
    const getSelectedUserData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/users/${uid}`);
        setSelectedUser(response.data.user);
        
        // Fetch tasks for this user
        const userTasks = await fetchUserTasks(uid);
        setTasks(userTasks);
        
        setLoading(false);
      } catch (error) {
        console.log(error);
        setLoading(false);
      }
    };
    getSelectedUserData();
  }, [uid, editMode]);

  // Utility functions for tasks
  const renderPriorityBadge = (priority) => {
    const priorityString = String(priority || '').toLowerCase();
    
    switch (priorityString) {
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

  const renderStatusBadge = (status) => {
    const statusString = String(status || '').toLowerCase();
    
    switch (statusString) {
      case 'completed':
        return <Badge bg="success"><FaCheckCircle className="me-1" /> Completed</Badge>;
      case 'incomplete':
        return <Badge bg="primary"><FaClock className="me-1" /> Open</Badge>;
      case 'on_hold':
        return <Badge bg="warning"><FaClock className="me-1" /> On Hold</Badge>;
      default:
        return <Badge bg="secondary">Unknown</Badge>;
    }
  };

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

  const handleGoBack = () => {
    navigate(-1);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);
    
    try {
      setPhotoUploading(true);
      const response = await axios.patch(
        `${process.env.REACT_APP_BACKEND_URL}/api/users/editEmployee/${selectedUser._id}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${auth.token}`
          }
        }
      );
      
      setSelectedUser(prev => ({ ...prev, image: response.data.image }));
      message.success('Profile photo updated successfully');
    } catch (error) {
      console.error('Error uploading photo:', error);
      message.error('Failed to upload photo. Please try again.');
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleEdit = () => {
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
  };

  if (editMode) {
    return (
      <Container className="profile-container mt-4">
        <Button 
          variant="outline-primary" 
          onClick={handleCancelEdit} 
          className="go-back-btn mb-4"
        >
          <FaArrowLeft /> Back to Profile
        </Button>
        <EditEmployee user={selectedUser} changeMode={handleCancelEdit} />
      </Container>
    );
  }

    return (
      <>
      {loading ? (
        <Spin fullscreen></Spin>
      ) : selectedUser ? (
        <Container className="profile-container mt-4">
          <Button 
            variant="outline-primary" 
            onClick={handleGoBack} 
            className="go-back-btn mb-4"
          >
            <FaArrowLeft /> Go Back
          </Button>
          <Row>
            <Col md={4}>
              <div className="modern-profile-card">
                <div className="profile-header">
                  <div className="profile-image-container">
                    <img 
                      src={selectedUser.image || "https://via.placeholder.com/150"} 
                      alt={selectedUser.name} 
                      className="profile-image"
                    />
                    {(auth.isSuperUser || auth.userId === selectedUser._id) && (
                      <div className="photo-upload-wrapper">
                        <input
                          type="file"
                          id="photo-upload"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          style={{ display: 'none' }}
                        />
                        <label htmlFor="photo-upload" className="photo-upload-button">
                          {photoUploading ? (
                            <Spin size="small" />
                          ) : (
                            <FaCamera />
                          )}
                        </label>
                      </div>
                    )}
                  </div>
                  <div className="profile-actions">
                    {auth.isSuperUser || auth.userId === selectedUser._id ? (
                      <button className="btn btn-edit" onClick={handleEdit}>
                        {getIcon("edit")}
                      </button>
                    ) : null}
                  </div>
                </div>
                
                  <div className="profile-details">
                  <h3 className="profile-name">{selectedUser.name}</h3>
                  <div className="profile-role">{selectedUser.position}</div>
                  
                  <div className="profile-id">
                    <Badge pill bg="primary" className="id-badge">ID: {selectedUser.employeeId}</Badge>
                  </div>
                  
                  <div className="divider"></div>
                  
                  <div className="contact-info">
                    <h4>Contact Information</h4>
                    
                    <div className="info-item">
                      <div className="info-label">Email</div>
                      <div className="info-value">{selectedUser.email}</div>
                    </div>
                    
                    <div className="info-item">
                      <div className="info-label">Phone</div>
                      <div className="info-value">{selectedUser.phone || "Not provided"}</div>
                    </div>
                    
                    <div className="info-item">
                      <div className="info-label">Department</div>
                      <div className="info-value">{selectedUser.department}</div>
                    </div>
                    
                    <div className="info-item">
                      <div className="info-label">Join Date</div>
                      <div className="info-value">
                        {selectedUser.joiningDate ? new Date(selectedUser.joiningDate).toLocaleDateString() : 'Not specified'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Col>
            
            <Col md={8}>
              <div className="modern-content-card">
                <div className="content-tabs">
                  <Nav variant="tabs" activeKey={activeTab} onSelect={(key) => setActiveTab(key)} className="modern-tabs">
                    <Nav.Item>
                      <Nav.Link eventKey="about" className="tab-link">
                        <FaUser className="tab-icon" /> 
                        <span className="tab-text">About</span>
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="tasks" className="tab-link">
                        <FaTasks className="tab-icon" /> 
                        <span className="tab-text">Tasks & Projects</span>
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="reviews" className="tab-link">
                        <FaComments className="tab-icon" /> 
                        <span className="tab-text">Reviews & Feedback</span>
                      </Nav.Link>
                    </Nav.Item>
                  </Nav>
                </div>
                
                <div className="content-body">
                  {activeTab === "about" && (
                    <div className="about-content">
                      <Row>
                        <Col md={6}>
                          <div className="info-section">
                            <h3 className="section-title">Personal Information</h3>
                            <div className="info-grid">
                              <div className="grid-item">
                                <div className="item-label">Full Name</div>
                                <div className="item-value">{selectedUser.name}</div>
                              </div>
                              
                              <div className="grid-item">
                                <div className="item-label">Date of Birth</div>
                                <div className="item-value">
                                  {selectedUser.dateOfBirth ? new Date(selectedUser.dateOfBirth).toLocaleDateString() : 'Not specified'}
                                </div>
                              </div>
                              
                              <div className="grid-item">
                                <div className="item-label">Gender</div>
                                <div className="item-value">{selectedUser.gender || 'Not specified'}</div>
                              </div>
                              
                              <div className="grid-item">
                                <div className="item-label">Address</div>
                                <div className="item-value">{selectedUser.address || 'Not specified'}</div>
                              </div>
                            </div>
                          </div>
                        </Col>
                        
                        <Col md={6}>
                          <div className="info-section">
                            <h3 className="section-title">Professional Information</h3>
                            <div className="info-grid">
                              <div className="grid-item">
                                <div className="item-label">Employee ID</div>
                                <div className="item-value">{selectedUser.employeeId}</div>
                              </div>
                              
                              <div className="grid-item">
                                <div className="item-label">Position</div>
                                <div className="item-value">{selectedUser.position}</div>
                              </div>
                              
                              <div className="grid-item">
                                <div className="item-label">Department</div>
                                <div className="item-value">{selectedUser.department}</div>
                              </div>
                              
                              <div className="grid-item">
                                <div className="item-label">Joining Date</div>
                                <div className="item-value">
                                  {selectedUser.joiningDate ? new Date(selectedUser.joiningDate).toLocaleDateString() : 'Not specified'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </Col>
                      </Row>
                    </div>
                  )}
                  
                  {activeTab === "tasks" && (
                    <div className="tasks-content">
                      {/* Show task approvals section only for current user's profile */}
                      {auth.userId === selectedUser._id && (
                        <CreatorTaskApprovals userId={selectedUser._id} />
                      )}
                      
                      <div className="tasks-header">
                        <h3 className="section-title">Assigned Tasks</h3>
                        <span className="task-count">
                          <Badge bg="info" pill>{tasks.length} {tasks.length === 1 ? 'Task' : 'Tasks'}</Badge>
                        </span>
                      </div>
                      
                      {tasks.length === 0 ? (
                        <div className="no-data-message">
                          <FaTasks className="empty-icon" />
                          <p>No tasks assigned to this employee.</p>
                        </div>
                      ) : (
                        <div className="tasks-list">
                          {tasks.map(task => (
                            <div key={task.id} className={`task-item ${isTaskOverdue(task.dueDate) ? 'overdue' : ''} ${task.status === 'completed' ? 'completed' : ''}`}>
                              <div className="task-main">
                                <div className="task-status">
                                  {task.status === 'completed' ? 
                                    <span className="status-dot completed"><FaCheckCircle /></span> : 
                                    task.status === 'completion_requested' ?
                                      <span className="status-dot awaiting"><FaHourglassHalf /></span> :
                                    isTaskOverdue(task.dueDate) ? 
                                      <span className="status-dot overdue"><FaExclamationCircle /></span> :
                                      <span className="status-dot in-progress"><FaClock /></span>
                                  }
                                </div>
                                
                                <div className="task-info">
                                  <div className="task-title">
                                    {task.title}
                                    <span className="task-id">#{task.taskId}</span>
                                  </div>
                                  
                                  <div className="task-description">
                                    {task.description || 'No description provided'}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="task-meta">
                                <div className="task-priority">
                                  {renderPriorityBadge(task.priority)}
                                </div>
                                
                                <div className="task-status-badge">
                                  {renderStatusBadge(task.status)}
                                </div>
                                
                                <div className="task-due-date">
                                  <FaCalendarAlt className="due-icon" />
                                  <span className={isTaskOverdue(task.dueDate) ? 'overdue-text' : ''}>
                                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No deadline'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {activeTab === "reviews" && (
                    <div className="reviews-content">
                      <h3 className="section-title">Performance Reviews</h3>
                      
                      <div className="no-data-message">
                        <FaComments className="empty-icon" />
                        <p>No performance reviews available yet.</p>
                      </div>
                    </div>
                  )}
            </div>
          </div>
            </Col>
          </Row>
        </Container>
        ) : (
        <div className="text-center">User not found</div>
        )}
      </>
    );
};

export default Profile;
