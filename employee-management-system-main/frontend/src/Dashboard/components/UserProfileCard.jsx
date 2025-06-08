import React, { useRef } from 'react';
import { Card, Button, Spinner, Badge } from 'react-bootstrap';
import { FiCamera, FiMail, FiPhone, FiCalendar, FiBriefcase, FiMapPin, FiUser, FiHash } from 'react-icons/fi';
import './UserProfileCard.css';

const UserProfileCard = ({ user, loading, onPhotoUpload, photoUploading }) => {
  const fileInputRef = useRef(null);

  const handlePhotoClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onPhotoUpload(e.target.files[0]);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <Card className="profile-card">
        <div className="profile-card-loader">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading profile...</p>
        </div>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="profile-card">
        <Card.Body className="text-center">
          <p className="profile-error">User information not available</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="profile-card">
      <div className="profile-header">
        <div className="profile-cover"></div>
        <div className="profile-avatar-container">
          <div className="profile-avatar">
            {user.image ? (
              <img 
                src={user.image} 
                alt={user.name} 
                className="avatar-image"
              />
            ) : (
              <div className="avatar-initials">
                {getInitials(user.name)}
              </div>
            )}
          </div>
          <div className="photo-upload-button" onClick={handlePhotoClick}>
            {photoUploading ? (
              <Spinner animation="border" size="sm" variant="light" />
            ) : (
              <FiCamera />
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            style={{ display: 'none' }}
          />
        </div>
      </div>

      <Card.Body className="profile-body">
        <div className="profile-identity">
          <h3 className="profile-name">{user.name}</h3>
          <Badge className="employee-badge">{user.employeeId || "EMP-ID"}</Badge>
          <p className="profile-position">
            <FiBriefcase className="profile-icon" />
            {user.position || 'Position not set'}
            {user.department && <span> · {user.department}</span>}
          </p>
        </div>
        
        <div className="profile-details">
          <div className="detail-item">
            <FiMail className="detail-icon email" />
            <div className="detail-content">
              <div className="detail-label">Email</div>
              <div className="detail-value">{user.email}</div>
            </div>
          </div>
          
          {user.phone && (
            <div className="detail-item">
              <FiPhone className="detail-icon phone" />
              <div className="detail-content">
                <div className="detail-label">Phone</div>
                <div className="detail-value">{user.phone}</div>
              </div>
            </div>
          )}
          
          <div className="detail-item">
            <FiCalendar className="detail-icon calendar" />
            <div className="detail-content">
              <div className="detail-label">Joined</div>
              <div className="detail-value">{formatDate(user.joiningDate)}</div>
            </div>
          </div>
          
          {user.dateOfBirth && (
            <div className="detail-item">
              <FiUser className="detail-icon birthday" />
              <div className="detail-content">
                <div className="detail-label">Date of Birth</div>
                <div className="detail-value">{formatDate(user.dateOfBirth)}</div>
              </div>
            </div>
          )}
          
          {user.address && (
            <div className="detail-item">
              <FiMapPin className="detail-icon address" />
              <div className="detail-content">
                <div className="detail-label">Address</div>
                <div className="detail-value address-text">{user.address}</div>
              </div>
            </div>
          )}
        </div>
        
        <div className="profile-actions">
          <Button variant="outline-primary" className="edit-profile-btn">
            Edit Profile
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default UserProfileCard; 
 