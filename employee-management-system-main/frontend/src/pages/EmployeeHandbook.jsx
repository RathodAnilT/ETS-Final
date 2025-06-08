import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { FaArrowLeft, FaBook, FaUserTie, FaBuilding, FaFileAlt, FaCalendarAlt, FaChartLine } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import './EmployeeHandbook.css';

const GuideSection = ({ icon, title, content, steps, delay }) => (
  <Col lg={6} md={12} className="mb-4">
    <Card className="guide-card" data-aos="fade-up" data-aos-delay={delay}>
      <Card.Body>
        <div className="guide-icon">
          {icon}
        </div>
        <h3>{title}</h3>
        <p>{content}</p>
        {steps && (
          <div className="guide-steps">
            {steps.map((step, index) => (
              <div key={index} className="step">
                <span className="step-number">{index + 1}</span>
                <p>{step}</p>
              </div>
            ))}
          </div>
        )}
      </Card.Body>
    </Card>
  </Col>
);

const EmployeeHandbook = () => {
  return (
    <div className="handbook-wrapper">
      <Container>
        <div className="back-button-container">
          <Link to="/" className="back-button">
            <FaArrowLeft /> Back to Home
          </Link>
        </div>
        
        <div className="handbook-header" data-aos="fade-up">
          <h1>Employee Handbook</h1>
          <p>Your comprehensive guide to company policies and procedures</p>
        </div>

        <Row>
          <GuideSection
            icon={<FaUserTie />}
            title="Employee Policies"
            content="Essential guidelines and policies for all employees"
            steps={[
              "Review the code of conduct",
              "Understand attendance policies",
              "Familiarize with dress code",
              "Learn about workplace ethics"
            ]}
            delay="100"
          />
          <GuideSection
            icon={<FaBuilding />}
            title="Company Overview"
            content="Learn about our organization's structure and values"
            steps={[
              "Company mission and vision",
              "Organizational structure",
              "Department overview",
              "Company culture"
            ]}
            delay="200"
          />
          <GuideSection
            icon={<FaFileAlt />}
            title="Documentation"
            content="Important forms and documentation procedures"
            steps={[
              "Required documentation",
              "Form submission process",
              "Document retention policy",
              "Confidentiality guidelines"
            ]}
            delay="300"
          />
          <GuideSection
            icon={<FaCalendarAlt />}
            title="Leave Policies"
            content="Guidelines for time off and leave management"
            steps={[
              "Types of leave available",
              "Leave application process",
              "Holiday calendar",
              "Emergency leave procedures"
            ]}
            delay="400"
          />
          <GuideSection
            icon={<FaChartLine />}
            title="Performance Management"
            content="Understanding performance evaluation and growth"
            steps={[
              "Performance review process",
              "Goal setting guidelines",
              "Career development",
              "Recognition programs"
            ]}
            delay="500"
          />
          <GuideSection
            icon={<FaBook />}
            title="Training & Development"
            content="Resources for professional growth and learning"
            steps={[
              "Training programs",
              "Skill development",
              "Certification support",
              "Learning resources"
            ]}
            delay="600"
          />
        </Row>
      </Container>
    </div>
  );
};

export default EmployeeHandbook; 