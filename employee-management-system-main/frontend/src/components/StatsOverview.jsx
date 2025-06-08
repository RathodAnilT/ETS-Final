import React, { useState, useEffect } from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import { FaUsers, FaTasks, FaCalendarCheck, FaClock } from 'react-icons/fa';
import axiosInstance from '../utils/axiosConfig';
import './StatsOverview.css';

const StatsOverview = () => {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeTasks: 0,
    completedTasks: 0,
    pendingLeaves: 0
  });

  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      // Fetch total employees from user routes
      const employeesRes = await axiosInstance.get('/api/users');
      const totalEmployees = employeesRes.data.user.length;

      // Fetch task statistics
      const tasksRes = await axiosInstance.get('/api/tasks/statistics');
      const { activeTasks, completedTasks } = tasksRes.data;

      // Fetch leave data
      const leavesRes = await axiosInstance.get('/api/leaves/leave-data');
      const pendingLeaves = leavesRes.data.filter(leave => leave.status === 'pending').length;

      setStats({
        totalEmployees,
        activeTasks,
        completedTasks,
        pendingLeaves
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchStats();

    // Set up polling to refresh stats every 30 seconds
    const intervalId = setInterval(fetchStats, 30000);

    // Listen for custom events
    const handleStatsUpdate = () => {
      fetchStats();
    };

    window.addEventListener('stats-updated', handleStatsUpdate);

    // Cleanup
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('stats-updated', handleStatsUpdate);
    };
  }, []);

  const statCards = [
    {
      title: 'Total Employees',
      value: stats.totalEmployees,
      icon: <FaUsers />,
      color: '#4CAF50',
      gradient: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)'
    },
    {
      title: 'Active Tasks',
      value: stats.activeTasks,
      icon: <FaTasks />,
      color: '#2196F3',
      gradient: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)'
    },
    {
      title: 'Completed Tasks',
      value: stats.completedTasks,
      icon: <FaCalendarCheck />,
      color: '#FF9800',
      gradient: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)'
    },
    {
      title: 'Pending Leaves',
      value: stats.pendingLeaves,
      icon: <FaClock />,
      color: '#9C27B0',
      gradient: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)'
    }
  ];

  if (loading) {
    return (
      <div className="stats-loading">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="stats-overview">
      <Row>
        {statCards.map((stat, index) => (
          <Col key={index} lg={3} md={6} className="mb-4">
            <Card className="stat-card">
              <Card.Body>
                <div className="stat-icon-wrapper" style={{ background: stat.gradient }}>
                  {stat.icon}
                </div>
                <h3 className="stat-value">{stat.value}</h3>
                <p className="stat-label">{stat.title}</p>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default StatsOverview; 