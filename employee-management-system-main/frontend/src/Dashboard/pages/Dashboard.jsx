import React, { useContext, useEffect, useState } from "react";
import { Button, Row, Col, Container, Spinner, Card } from "react-bootstrap";
import { Link } from "react-router-dom";
import { FaUserPlus, FaChartLine, FaUsers, FaClipboardList, FaTasks, FaBell } from "react-icons/fa";
import axios from "axios";
import userContext from "../../context/userContext";
import CardUI from "../../UI/CardUI";
import LeaveUI from "../../UI/LeaveUI";
import WelcomeUI from "../../UI/WelcomeUI";
import UserTasks from "../components/UserTasks";
import { requestNotificationPermission } from "../../utils/notifications";
import "./Dashboard.css";

const Dashboard = () => {
  const [employee, setEmployee] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingTaskApprovals, setPendingTaskApprovals] = useState([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    pendingLeaves: 0,
    activeTasks: 0,
    pendingApprovals: 0
  });
  const authUser = useContext(userContext);

  useEffect(() => {
    const checkNotificationPermission = async () => {
      const permissionGranted = await requestNotificationPermission();
      setNotificationsEnabled(permissionGranted);
    };
    
    checkNotificationPermission();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!authUser.isLoggedIn) return;

      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/users/`, {
          headers: {
            'Authorization': `Bearer ${authUser.token}`
          }
        });

        if (response.data && response.data.user) {
          const employeeData = response.data.user;
          setEmployee(employeeData);
          
          // Calculate statistics
          const totalEmployees = employeeData.length;
          const pendingLeaves = calculatePendingLeaves(employeeData);
          const activeTasks = employeeData.reduce((acc, emp) => acc + (emp.tasks?.length || 0), 0);
          
          setStats({
            totalEmployees,
            pendingLeaves,
            activeTasks,
            pendingApprovals: pendingTaskApprovals.length
          });
        }
      } catch (error) {
        console.error("Error fetching employees:", error);
        setError("Failed to load employee data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authUser.isLoggedIn, authUser.token, pendingTaskApprovals]);

  const calculatePendingLeaves = (employees) => {
    let pendingCount = 0;
    employees.forEach(emp => {
      if (emp.leaveDate && Array.isArray(emp.leaveDate)) {
        pendingCount += emp.leaveDate.filter(leave => leave.status === 'pending').length;
      }
    });
    return pendingCount;
  };

  const handleEnableNotifications = async () => {
    const permissionGranted = await requestNotificationPermission();
    setNotificationsEnabled(permissionGranted);
  };

  if (!authUser.isLoggedIn) {
    return null;
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading dashboard...</p>
        </div>
      );
    }
    
    return (
    <Container fluid className="dashboard-container">
      <div className="dashboard-header">
        <div className="dashboard-actions">
        {authUser.isSuperUser && (
          <Link to="/signup">
            <Button variant="primary" className="add-employee-btn">
              <FaUserPlus className="btn-icon" /> Add Employee
            </Button>
          </Link>
        )}
          <Link to="/analytics">
            <Button variant="info" className="analytics-btn ms-2">
              <FaChartLine className="btn-icon" /> Analytics
            </Button>
          </Link>
        </div>
      </div>

      <Row className="mt-4">
        <Col lg={authUser.isSuperUser ? 8 : 12} md={authUser.isSuperUser ? 7 : 12} className="mb-4">
          <div className="welcome-card">
            <WelcomeUI employee={authUser.currentUser} />
            
            {!notificationsEnabled && (
              <div className="notification-permission-card mt-3">
                <div className="d-flex align-items-center">
                  <FaBell className="notification-icon" />
                  <div className="notification-text">
                    <h5>Enable Notifications</h5>
                    <p>Get notified when tasks need your attention</p>
                  </div>
                  <Button 
                    variant="outline-primary" 
                    size="sm" 
                    onClick={handleEnableNotifications}
                  >
                    Enable
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Col>
        
        {authUser.isSuperUser && (
          <Col lg={4} md={5} className="mb-4">
            <div className="leave-card">
              <h4 className="section-title"><FaClipboardList className="section-icon" /> Leave Requests</h4>
              <LeaveUI employee={employee || []} superuser={authUser.isSuperUser} />
            </div>
          </Col>
        )}
      </Row>

      <Row className="stats-row">
        {authUser.isSuperUser && (
          <>
            <Col md={3} sm={6} className="mb-4">
              <div className="stat-card">
                <div className="stat-icon-wrapper employees">
                  <FaUsers className="stat-icon" />
                </div>
                <div className="stat-content">
                  <h3 className="stat-value">{stats.totalEmployees}</h3>
                  <p className="stat-label">Total Employees</p>
                </div>
              </div>
            </Col>
            
            <Col md={3} sm={6} className="mb-4">
              <div className="stat-card">
                <div className="stat-icon-wrapper leaves">
                  <FaClipboardList className="stat-icon" />
                </div>
                <div className="stat-content">
                  <h3 className="stat-value">{stats.pendingLeaves}</h3>
                  <p className="stat-label">Pending Leaves</p>
                </div>
              </div>
            </Col>
          </>
        )}
        
        <Col md={authUser.isSuperUser ? 3 : 6} sm={6} className="mb-4">
          <div className="stat-card">
            <div className="stat-icon-wrapper tasks">
              <FaTasks className="stat-icon" />
            </div>
            <div className="stat-content">
              <h3 className="stat-value">{stats.activeTasks}</h3>
              <p className="stat-label">Active Tasks</p>
            </div>
          </div>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col lg={12}>
          <div className="tasks-card">
            <h4 className="section-title"><FaTasks className="section-icon" /> Your Tasks</h4>
            <UserTasks />
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;
