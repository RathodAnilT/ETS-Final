import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { FaArrowLeft, FaUsers, FaTasks, FaCalendarAlt, FaChartBar, FaCog, FaVideo } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import './SystemGuide.css';

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

const SystemGuide = () => {
  return (
    <div className="guide-wrapper">
      <Container>
        <div className="back-button-container">
          <Link to="/" className="back-button">
            <FaArrowLeft /> Back to Home
          </Link>
        </div>

        <div className="guide-header" data-aos="fade-up">
          <h1>System Guide</h1>
          <p>Learn how to use ETS features effectively</p>
        </div>

        <Row>
          <GuideSection
            icon={<FaUsers />}
            title="User Management"
            content="Manage user accounts and permissions"
            steps={[
              "Create new user accounts",
              "Set user roles and permissions",
              "Update user information",
              "Manage user access"
            ]}
            delay="100"
          />
          <GuideSection
            icon={<FaTasks />}
            title="Task Management"
            content="Create and manage tasks efficiently"
            steps={[
              "Create new tasks",
              "Assign tasks to team members",
              "Track task progress",
              "Set task priorities"
            ]}
            delay="200"
          />
          <GuideSection
            icon={<FaCalendarAlt />}
            title="Calendar & Scheduling"
            content="Manage schedules and appointments"
            steps={[
              "View team calendar",
              "Schedule meetings",
              "Set reminders",
              "Manage recurring events"
            ]}
            delay="300"
          />
          <GuideSection
            icon={<FaChartBar />}
            title="Reports & Analytics"
            content="Generate and analyze reports"
            steps={[
              "Create custom reports",
              "View analytics dashboard",
              "Export data",
              "Track key metrics"
            ]}
            delay="400"
          />
          <GuideSection
            icon={<FaCog />}
            title="System Settings"
            content="Configure system preferences"
            steps={[
              "Update system settings",
              "Manage notifications",
              "Configure integrations",
              "Set up workflows"
            ]}
            delay="500"
          />
          <GuideSection
            icon={<FaVideo />}
            title="Video Tutorials"
            content="Watch step-by-step tutorials"
            steps={[
              "Basic navigation",
              "Advanced features",
              "Best practices",
              "Troubleshooting"
            ]}
            delay="600"
          />
        </Row>
      </Container>
    </div>
  );
};

export default SystemGuide; 