import React from 'react';
import { 
  FaUserTie, 
  FaCalendarAlt, 
  FaChartLine, 
  FaFileAlt, 
  FaBell, 
  FaMobileAlt, 
  FaShieldAlt, 
  FaCogs 
} from 'react-icons/fa';
import './Services.css';

const Services = () => {
  return (
    <div className="services-container">
      <div className="services-header">
        <h1>Our Services</h1>
        <p>Comprehensive Employee Management Solutions</p>
      </div>

      <div className="services-content">
        <section className="services-section">
          <h2>Core Features</h2>
          <div className="services-grid">
            <div className="service-card">
              <FaUserTie className="service-icon" />
              <h3>Employee Management</h3>
              <p>Comprehensive employee profile management, including personal details, qualifications, and employment history.</p>
            </div>

            <div className="service-card">
              <FaCalendarAlt className="service-icon" />
              <h3>Leave Management</h3>
              <p>Streamlined leave request and approval system with automated notifications and calendar integration.</p>
            </div>

            <div className="service-card">
              <FaChartLine className="service-icon" />
              <h3>Performance Analytics</h3>
              <p>Advanced analytics and reporting tools to track employee performance and organizational metrics.</p>
            </div>

            <div className="service-card">
              <FaFileAlt className="service-icon" />
              <h3>Document Management</h3>
              <p>Secure storage and management of employee documents with version control and access tracking.</p>
            </div>

            <div className="service-card">
              <FaBell className="service-icon" />
              <h3>Notification System</h3>
              <p>Real-time notifications for important updates, approvals, and system alerts.</p>
            </div>

            <div className="service-card">
              <FaMobileAlt className="service-icon" />
              <h3>Mobile Access</h3>
              <p>Responsive design for seamless access across all devices, ensuring productivity on the go.</p>
            </div>

            <div className="service-card">
              <FaShieldAlt className="service-icon" />
              <h3>Security Features</h3>
              <p>Advanced security measures including role-based access control and data encryption.</p>
            </div>

            <div className="service-card">
              <FaCogs className="service-icon" />
              <h3>System Integration</h3>
              <p>Seamless integration with existing HR systems and third-party applications.</p>
            </div>
          </div>
        </section>

        <section className="services-section">
          <h2>Additional Benefits</h2>
          <div className="benefits-list">
            <ul>
              <li>Automated workflow processes for increased efficiency</li>
              <li>Customizable reporting and analytics dashboard</li>
              <li>Comprehensive audit trails for all system activities</li>
              <li>Regular system updates and maintenance</li>
              <li>24/7 technical support and assistance</li>
              <li>Data backup and recovery solutions</li>
              <li>User-friendly interface for easy navigation</li>
              <li>Scalable architecture to grow with your organization</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Services; 