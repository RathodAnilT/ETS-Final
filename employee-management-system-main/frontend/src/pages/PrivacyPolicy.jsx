import React from 'react';
import { 
  FaShieldAlt, 
  FaLock, 
  FaUserShield, 
  FaDatabase, 
  FaHistory, 
  FaSave, 
  FaEye, 
  FaCheckCircle 
} from 'react-icons/fa';
import './PrivacyPolicy.css';

const PrivacyPolicy = () => {
  return (
    <div className="privacy-policy-container">
      <div className="privacy-header">
        <h1>Privacy Policy</h1>
        <p>Last updated: {new Date().toLocaleDateString()}</p>
      </div>

      <div className="privacy-content">
        <section className="policy-section">
          <h2>Data Protection & Security</h2>
          <div className="policy-grid">
            <div className="policy-card">
              <FaShieldAlt className="policy-icon" />
              <h3>GDPR Compliance</h3>
              <p>Our system strictly adheres to GDPR regulations, ensuring the protection of personal data and privacy rights of all employees.</p>
            </div>

            <div className="policy-card">
              <FaLock className="policy-icon" />
              <h3>Data Encryption</h3>
              <p>All employee data is encrypted using industry-standard protocols, ensuring secure storage and transmission of sensitive information.</p>
            </div>

            <div className="policy-card">
              <FaUserShield className="policy-icon" />
              <h3>Access Control</h3>
              <p>Role-based access control system ensures that sensitive information is only accessible to authorized personnel.</p>
            </div>

            <div className="policy-card">
              <FaDatabase className="policy-icon" />
              <h3>Data Retention</h3>
              <p>Strict data retention policies are followed, with automatic deletion of outdated information as per regulatory requirements.</p>
            </div>

            <div className="policy-card">
              <FaHistory className="policy-icon" />
              <h3>Audit Trails</h3>
              <p>Comprehensive audit logs are maintained for all system activities, ensuring accountability and traceability.</p>
            </div>

            <div className="policy-card">
              <FaSave className="policy-icon" />
              <h3>Regular Backups</h3>
              <p>Automated backup systems ensure data integrity and availability, with regular testing of recovery procedures.</p>
            </div>

            <div className="policy-card">
              <FaEye className="policy-icon" />
              <h3>Monitoring</h3>
              <p>Continuous system monitoring and logging of all access attempts and activities for security purposes.</p>
            </div>

            <div className="policy-card">
              <FaCheckCircle className="policy-icon" />
              <h3>Compliance Standards</h3>
              <p>Regular compliance audits and updates to maintain alignment with industry security standards and best practices.</p>
            </div>
          </div>
        </section>

        <section className="policy-section">
          <h2>Important Notes</h2>
          <div className="important-notes">
            <ul>
              <li>All data processing activities are documented and regularly reviewed</li>
              <li>Employees have the right to access and correct their personal information</li>
              <li>Data breach notification procedures are in place</li>
              <li>Regular security training is provided to all staff</li>
              <li>Third-party vendors are vetted for security compliance</li>
              <li>System updates and patches are applied promptly</li>
              <li>Incident response procedures are regularly tested</li>
              <li>Privacy impact assessments are conducted for new features</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy; 