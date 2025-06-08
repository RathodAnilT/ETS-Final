import React from 'react';
import { Container, Row, Col, Breadcrumb } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import ApplyLeaveForm from '../components/ApplyLeaveForm';

const ApplyLeavePage = () => {
  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <Breadcrumb>
            <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/dashboard" }}>Dashboard</Breadcrumb.Item>
            <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/all-leaves" }}>My Leaves</Breadcrumb.Item>
            <Breadcrumb.Item active>Apply for Leave</Breadcrumb.Item>
          </Breadcrumb>
          <h2 className="mt-3">Apply for Leave</h2>
          <p className="text-muted">
            Submit your leave request with the required information. Your request will be reviewed by your manager.
          </p>
        </Col>
      </Row>
      
      <Row>
        <Col lg={8} md={10} sm={12}>
          <ApplyLeaveForm />
        </Col>
      </Row>
    </Container>
  );
};

export default ApplyLeavePage; 