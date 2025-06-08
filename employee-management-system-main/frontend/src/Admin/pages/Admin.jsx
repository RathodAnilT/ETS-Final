import React, { useContext, useEffect, useState } from "react";
import { Container, Row, Col, Card, Spinner, Badge, Button, Tabs, Tab } from "react-bootstrap";
import { FaUsers, FaTasks, FaCalendarAlt, FaUserTie, FaChartLine, FaBuilding, FaUserPlus, FaEdit, FaEye, FaArrowLeft, FaUserShield, FaUserCog, FaExchangeAlt } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import userContext from "../../context/userContext";
import LaborSharing from "../components/LaborSharing";
import "./Admin.css";

const Admin = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeTasks: 0,
    pendingLeaves: 0,
    onLeave: 0,
    departments: {}
  });
  const authUser = useContext(userContext);

  useEffect(() => {
    const fetchData = async () => {
      if (!authUser.isLoggedIn || !authUser.isSuperUser) return;

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
          setEmployees(employeeData);
          
          // Calculate statistics
          const totalEmployees = employeeData.length;
          const activeTasks = employeeData.reduce((acc, emp) => acc + (emp.tasks?.length || 0), 0);
          const pendingLeaves = calculatePendingLeaves(employeeData);
          const onLeave = calculateOnLeave(employeeData);
          const departments = calculateDepartmentStats(employeeData);

          setStats({
            totalEmployees,
            activeTasks,
            pendingLeaves,
            onLeave,
            departments
          });
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authUser.isLoggedIn, authUser.isSuperUser, authUser.token]);

  const calculatePendingLeaves = (employees) => {
    let pendingCount = 0;
    employees.forEach(emp => {
      if (emp.leaveDate && Array.isArray(emp.leaveDate)) {
        pendingCount += emp.leaveDate.filter(leave => leave.status === 'pending').length;
      }
    });
    return pendingCount;
  };

  const calculateOnLeave = (employees) => {
    let onLeaveCount = 0;
    employees.forEach(emp => {
      if (emp.leaveDate && Array.isArray(emp.leaveDate)) {
        onLeaveCount += emp.leaveDate.filter(leave => leave.status === 'approved' && 
          new Date(leave.startDate) <= new Date() && 
          new Date(leave.endDate) >= new Date()
        ).length;
      }
    });
    return onLeaveCount;
  };

  const calculateDepartmentStats = (employees) => {
    const departments = {};
    employees.forEach(emp => {
      if (emp.department) {
        departments[emp.department] = (departments[emp.department] || 0) + 1;
      }
    });
    return departments;
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const renderEmployeeCard = (employee) => (
    <Card key={employee._id} className="employee-card">
      <Card.Body>
        <div className="employee-avatar">
          {employee.image ? (
            <img src={employee.image} alt={employee.name} />
          ) : (
            <div className="avatar-placeholder">{employee.name.charAt(0)}</div>
          )}
        </div>
        <div className="employee-info">
          <h5>{employee.name}</h5>
          <p className="employee-position">{employee.position}</p>
          <p className="employee-department">{employee.department}</p>
          <div className="employee-actions">
            <Link to={`/user-profile/${employee._id}`} className="btn btn-sm btn-outline-primary me-2">
              <FaEye className="me-1" /> View
            </Link>
            <Link to={`/edit-employee/${employee._id}`} className="btn btn-sm btn-outline-secondary">
              <FaEdit className="me-1" /> Edit
            </Link>
          </div>
        </div>
      </Card.Body>
    </Card>
  );

  const renderSection = (title, icon, employees, badgeColor) => (
    <div className="employee-section">
      <div className="section-header">
        <h3>
          {icon} {title}
          <Badge bg={badgeColor} className="ms-2">{employees.length}</Badge>
        </h3>
      </div>
      <Row>
        {employees.map(emp => (
          <Col key={emp._id} xs={12} sm={6} md={4} lg={3} className="mb-4">
            {renderEmployeeCard(emp)}
          </Col>
        ))}
        {employees.length === 0 && (
          <Col>
            <div className="no-employees">
              <p>No {title.toLowerCase()} found</p>
            </div>
          </Col>
        )}
      </Row>
    </div>
  );

  const renderEmployeeDirectory = () => {
    // Filter employees by role
    const admins = employees.filter(emp => emp.isSuperUser);
    const managers = employees.filter(emp => emp.position?.toLowerCase().includes('manager'));
    const supervisors = employees.filter(emp => emp.position?.toLowerCase().includes('supervisor'));
    const otherEmployees = employees.filter(emp => 
      !emp.isSuperUser && 
      !emp.position?.toLowerCase().includes('manager') && 
      !emp.position?.toLowerCase().includes('supervisor')
    );

    return (
      <div className="employee-directory">
        <div className="directory-header mb-4">
          <Link to="/signup">
            <Button variant="primary" className="add-employee-btn">
              <FaUserPlus className="me-2" /> Add New Employee
            </Button>
          </Link>
        </div>
        
        <div className="employee-sections">
          {renderSection('Administrators', <FaUserShield />, admins, 'danger')}
          {renderSection('Managers', <FaUserTie />, managers, 'primary')}
          {renderSection('Supervisors', <FaUserCog />, supervisors, 'info')}
          {renderSection('Employees', <FaUserTie />, otherEmployees, 'success')}
        </div>
      </div>
    );
  };

  const renderOverview = () => (
    <>
      <Row className="stats-row">
        <Col md={3} sm={6} className="mb-4">
          <Card className="stat-card">
            <Card.Body>
              <div className="stat-icon-wrapper total">
                <FaUsers className="stat-icon" />
              </div>
              <h3 className="stat-value">{stats.totalEmployees}</h3>
              <p className="stat-label">Total Employees</p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3} sm={6} className="mb-4">
          <Card className="stat-card">
            <Card.Body>
              <div className="stat-icon-wrapper tasks">
                <FaTasks className="stat-icon" />
              </div>
              <h3 className="stat-value">{stats.activeTasks}</h3>
              <p className="stat-label">Active Tasks</p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3} sm={6} className="mb-4">
          <Card className="stat-card">
            <Card.Body>
              <div className="stat-icon-wrapper pending">
                <FaCalendarAlt className="stat-icon" />
              </div>
              <h3 className="stat-value">{stats.pendingLeaves}</h3>
              <p className="stat-label">Pending Leaves</p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3} sm={6} className="mb-4">
          <Card className="stat-card">
            <Card.Body>
              <div className="stat-icon-wrapper leave">
                <FaUserTie className="stat-icon" />
              </div>
              <h3 className="stat-value">{stats.onLeave}</h3>
              <p className="stat-label">Employees on Leave</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col md={6} className="mb-4">
          <Card className="department-card">
            <Card.Header>
              <h4 className="mb-0">
                <FaBuilding className="me-2" /> Department Distribution
              </h4>
            </Card.Header>
            <Card.Body>
              {Object.entries(stats.departments).map(([dept, count]) => (
                <div key={dept} className="department-item">
                  <span className="department-name">{dept}</span>
                  <Badge bg="primary" pill>{count}</Badge>
                          </div>
              ))}
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6} className="mb-4">
          <Card className="quick-actions-card">
            <Card.Header>
              <h4 className="mb-0">
                <FaChartLine className="me-2" /> Quick Actions
              </h4>
            </Card.Header>
            <Card.Body>
              <div className="quick-actions">
                <Link to="/signup" className="action-button">
                  <FaUserPlus className="me-2" /> Add Employee
                </Link>
                <Link to="/task-management" className="action-button">
                  <FaTasks className="me-2" /> Manage Tasks
                </Link>
                <Link to="/leave-page" className="action-button">
                  <FaCalendarAlt className="me-2" /> View Leaves
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );

  if (!authUser.isLoggedIn || !authUser.isSuperUser) {
    return (
      <Container className="admin-container">
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>You do not have permission to view this page.</p>
          <Button variant="primary" onClick={handleGoBack} className="go-back-btn">
            <FaArrowLeft /> Go Back
          </Button>
        </div>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container className="admin-container">
        <div className="loading-spinner">
          <Spinner animation="border" variant="primary" />
          <p>Loading admin dashboard...</p>
          <Button variant="primary" onClick={handleGoBack} className="go-back-btn">
            <FaArrowLeft /> Go Back
          </Button>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="admin-container">
        <div className="error-message">
          <h2>Error</h2>
          <p>{error}</p>
          <Button variant="primary" onClick={handleGoBack} className="go-back-btn">
            <FaArrowLeft /> Go Back
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="admin-container">
      <div className="admin-header">
        <Button variant="link" className="back-button" onClick={handleGoBack}>
          <FaArrowLeft /> Back
        </Button>
        <h2>Admin Dashboard</h2>
      </div>

      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="admin-tabs mb-4"
      >
        <Tab eventKey="overview" title="Overview">
          {renderOverview()}
        </Tab>
        <Tab eventKey="employees" title="Employee Directory">
          {renderEmployeeDirectory()}
        </Tab>
        <Tab eventKey="labor-sharing" title="Labor Sharing">
          <LaborSharing employees={employees} />
        </Tab>
      </Tabs>
    </Container>
  );
};

export default Admin; 