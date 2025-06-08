import React, { useContext, useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Spinner } from 'react-bootstrap';
import { FaUsers, FaTasks, FaCalendarAlt, FaChartLine, FaBuilding, FaUserTie, FaBell, FaClock, FaArrowRight, FaChartBar, FaUserFriends, FaSmile, FaPlay, FaPause, FaNewspaper, FaCalendarCheck, FaBook, FaCloudSun, FaBullhorn, FaTrophy, FaFileAlt, FaQuestionCircle, FaCog } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import axios from 'axios';
import userContext from '../context/userContext';
import StatsOverview from '../components/StatsOverview';
import './Home.css';

const VideoCard = ({ videoSrc, title }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    
    const handleVideoEnd = () => {
      video.currentTime = 0;
      video.play().catch(error => {
        console.log("Video play error:", error);
      });
    };

    const handleVideoError = (error) => {
      console.log("Video error:", error);
    };

    video.addEventListener('ended', handleVideoEnd);
    video.addEventListener('error', handleVideoError);
    
    // Start playing when component mounts
    video.play().catch(error => {
      console.log("Initial video play error:", error);
    });
    
    return () => {
      video.removeEventListener('ended', handleVideoEnd);
      video.removeEventListener('error', handleVideoError);
    };
  }, []);

  return (
    <div className="video-card">
      <video
        ref={videoRef}
        className="card-video"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      >
        <source src={videoSrc} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <div className="video-overlay">
        <h3>{title}</h3>
      </div>
    </div>
  );
};

const SectionHeading = ({ title, subtitle }) => (
  <div className="section-heading">
    <h2>{title}</h2>
    {subtitle && <p>{subtitle}</p>}
  </div>
);

const NewsTicker = () => {
  const news = [
    'New office location opening next month',
    'Industry conference registration now open',
    'Latest technology trends in employee management',
    'Company recognized for workplace excellence'
  ];

  return (
    <div className="news-ticker">
      <div className="ticker-container">
        <FaNewspaper className="ticker-icon" />
        <div className="ticker-content">
          {news.map((item, index) => (
            <span key={index} className="ticker-item">{item}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

const VideoSection = () => {
  const videos = [
    {
      src: require('../assets/videos/Video1.mp4'),
      title: "Employee Management"
    },
    {
      src: require('../assets/videos/Video2.mp4'),
      title: "Task Tracking"
    },
    {
      src: require('../assets/videos/Video3.mp4'),
      title: "Team Collaboration"
    },
    {
      src: require('../assets/videos/Video4.mp4'),
      title: "Performance Analytics"
    }
  ];

  return (
    <div className="video-section">
      <Container>
        <SectionHeading 
          title="Featured Videos" 
          subtitle="Watch our latest updates and features in action"
        />
        <Row className="video-grid">
          {videos.map((video, index) => (
            <Col key={index} lg={3} md={6} className="mb-4">
              <VideoCard videoSrc={video.src} title={video.title} />
            </Col>
          ))}
        </Row>
      </Container>
    </div>
  );
};

const ResourceCenter = () => {
  const resources = [
    { 
      title: 'Employee Handbook', 
      icon: <FaBook />, 
      link: '/employee-handbook',
      description: 'Comprehensive guide to company policies and procedures',
      gradient: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)'
    },
    { 
      title: 'Training Portal', 
      icon: <FaUserTie />, 
      link: '/training-portal',
      description: 'Access professional development courses and materials',
      gradient: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)'
    },
    { 
      title: 'System Guide', 
      icon: <FaFileAlt />, 
      link: '/system-guide',
      description: 'Learn how to use ETS features effectively',
      gradient: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)'
    },
    { 
      title: 'FAQ', 
      icon: <FaQuestionCircle />, 
      link: '/about#faq',
      description: 'Find answers to frequently asked questions',
      gradient: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)'
    }
  ];

  return (
    <div className="resource-center">
      <SectionHeading 
        title="Resource Center" 
        subtitle="Access helpful materials and guides"
      />
      <Row>
        {resources.map((resource, index) => (
          <Col key={index} lg={3} md={6} className="mb-4">
            <Link to={resource.link} className="resource-card">
              <Card>
                <Card.Body>
                  <div className="resource-icon" style={{ background: resource.gradient }}>
                    {resource.icon}
                  </div>
                  <h3>{resource.title}</h3>
                  <p>{resource.description}</p>
                  <div className="resource-arrow">
                    <FaArrowRight />
                  </div>
                </Card.Body>
              </Card>
            </Link>
          </Col>
        ))}
      </Row>
    </div>
  );
};

const Home = () => {
  const authUser = useContext(userContext);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [metrics, setMetrics] = useState({
    clients: 0,
    employees: 0,
    satisfaction: 0
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const animateMetrics = () => {
      const duration = 2000;
      const steps = 60;
      const stepDuration = duration / steps;
      let currentStep = 0;

      const interval = setInterval(() => {
        currentStep++;
        const progress = currentStep / steps;

        setMetrics({
          clients: Math.floor(500 * progress),
          employees: Math.floor(50000 * progress),
          satisfaction: Math.floor(98 * progress)
        });

        if (currentStep >= steps) {
          clearInterval(interval);
        }
      }, stepDuration);
    };

    animateMetrics();
  }, []);

  const formatTime = () => {
    const options = { 
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true 
    };
    return currentTime.toLocaleTimeString('en-US', options);
  };

  const metricCards = [
    {
      title: 'Active Clients',
      value: metrics.clients,
      suffix: '+',
      increase: '12%',
      icon: <FaChartBar />,
      color: '#4CAF50',
      gradient: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)'
    },
    {
      title: 'Employees Managed',
      value: metrics.employees,
      suffix: '+',
      increase: '8%',
      icon: <FaUserFriends />,
      color: '#2196F3',
      gradient: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)'
    },
    {
      title: 'Client Satisfaction',
      value: metrics.satisfaction,
      suffix: '%',
      increase: '3%',
      icon: <FaSmile />,
      color: '#FF9800',
      gradient: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)'
    }
  ];

  const quickLinks = [
    {
      title: 'Dashboard',
      icon: <FaChartLine />,
      link: '/dashboard',
      description: 'View your personalized dashboard with key metrics and updates',
      color: '#4CAF50',
      gradient: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)'
    },
    {
      title: 'Employee Directory',
      icon: <FaUsers />,
      link: '/admin',
      description: 'Browse through the complete employee directory',
      color: '#2196F3',
      gradient: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)'
    },
    {
      title: 'Task Management',
      icon: <FaTasks />,
      link: '/task-management',
      description: 'Manage and track your tasks and assignments',
      color: '#FF9800',
      gradient: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)'
    },
    {
      title: 'Leave Management',
      icon: <FaCalendarAlt />,
      link: '/leave-page',
      description: 'Apply for leave and view leave status',
      color: '#9C27B0',
      gradient: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)'
    }
  ];

  return (
    <div className="home-wrapper">
      <div className="welcome-section">
        <div className="welcome-content">
          <div className="welcome-header">
            <h1>Employee Traceability System</h1>
            <div className="welcome-subtitle">
              <span className="subtitle-line"></span>
              <p>Enterprise Management Solution</p>
              <span className="subtitle-line"></span>
            </div>
          </div>
          <p className="welcome-message">
            Enhance workforce visibility and accountability with our comprehensive traceability platform
          </p>
          <div className="welcome-features">
            <div className="feature-item">
              <FaUsers className="feature-icon" />
              <span>Employee Traceability</span>
            </div>
            <div className="feature-item">
              <FaTasks className="feature-icon" />
              <span>Activity Monitoring</span>
            </div>
            <div className="feature-item">
              <FaChartLine className="feature-icon" />
              <span>Performance Analytics</span>
            </div>
          </div>
          <div className="current-time">
            <FaClock className="time-icon" />
            <span className="time-text">{formatTime()}</span>
          </div>
        </div>
        <div className="welcome-overlay"></div>
        <div className="welcome-shape"></div>
      </div>

      <NewsTicker />

      <VideoSection />

      <Container fluid className="main-content">
        <Container>
          <SectionHeading 
            title="Key Metrics" 
            subtitle="Real-time statistics and performance indicators"
          />
          <Row className="metrics-section justify-content-center">
            {metricCards.map((metric, index) => (
              <Col key={index} lg={4} md={6} className="mb-4">
                <Card className="metric-card">
                  <Card.Body>
                    <div className="metric-icon" style={{ background: metric.gradient }}>
                      {metric.icon}
                    </div>
                    <div className="metric-info">
                      <h3>
                        {metric.value.toLocaleString()}
                        <span className="metric-suffix">{metric.suffix}</span>
                      </h3>
                      <p>{metric.title}</p>
                      <div className="metric-increase">
                        <span className="increase-value">{metric.increase}</span>
                        <span className="increase-text">increase</span>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
          
          <ResourceCenter />

          <SectionHeading 
            title="Quick Access" 
            subtitle="Navigate to essential features and tools"
          />
          <Row className="quick-links-section justify-content-center">
            {quickLinks.map((link, index) => (
              <Col key={index} lg={3} md={6} className="mb-4">
                <Link to={link.link} className="quick-link-card">
                  <Card className="h-100">
                    <Card.Body>
                      <div className="quick-link-icon" style={{ background: link.gradient }}>
                        {link.icon}
                      </div>
                      <h3>{link.title}</h3>
                      <p>{link.description}</p>
                      <div className="quick-link-arrow">
                        <FaArrowRight />
                      </div>
                    </Card.Body>
                  </Card>
                </Link>
              </Col>
            ))}
          </Row>

          <SectionHeading 
            title="About ETS" 
            subtitle="Learn more about our platform and features"
          />
          <Row className="info-section justify-content-center">
            <Col lg={6} md={12} className="mb-4">
              <Card className="info-card">
                <Card.Body>
                  <div className="info-card-header">
                    <div className="info-card-icon" style={{ background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)' }}>
                      <FaBuilding />
                    </div>
                    <h3>About ETS</h3>
                  </div>
                  <p>
                    ETS (Employee Tracking System) is a comprehensive platform designed to streamline
                    employee management, task tracking, and team collaboration. Our system helps
                    organizations maintain efficiency and transparency in their operations.
                  </p>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={6} md={12} className="mb-4">
              <Card className="info-card">
                <Card.Body>
                  <div className="info-card-header">
                    <div className="info-card-icon" style={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)' }}>
                      <FaUserTie />
                    </div>
                    <h3>Your Profile</h3>
                  </div>
                  <p>
                    Manage your personal information, view your tasks, and track your progress.
                    Keep your profile updated to ensure smooth communication and task management.
                  </p>
                  <Link to={`/user-profile/${authUser.userId}`} className="btn btn-primary profile-btn">
                    View Profile
                  </Link>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </Container>
    </div>
  );
};

export default Home; 