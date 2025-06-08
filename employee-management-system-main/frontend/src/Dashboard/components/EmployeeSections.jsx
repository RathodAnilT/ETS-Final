import React from 'react';
import { Card, Row, Col, Badge } from 'react-bootstrap';
import { FaUserTie, FaUserShield, FaUserCog, FaEye } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import './EmployeeSections.css';

const EmployeeSections = ({ employees }) => {
  // Filter employees by role
  const admins = employees.filter(emp => emp.isSuperUser);
  const managers = employees.filter(emp => emp.position?.toLowerCase().includes('manager'));
  const supervisors = employees.filter(emp => emp.position?.toLowerCase().includes('supervisor'));
  const otherEmployees = employees.filter(emp => 
    !emp.isSuperUser && 
    !emp.position?.toLowerCase().includes('manager') && 
    !emp.position?.toLowerCase().includes('supervisor')
  );

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
            <Link to={`/user-profile/${employee._id}`} className="btn btn-sm btn-outline-primary">
              <FaEye className="me-1" /> View
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

  return (
    <div className="employee-sections">
      {renderSection('Administrators', <FaUserShield />, admins, 'danger')}
      {renderSection('Managers', <FaUserTie />, managers, 'primary')}
      {renderSection('Supervisors', <FaUserCog />, supervisors, 'info')}
      {renderSection('Employees', <FaUserTie />, otherEmployees, 'success')}
    </div>
  );
};

export default EmployeeSections; 