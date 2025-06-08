import React, { useState, useEffect } from 'react';
import { Typography, Row, Col, Card, Space, Divider, Statistic, Collapse } from 'antd';
import { TeamOutlined, GlobalOutlined, TrophyOutlined, HeartOutlined, ArrowUpOutlined } from '@ant-design/icons';
import CountUp from 'react-countup';
import './About.css';
import teamPhoto from './images/team_photo.png';

const { Title, Paragraph } = Typography;
const { Panel } = Collapse;

const About = () => {
  const [stats, setStats] = useState({
    clients: 0,
    employees: 0,
    satisfaction: 0
  });

  useEffect(() => {
    // Simulate loading stats with animation
    const timer = setTimeout(() => {
      setStats({
        clients: 500,
        employees: 50000,
        satisfaction: 98
      });
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="about-container">
      <div className="about-hero">
        <div className="hero-content">
          <Title level={1} className="hero-title">About Our Company</Title>
          <Paragraph className="about-subtitle">
            Empowering organizations through innovative employee management solutions
          </Paragraph>
        </div>
      </div>

      {/* Team Photo Section */}
      <div className="team-photo-section">
        <Title level={2} className="section-title">Meet Our Team</Title>
        <div className="team-photo-container">
          <Card className="team-photo-card">
            <div className="team-photo-wrapper">
              <img 
                src={teamPhoto}
                alt="Our Team" 
                className="team-photo"
              />
            </div>
            <div className="team-photo-overlay">
              <Title level={3}>Computer Engineering Class of 2025</Title>
              <Paragraph>
                A team of passionate final year computer engineering students dedicated to creating innovative solutions
                for modern workplace challenges. We combine academic excellence with practical development skills
                to deliver cutting-edge employee management solutions.
              </Paragraph>
            </div>
          </Card>
        </div>
      </div>

      <Row gutter={[32, 32]} className="about-content">
        <Col xs={24} md={12}>
          <Card className="about-card mission-card">
            <div className="card-icon">
              <TrophyOutlined />
            </div>
            <Title level={2}>Our Mission</Title>
            <Paragraph>
              We are dedicated to transforming the way organizations manage their workforce by providing
              cutting-edge solutions that streamline HR processes, enhance employee engagement, and drive
              organizational success.
            </Paragraph>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card className="about-card vision-card">
            <div className="card-icon">
              <GlobalOutlined />
            </div>
            <Title level={2}>Our Vision</Title>
            <Paragraph>
              To be the global leader in employee management solutions, empowering organizations to build
              stronger, more efficient, and more engaged workforces through innovative technology and
              exceptional service.
            </Paragraph>
          </Card>
        </Col>
      </Row>

      <Divider className="section-divider" />

      <div className="about-features">
        <Title level={2} className="section-title">Why Choose Us</Title>
        <Row gutter={[32, 32]} className="feature-cards">
          <Col xs={24} sm={12} md={6}>
            <Card className="feature-card team-card">
              <TeamOutlined className="feature-icon" />
              <Title level={4}>Expert Team</Title>
              <Paragraph>
                Our team of HR and technology experts brings decades of combined experience.
              </Paragraph>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Card className="feature-card global-card">
              <GlobalOutlined className="feature-icon" />
              <Title level={4}>Global Reach</Title>
              <Paragraph>
                Serving organizations worldwide with localized solutions and support.
              </Paragraph>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Card className="feature-card innovation-card">
              <TrophyOutlined className="feature-icon" />
              <Title level={4}>Innovation</Title>
              <Paragraph>
                Continuously evolving our platform with cutting-edge features and technology.
              </Paragraph>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Card className="feature-card customer-card">
              <HeartOutlined className="feature-icon" />
              <Title level={4}>Customer Focus</Title>
              <Paragraph>
                Dedicated to providing exceptional service and support to our clients.
              </Paragraph>
            </Card>
          </Col>
        </Row>
      </div>

      <div className="about-stats">
        <Row gutter={[32, 32]}>
          <Col xs={24} sm={8}>
            <Card className="stat-card clients-card">
              <Statistic
                title="Active Clients"
                value={stats.clients}
                suffix="+"
                valueStyle={{ color: '#1890ff' }}
                prefix={<TeamOutlined />}
                formatter={(value) => <CountUp end={value} duration={2.5} />}
              />
              <div className="stat-trend">
                <ArrowUpOutlined /> 12% increase
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card className="stat-card employees-card">
              <Statistic
                title="Employees Managed"
                value={stats.employees}
                suffix="+"
                valueStyle={{ color: '#52c41a' }}
                prefix={<TeamOutlined />}
                formatter={(value) => <CountUp end={value} duration={2.5} />}
              />
              <div className="stat-trend">
                <ArrowUpOutlined /> 8% increase
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card className="stat-card satisfaction-card">
              <Statistic
                title="Client Satisfaction"
                value={stats.satisfaction}
                suffix="%"
                valueStyle={{ color: '#722ed1' }}
                prefix={<HeartOutlined />}
                formatter={(value) => <CountUp end={value} duration={2.5} />}
              />
              <div className="stat-trend">
                <ArrowUpOutlined /> 3% increase
              </div>
            </Card>
          </Col>
        </Row>
      </div>

      {/* FAQ Section */}
      <div className="faq-section">
        <Title level={2} className="section-title">Frequently Asked Questions</Title>
        <div className="faq-container">
          <Collapse accordion className="faq-collapse">
            <Panel header="What is ETS?" key="1">
              <Paragraph>ETS is an Employee Tracking System designed to streamline employee management, task tracking, and team collaboration.</Paragraph>
            </Panel>
            <Panel header="How can I request leave?" key="2">
              <Paragraph>You can request leave through the Leave Management section in your dashboard.</Paragraph>
            </Panel>
            <Panel header="Where can I find the employee handbook?" key="3">
              <Paragraph>The Employee Handbook is available in the Resource Center on the Home page.</Paragraph>
            </Panel>
            <Panel header="How do I submit a task completion for review?" key="4">
              <Paragraph>You can submit completed tasks for review through the Task Management section, typically by marking a task as complete and providing necessary details.</Paragraph>
            </Panel>
            <Panel header="Can I update my profile information?" key="5">
              <Paragraph>Yes, you can update your personal and professional information in the User Profile section.</Paragraph>
            </Panel>
            <Panel header="How are system notifications handled?" key="6">
              <Paragraph>Notifications are delivered through the in-app Notification Center and can be configured in your user settings.</Paragraph>
            </Panel>
          </Collapse>
        </div>
      </div>

    </div>
  );
};

export default About; 