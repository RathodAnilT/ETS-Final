import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { FaArrowLeft, FaLaptopCode, FaUserTie, FaUsers, FaChartLine, FaTools, FaLanguage, FaGraduationCap } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import './TrainingPortal.css';

const CourseCard = ({ icon, title, description, progress, delay }) => (
  <Col lg={4} md={6} className="mb-4">
    <Card className="course-card" data-aos="fade-up" data-aos-delay={delay}>
      <Card.Body>
        <div className="course-icon">
          {icon}
        </div>
        <h3>{title}</h3>
        <p>{description}</p>
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <span className="progress-text">{progress}% Complete</span>
        </div>
      </Card.Body>
    </Card>
  </Col>
);

const TrainingPortal = () => {
  return (
    <div className="training-wrapper">
      <Container>
        <div className="back-button-container">
          <Link to="/" className="back-button">
            <FaArrowLeft /> Back to Home
          </Link>
        </div>

        <div className="training-header" data-aos="fade-up">
          <h1>Training Portal</h1>
          <p>Enhance your skills with our comprehensive training courses</p>
        </div>

        <Row>
          <CourseCard
            icon={<FaLaptopCode />}
            title="Technical Skills"
            description="Master essential technical tools and software"
            progress={75}
            delay="100"
          />
          <CourseCard
            icon={<FaUserTie />}
            title="Leadership Development"
            description="Build effective leadership and management skills"
            progress={60}
            delay="200"
          />
          <CourseCard
            icon={<FaUsers />}
            title="Team Collaboration"
            description="Learn effective team communication and collaboration"
            progress={85}
            delay="300"
          />
          <CourseCard
            icon={<FaChartLine />}
            title="Project Management"
            description="Master project planning and execution"
            progress={45}
            delay="400"
          />
          <CourseCard
            icon={<FaTools />}
            title="Professional Tools"
            description="Get familiar with industry-standard tools"
            progress={90}
            delay="500"
          />
          <CourseCard
            icon={<FaLanguage />}
            title="Communication Skills"
            description="Enhance your written and verbal communication"
            progress={70}
            delay="600"
          />
        </Row>
      </Container>
    </div>
  );
};

export default TrainingPortal; 