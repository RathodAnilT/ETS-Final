import React from "react";
import { Link } from "react-router-dom";
import { Card, Row, Col } from "react-bootstrap";
import { FaEnvelope, FaUserTie, FaBuilding, FaPhoneAlt } from "react-icons/fa";
import "./EmpList.css";

const EmpList = ({ employee }) => {
  return (
    <Row className="employee-grid">
      {employee.length === 0 ? (
        <div className="no-employees">
          <p>No employees found</p>
        </div>
      ) : (
        employee.map((emp) => (
          <Col key={emp._id} lg={6} md={12} className="mb-4">
            <Link to={`/user-profile/${emp._id}`} className="employee-card-link">
              <Card className="employee-card">
                <div className="employee-card-content">
                  <div className="employee-avatar">
                    {emp.image ? (
                      <img 
                        src={`${process.env.REACT_APP_BACKEND_URL}/${emp.image}`} 
                        alt={emp.name} 
                        className="avatar-image"
                      />
                    ) : (
                      <div className="avatar-placeholder">
                        {emp.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  
                  <div className="employee-info">
                    <h3 className="employee-name">{emp.name}</h3>
                    
                    <div className="employee-details">
                      <div className="detail-item">
                        <FaUserTie className="detail-icon position" />
                        <span>{emp.position || "Position not set"}</span>
                      </div>
                      
                      <div className="detail-item">
                        <FaBuilding className="detail-icon department" />
                        <span>{emp.department || "Department not set"}</span>
                      </div>
                      
                      <div className="detail-item">
                        <FaEnvelope className="detail-icon email" />
                        <span>{emp.email}</span>
                      </div>
                      
                      {emp.phone && (
                        <div className="detail-item">
                          <FaPhoneAlt className="detail-icon phone" />
                          <span>{emp.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="view-profile">
                  <span>View Profile</span>
                </div>
              </Card>
            </Link>
          </Col>
        ))
      )}
    </Row>
  );
};

export default EmpList;
