import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Spinner, Alert, Nav, Tab } from 'react-bootstrap';
import { UserContext } from '../../contexts/userContext';
import UserProfileCard from '../components/UserProfileCard';
import UserTasks from '../components/UserTasks';
import { FaTasks, FaIdCard, FaHistory, FaFileAlt, FaGithub, FaLinkedin } from 'react-icons/fa';
import axios from 'axios';
import './UserProfile.css';

const UserProfile = () => {
  const { user } = useContext(UserContext);
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('tasks');

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // If we already have complete user details from context, use that
        if (user && user._id && user.name && user.position && user.email) {
          setUserDetails(user);
          setLoading(false);
          return;
        }
        
        // Otherwise fetch from API
        const response = await axios.get(`/api/users/${user._id}`);
        setUserDetails(response.data);
      } catch (err) {
        console.error('Error fetching user details:', err);
        setError('Failed to load user profile. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (user && user._id) {
      fetchUserDetails();
    }
  }, [user]);

  const handlePhotoUpload = async (file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);
    
    try {
      setPhotoUploading(true);
      const response = await axios.post(`/api/users/${user._id}/upload-photo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Update the user details with the new photo URL
      setUserDetails(prev => ({ ...prev, image: response.data.image }));
      
      // Also update in the context if needed
      // updateUser({ ...user, image: response.data.image });
    } catch (err) {
      console.error('Error uploading photo:', err);
      setError('Failed to upload photo. Please try again later.');
    } finally {
      setPhotoUploading(false);
    }
  };

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="user-profile-container">
      <div className="profile-header-section">
        <h1 className="profile-title">User Profile</h1>
      </div>
      
      <Row>
        <Col lg={4} md={5}>
          <UserProfileCard 
            user={userDetails} 
            loading={loading} 
            onPhotoUpload={handlePhotoUpload}
            photoUploading={photoUploading}
          />
          
          {!loading && userDetails && (
            <Card className="social-card">
              <Card.Body>
                <h5 className="section-title">Connect</h5>
                
                {userDetails.linkedInId && (
                  <a 
                    href={`https://linkedin.com/in/${userDetails.linkedInId}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="social-link linkedin"
                  >
                    <FaLinkedin className="social-icon" />
                    <span>LinkedIn Profile</span>
                  </a>
                )}
                
                {userDetails.githubId && (
                  <a 
                    href={`https://github.com/${userDetails.githubId}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="social-link github"
                  >
                    <FaGithub className="social-icon" />
                    <span>GitHub Profile</span>
                  </a>
                )}
              </Card.Body>
            </Card>
          )}
        </Col>
        
        <Col lg={8} md={7}>
          <Card className="profile-tabs-card">
            <Card.Header>
              <Nav variant="tabs" activeKey={activeTab} onSelect={setActiveTab}>
                <Nav.Item>
                  <Nav.Link eventKey="tasks">
                    <FaTasks className="tab-icon" /> Tasks
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="details">
                    <FaIdCard className="tab-icon" /> Details
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="documents">
                    <FaFileAlt className="tab-icon" /> Documents
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="history">
                    <FaHistory className="tab-icon" /> History
                  </Nav.Link>
                </Nav.Item>
              </Nav>
            </Card.Header>
            
            <Card.Body className="profile-tabs-content">
              <Tab.Content>
                <Tab.Pane active={activeTab === 'tasks'}>
                  {!loading && userDetails ? (
                    <UserTasks userId={userDetails._id} />
                  ) : (
                    <div className="text-center py-4">
                      <Spinner animation="border" variant="primary" />
                    </div>
                  )}
                </Tab.Pane>
                
                <Tab.Pane active={activeTab === 'details'}>
                  {!loading && userDetails ? (
                    <div className="user-details-section">
                      <h4 className="details-title">Personal Information</h4>
                      
                      <div className="details-grid">
                        <div className="detail-group">
                          <label>Full Name</label>
                          <p>{userDetails.name}</p>
                        </div>
                        
                        <div className="detail-group">
                          <label>Employee ID</label>
                          <p>{userDetails.employeeId || 'Not assigned'}</p>
                        </div>
                        
                        <div className="detail-group">
                          <label>Email</label>
                          <p>{userDetails.email}</p>
                        </div>
                        
                        <div className="detail-group">
                          <label>Phone</label>
                          <p>{userDetails.phone || 'Not provided'}</p>
                        </div>
                        
                        <div className="detail-group">
                          <label>Date of Birth</label>
                          <p>{userDetails.dateOfBirth ? new Date(userDetails.dateOfBirth).toLocaleDateString() : 'Not provided'}</p>
                        </div>
                        
                        <div className="detail-group">
                          <label>Address</label>
                          <p>{userDetails.address || 'Not provided'}</p>
                        </div>
                        
                        <div className="detail-group">
                          <label>Aadhar Number</label>
                          <p>{userDetails.aadhar || 'Not provided'}</p>
                        </div>
                        
                        <div className="detail-group">
                          <label>PAN Number</label>
                          <p>{userDetails.panNo || 'Not provided'}</p>
                        </div>
                      </div>
                      
                      <h4 className="details-title mt-4">Employment Information</h4>
                      
                      <div className="details-grid">
                        <div className="detail-group">
                          <label>Position</label>
                          <p>{userDetails.position || 'Not specified'}</p>
                        </div>
                        
                        <div className="detail-group">
                          <label>Department</label>
                          <p>{userDetails.department || 'Not specified'}</p>
                        </div>
                        
                        <div className="detail-group">
                          <label>Joining Date</label>
                          <p>{userDetails.joiningDate ? new Date(userDetails.joiningDate).toLocaleDateString() : 'Not specified'}</p>
                        </div>
                        
                        <div className="detail-group">
                          <label>Employee Type</label>
                          <p>{userDetails.isSuperUser ? 'Admin' : 'Regular Employee'}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Spinner animation="border" variant="primary" />
                    </div>
                  )}
                </Tab.Pane>
                
                <Tab.Pane active={activeTab === 'documents'}>
                  <div className="placeholder-content">
                    <FaFileAlt className="placeholder-icon" />
                    <h4>Documents</h4>
                    <p>No documents available at this time.</p>
                  </div>
                </Tab.Pane>
                
                <Tab.Pane active={activeTab === 'history'}>
                  <div className="placeholder-content">
                    <FaHistory className="placeholder-icon" />
                    <h4>Activity History</h4>
                    <p>No activity history available at this time.</p>
                  </div>
                </Tab.Pane>
              </Tab.Content>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default UserProfile; 
 