import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Form, Button, Table, Badge, Alert, ProgressBar } from 'react-bootstrap';
import { FaExchangeAlt, FaUserFriends, FaCheck, FaTimes, FaInfoCircle } from 'react-icons/fa';
import axios from 'axios';
import './LaborSharing.css';

const LaborSharing = ({ employees }) => {
  const [sharingRequests, setSharingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [duration, setDuration] = useState(1);
  const [reason, setReason] = useState('');
  const [departmentCapacity, setDepartmentCapacity] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchSharingRequests();
    fetchDepartmentCapacity();

    // Optional: Set up polling if you want real-time updates without manual refresh
    // const intervalId = setInterval(() => {
    //   fetchSharingRequests();
    //   fetchDepartmentCapacity();
    // }, 30000); // Refresh every 30 seconds
    // return () => clearInterval(intervalId);

  }, []);

  const fetchDepartmentCapacity = async () => {
    try {
      const response = await axios.get('/api/labor-sharing/department-capacity');
      setDepartmentCapacity(response.data);
    } catch (error) {
      console.error('Error fetching department capacity:', error);
    }
  };

  const fetchSharingRequests = async () => {
    try {
      const response = await axios.get('/api/labor-sharing/requests');
      setSharingRequests(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching sharing requests:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await axios.post('/api/labor-sharing/request', {
        employeeId: selectedEmployee,
        department: selectedDepartment,
        duration,
        reason
      });
      
      // Reset form
      setSelectedEmployee('');
      setSelectedDepartment('');
      setDuration(1);
      setReason('');
      setSuccess('Request submitted successfully!');
      
      // Refresh data
      fetchSharingRequests();
      fetchDepartmentCapacity();
    } catch (error) {
      setError(error.response?.data?.message || 'Error creating sharing request');
    }
  };

  const handleApprove = async (requestId) => {
    try {
      await axios.put(`/api/labor-sharing/requests/${requestId}/approve`);
      fetchSharingRequests();
      fetchDepartmentCapacity();
      setSuccess('Request approved successfully!');
    } catch (error) {
      setError(error.response?.data?.message || 'Error approving request');
    }
  };

  const handleReject = async (requestId) => {
    try {
      await axios.put(`/api/labor-sharing/requests/${requestId}/reject`);
      fetchSharingRequests();
      setSuccess('Request rejected successfully!');
    } catch (error) {
      setError(error.response?.data?.message || 'Error rejecting request');
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      approved: 'success',
      rejected: 'danger'
    };
    return <Badge bg={variants[status]}>{status.toUpperCase()}</Badge>;
  };

  const getCapacityPercentage = (dept) => {
    if (!departmentCapacity[dept]) return 0;
    return (departmentCapacity[dept].current / departmentCapacity[dept].total) * 100;
  };

  const getCapacityVariant = (percentage) => {
    if (percentage >= 90) return 'danger';
    if (percentage >= 70) return 'warning';
    return 'success';
  };

  return (
    <div className="labor-sharing-container">
      {error && (
        <Alert variant="danger" onClose={() => setError('')} dismissible>
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" onClose={() => setSuccess('')} dismissible>
          {success}
        </Alert>
      )}
      <Row>
        <Col md={6} className="mx-auto mb-4">
          <Card className="request-form-card">
            <Card.Header>
              <h4><FaExchangeAlt className="me-2" />New Labor Sharing Request</h4>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Select Employee</Form.Label>
                  <Form.Select 
                    value={selectedEmployee}
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                    required
                    className="form-select-dropdown"
                  >
                    <option value="">Choose employee...</option>
                    {employees
                      .filter(emp => !emp.isSuperUser)
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map(emp => (
                        <option key={emp._id} value={emp._id}>
                          {emp.name} - {emp.department}
                        </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Target Department</Form.Label>
                  <Form.Select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    required
                    className="form-select-dropdown"
                  >
                    <option value="">Select department...</option>
                    <option value="IT">IT</option>
                    <option value="HR">HR</option>
                    <option value="Finance">Finance</option>
                    <option value="Operations">Operations</option>
                  </Form.Select>
                  {selectedDepartment && departmentCapacity[selectedDepartment] && (
                    <div className="mt-2">
                      <small className="text-muted">
                        <FaInfoCircle className="me-1" />
                        Capacity: {departmentCapacity[selectedDepartment].current}/{departmentCapacity[selectedDepartment].total}
                      </small>
                      <ProgressBar 
                        now={getCapacityPercentage(selectedDepartment)} 
                        variant={getCapacityVariant(getCapacityPercentage(selectedDepartment))}
                        className="mt-1"
                      />
                    </div>
                  )}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Duration (weeks)</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    max="12"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    required
                    className="form-control-custom"
                  />
                  <Form.Text className="text-muted">
                    Maximum duration is 12 weeks
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Reason</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                    placeholder="Please provide a detailed reason for the labor sharing request..."
                    className="form-control-custom"
                  />
                </Form.Group>

                <Button variant="primary" type="submit" className="w-100 submit-btn">
                  Submit Request
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col md={12}>
          <Card>
            <Card.Header>
              <h4><FaUserFriends className="me-2" />Labor Sharing Requests</h4>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : sharingRequests.length === 0 ? (
                <div className="text-center no-requests">
                  <FaUserFriends className="mb-3" size={48} />
                  <p>No labor sharing requests found</p>
                </div>
              ) : (
                <Table responsive hover className="requests-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Department</th>
                      <th>Duration</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sharingRequests.map(request => (
                      <tr key={request._id}>
                        <td>{request.employeeName}</td>
                        <td>{request.department}</td>
                        <td>{request.duration} weeks</td>
                        <td>{getStatusBadge(request.status)}</td>
                        <td>
                          {request.status === 'pending' && (
                            <div className="action-buttons">
                              <Button
                                variant="success"
                                size="sm"
                                className="me-2"
                                onClick={() => handleApprove(request._id)}
                                title="Approve Request"
                              >
                                <FaCheck />
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleReject(request._id)}
                                title="Reject Request"
                              >
                                <FaTimes />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default LaborSharing; 