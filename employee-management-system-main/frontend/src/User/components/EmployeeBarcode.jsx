import React from 'react';
import Barcode from 'react-barcode';
import { Card, Row, Col } from 'react-bootstrap';
import '../pages/EmployeeBarcode.css';

const EmployeeBarcode = ({ employeeId, name, department, position }) => {
  return (
    <Card className="barcode-card">
      <Card.Body>
        <div className="text-center mb-3">
          <h5 className="employee-id">ID: {employeeId}</h5>
          <Barcode 
            value={employeeId} 
            width={1.5}
            height={50}
            fontSize={14}
            margin={10}
            displayValue={true}
          />
        </div>
        <Row className="employee-details">
          <Col xs={12} className="text-center">
            <p className="employee-name">{name}</p>
            <p className="employee-position">{position}</p>
            <p className="employee-department">{department}</p>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default EmployeeBarcode; 
 