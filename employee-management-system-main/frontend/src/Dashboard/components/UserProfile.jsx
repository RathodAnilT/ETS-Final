import React, { useState, useEffect, useContext } from "react";
import { Card, Button, Alert, Badge, Nav, Row, Col, Container } from "react-bootstrap";
import { Spin, message } from "antd";
import axios from "axios";
import { FaUser, FaTasks, FaComments, FaCalendarAlt, FaCheckCircle, FaClock, FaExclamationCircle, FaBell, FaHourglassHalf } from "react-icons/fa";
import { useParams, useNavigate } from "react-router-dom";
import getIcon from "../../utils/getIcon";
import userContext from "../../context/userContext";
import NotificationCenter from "./NotificationCenter";
import UserTasks from "./UserTasks";
import "./UserProfile.css";

const UserProfile = ({ userId }) => {
  const { uid } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("about");
  const [tasks, setTasks] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [messageApi, contextHolder] = message.useMessage();
  const auth = useContext(userContext);
  
  // Check if current user is a manager (creator of tasks)
  const [isManager, setIsManager] = useState(false);
  // Check if viewing self or another user
  const [isSelfProfile, setIsSelfProfile] = useState(false);
  // Flag to indicate if user has created tasks
  const [isTaskCreator, setIsTaskCreator] = useState(false);

  // Function to fetch user data
  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('token');
      const userIdToFetch = uid || userId || auth.userId;
      
      // Check if viewing own profile
      setIsSelfProfile(userIdToFetch === auth.userId);
      
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/users/${userIdToFetch}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      setUser(response.data.user);
      
      // Check if user is a manager/task creator by checking if they have created tasks
      checkIfTaskCreator();
      
      setLoading(false);
    } catch (error) {
      setError("Failed to fetch user data");
      setLoading(false);
    }
  };

  // Check if the current user is a manager or task creator
  const checkIfTaskCreator = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
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
        
        // Also set isManager if user role is manager
        if (user && user.role === 'manager') {
          setIsManager(true);
        } else {
          setIsManager(hasTasks);
        }
        
        // Filter pending completion requests
        const requests = response.data.tasks.filter(task => 
          task.status === 'completion_requested'
        );
        setPendingRequests(requests);
      }
    } catch (error) {
      console.error('Error checking task creator status:', error);
    }
  };

  // Function to fetch user's assigned tasks
  const fetchUserTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const userIdToFetch = uid || userId || auth.userId;

      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/tasks/assigned-to/${userIdToFetch}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data && response.data.tasks) {
        setTasks(response.data.tasks);
      }
    } catch (error) {
      console.error('Error fetching user tasks:', error);
      messageApi.error('Failed to load tasks');
    }
  };

  useEffect(() => {
    fetchUser();
    fetchUserTasks();
    
    // Set up a refresh interval to keep tasks updated
    const interval = setInterval(() => {
      fetchUserTasks();
      if (isSelfProfile) {
        checkIfTaskCreator(); // Refresh pending requests
      }
    }, 300000); // Refresh every 5 minutes
    
    return () => clearInterval(interval);
  }, [uid, userId, auth.userId]);

  // Priority badge component
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

  // Check if task is overdue
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

  if (loading) {
    return <Spin fullscreen />;
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  if (!user) {
    return <Alert variant="warning">User not found</Alert>;
  }

  // Check if user can access notifications
  const canAccessNotifications = isSelfProfile && (isManager || isTaskCreator || pendingRequests.length > 0);

  return (
    <Container className="profile-container mt-4">
      {contextHolder}
      <Row>
        <Col md={4}>
          <div className="modern-profile-card">
            <div className="profile-header">
              <div className="profile-image-container">
                {user.image ? (
                  <img
                    src={user.image} 
                    alt={user.name} 
                    className="profile-image"
                  />
                ) : (
                  <div className="profile-initials">
                    {user.name.split(' ').map(name => name[0]).join('').toUpperCase()}
                  </div>
                )}
                  </div>
              {isSelfProfile && (
                <div className="profile-actions">
                  <button className="btn btn-edit" onClick={() => navigate(`/edit/${user._id}`)}>
                    {getIcon("edit")}
                  </button>
                  </div>
              )}
            </div>

            <div className="profile-details">
              <h3 className="profile-name">{user.name}</h3>
              <div className="profile-role">{user.position}</div>
              
              <div className="profile-id">
                {user.employeeId ? (
                  <Badge pill bg="primary" className="id-badge">ID: {user.employeeId}</Badge>
                ) : (
                  <Badge pill bg="secondary" className="id-badge">ID: Not assigned</Badge>
                )}
              </div>
              
              <div className="divider"></div>
              
              <div className="contact-info">
                <h4>Contact Information</h4>
                
                <div className="info-item">
                  <div className="info-label">Email</div>
                  <div className="info-value">{user.email}</div>
                </div>
                
                <div className="info-item">
                  <div className="info-label">Phone</div>
                  <div className="info-value">{user.phone || "Not provided"}</div>
                </div>
                
                <div className="info-item">
                  <div className="info-label">Department</div>
                  <div className="info-value">{user.department}</div>
                </div>
                
                <div className="info-item">
                  <div className="info-label">Join Date</div>
                  <div className="info-value">
                    {user.joiningDate ? new Date(user.joiningDate).toLocaleDateString() : 'Not specified'}
                  </div>
                </div>
              </div>
                  </div>
            
            {/* Show notification badge for users with pending requests */}
            {isSelfProfile && pendingRequests.length > 0 && (
              <div className="manager-notification mt-3">
                <Alert variant="info">
                  <div className="d-flex align-items-center">
                    <FaBell className="me-2" />
                    <span>
                      You have <strong>{pendingRequests.length}</strong> pending task completion {pendingRequests.length === 1 ? 'request' : 'requests'}
                    </span>
                  </div>
                  <Button 
                    variant="outline-primary" 
                    size="sm" 
                    className="mt-2 w-100"
                    onClick={() => setActiveTab("notifications")}
                  >
                    <FaHourglassHalf className="me-1" /> View Requests
                  </Button>
                </Alert>
            </div>
            )}
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
                    {tasks.length > 0 && (
                      <Badge pill bg="primary" className="ms-2">{tasks.length}</Badge>
                    )}
                  </Nav.Link>
                  </Nav.Item>
                {canAccessNotifications && (
                  <Nav.Item>
                    <Nav.Link eventKey="notifications" className="tab-link">
                      <FaBell className="tab-icon" /> 
                      <span className="tab-text">Notifications</span>
                      {pendingRequests.length > 0 && (
                        <Badge pill bg="danger" className="ms-2">{pendingRequests.length}</Badge>
                      )}
                    </Nav.Link>
                  </Nav.Item>
                )}
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
                            <div className="item-value">{user.name}</div>
                          </div>
                          
                          <div className="grid-item">
                            <div className="item-label">Date of Birth</div>
                            <div className="item-value">
                              {user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : 'Not specified'}
                        </div>
                      </div>

                          <div className="grid-item">
                            <div className="item-label">Gender</div>
                            <div className="item-value">{user.gender || 'Not specified'}</div>
                          </div>
                          
                          <div className="grid-item">
                            <div className="item-label">Address</div>
                            <div className="item-value">{user.address || 'Not specified'}</div>
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
                            <div className="item-value">{user.employeeId}</div>
                          </div>
                          
                          <div className="grid-item">
                            <div className="item-label">Position</div>
                            <div className="item-value">{user.position}</div>
                      </div>

                          <div className="grid-item">
                            <div className="item-label">Department</div>
                            <div className="item-value">{user.department}</div>
                          </div>
                          
                          <div className="grid-item">
                            <div className="item-label">Salary</div>
                            <div className="item-value">{user.salary ? `₹${user.salary}` : 'Not specified'}</div>
                          </div>
                        </div>
                      </div>
                    </Col>
                  </Row>
                  
                  <div className="info-section mt-4">
                    <h3 className="section-title">Education & Background</h3>
                    <p className="section-content">
                      {user.education || 'No education details available'}
                    </p>
                  </div>
                  
                  <div className="external-links mt-4">
                    <h3 className="section-title">External Profiles</h3>
                    <div className="links-grid">
                      {user.githubId && (
                        <a 
                          href={`https://github.com/${user.githubId}`} 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="external-link github-link"
                        >
                          <i className="fab fa-github"></i>
                          <span>GitHub Profile</span>
                        </a>
                      )}
                      
                      {user.linkedInId && (
                        <a 
                          href={user.linkedInId.startsWith('http') ? user.linkedInId : `https://linkedin.com/in/${user.linkedInId}`} 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="external-link linkedin-link"
                        >
                          <i className="fab fa-linkedin"></i>
                          <span>LinkedIn Profile</span>
                        </a>
                      )}
                    </div>
                            </div>
                          </div>
              )}
              
              {activeTab === "tasks" && (
                <div className="tasks-content">
                  <UserTasks userId={uid || userId || auth.userId} />
                            </div>
              )}
              
              {activeTab === "notifications" && canAccessNotifications && (
                <div className="notifications-content">
                  <h4 className="section-title mb-4">
                    <FaBell className="me-2" /> Task Approval Requests
                    {isTaskCreator && 
                      <span className="badge bg-primary ms-2">
                        {isManager ? "Manager" : "Task Creator"} View
                                  </span>
                    }
                  </h4>
                  <NotificationCenter />
                    </div>
                )}

                {activeTab === "reviews" && (
                <div className="reviews-content">
                  <div className="no-data-message">
                    <FaComments className="empty-icon" />
                    <p>No reviews or feedback available at this time.</p>
                  </div>
                  </div>
                )}
              </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default UserProfile; 