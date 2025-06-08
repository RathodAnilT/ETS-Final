import React, { useState, useEffect } from "react";
import { Container, Row, Col, Form, Button, Card, Modal, Spinner } from "react-bootstrap";
import { FaUserPlus, FaEye, FaEyeSlash, FaInfoCircle } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { triggerStatsUpdate } from "../../utils/helpers";
import "./NewUser.css";
import { isValidEmployeeId, generateEmployeeId } from "../../utils/barcodeHelpers";

const NewUser = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    employeeId: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    education: "",
    position: "",
    department: "",
    joiningDate: "",
    salary: "",
    emergencyContact: "",
    aadhar: "",
    panNo: "",
    githubId: "",
    linkedInId: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingEmployeeId, setIsCheckingEmployeeId] = useState(false);
  const [existingEmployeeIds, setExistingEmployeeIds] = useState([]);

  // Load existing employee IDs on component mount
  useEffect(() => {
    const fetchExistingEmployeeIds = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const response = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/api/users`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        if (response.data.users) {
          const ids = response.data.users.map(user => user.employeeId);
          setExistingEmployeeIds(ids);
        }
      } catch (error) {
        console.error("Error fetching existing employee IDs:", error);
      }
    };
    
    fetchExistingEmployeeIds();
  }, []);

  // Generate a unique employee ID
  const handleGenerateUniqueEmployeeId = () => {
    setIsCheckingEmployeeId(true);
    
    // Use the helper function to generate ID
    const newEmployeeId = generateEmployeeId(existingEmployeeIds);
    
    setFormData(prev => ({
      ...prev,
      employeeId: newEmployeeId
    }));
    
    setIsCheckingEmployeeId(false);
  };

  const validateForm = () => {
    const newErrors = {};
    const requiredFields = [
      "name",
      "email",
      "password",
      "phone",
      "employeeId",
      "dateOfBirth",
      "gender",
      "position",
      "department",
      "joiningDate",
      "salary",
      "aadhar",
      "panNo",
      "githubId",
      "linkedInId"
    ];

    requiredFields.forEach((field) => {
      if (!formData[field]) {
        newErrors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
      }
    });

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Phone validation
    if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid 10-digit phone number";
    }

    // Employee ID validation
    if (formData.employeeId) {
      // Use the helper function for validation
      if (!isValidEmployeeId(formData.employeeId)) {
        newErrors.employeeId = "Employee ID should be in format EMP-YYYY-NNNN";
      }
      // Check uniqueness
      else if (existingEmployeeIds.includes(formData.employeeId)) {
        newErrors.employeeId = "This Employee ID is already in use";
      }
    }

    // Aadhar validation
    if (formData.aadhar && !/^\d{12}$/.test(formData.aadhar)) {
      newErrors.aadhar = "Please enter a valid 12-digit Aadhar number";
    }

    // PAN validation
    if (formData.panNo && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNo)) {
      newErrors.panNo = "Please enter a valid PAN number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/users/signup`,
        {
          ...formData,
          isSuperUser: isAdmin
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      if (response.data.success) {
        // Trigger stats update event
        triggerStatsUpdate();
        setShowSuccessModal(true);
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    } catch (error) {
      console.error("Signup error:", error);
      alert(error.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="new-user-container">
      <Container>
        <Row className="justify-content-center">
          <Col md={10} lg={8}>
            <Card className="custom-card">
              <Card.Header className="custom-card-header">
                <h2 className="text-center mb-0">
                  <FaUserPlus className="me-2" />
                  Register New Employee
                </h2>
              </Card.Header>
              <Card.Body>
                <Form onSubmit={handleSubmit} className="custom-form">
                  <Row>
                    <Col md={6}>
                      <Form.Group className="custom-form-group">
                        <Form.Label className="custom-label">Name *</Form.Label>
                        <Form.Control
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          className={`custom-input ${errors.name ? "is-invalid" : ""}`}
                          placeholder="Enter full name"
                        />
                        {errors.name && (
                          <div className="invalid-feedback">{errors.name}</div>
                        )}
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="custom-form-group">
                        <Form.Label className="custom-label">Email *</Form.Label>
                        <Form.Control
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className={`custom-input ${errors.email ? "is-invalid" : ""}`}
                          placeholder="Enter email"
                        />
                        {errors.email && (
                          <div className="invalid-feedback">{errors.email}</div>
                        )}
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="custom-form-group">
                        <Form.Label className="custom-label">Password *</Form.Label>
                        <div className="password-input-container">
                          <Form.Control
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className={`custom-input ${errors.password ? "is-invalid" : ""}`}
                            placeholder="Enter password"
                          />
                          <span 
                            className="password-toggle-icon"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                          </span>
                        </div>
                        {errors.password && (
                          <div className="invalid-feedback">{errors.password}</div>
                        )}
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="custom-form-group">
                        <Form.Label className="custom-label">Phone *</Form.Label>
                        <Form.Control
                          type="text"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className={`custom-input ${errors.phone ? "is-invalid" : ""}`}
                          placeholder="Enter phone number"
                        />
                        {errors.phone && (
                          <div className="invalid-feedback">{errors.phone}</div>
                        )}
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="custom-form-group">
                        <Form.Label className="custom-label">
                          Employee ID * 
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="p-0 ms-2 text-info"
                            onClick={handleGenerateUniqueEmployeeId}
                            disabled={isCheckingEmployeeId}
                          >
                            {isCheckingEmployeeId ? (
                              <Spinner animation="border" size="sm" />
                            ) : (
                              <FaInfoCircle title="Generate Unique ID" />
                            )}
                          </Button>
                        </Form.Label>
                        <Form.Control
                          type="text"
                          name="employeeId"
                          value={formData.employeeId}
                          onChange={handleChange}
                          className={`custom-input ${errors.employeeId ? "is-invalid" : ""}`}
                          placeholder="Format: EMP-YYYY-NNNN"
                        />
                        {errors.employeeId ? (
                          <div className="invalid-feedback">{errors.employeeId}</div>
                        ) : (
                          <small className="text-muted">
                            This ID will be used for barcode generation
                          </small>
                        )}
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="custom-form-group">
                        <Form.Label className="custom-label">Date of Birth *</Form.Label>
                        <Form.Control
                          type="date"
                          name="dateOfBirth"
                          value={formData.dateOfBirth}
                          onChange={handleChange}
                          className={`custom-input ${errors.dateOfBirth ? "is-invalid" : ""}`}
                        />
                        {errors.dateOfBirth && (
                          <div className="invalid-feedback">{errors.dateOfBirth}</div>
                        )}
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="custom-form-group">
                        <Form.Label className="custom-label">Gender *</Form.Label>
                        <Form.Select
                          name="gender"
                          value={formData.gender}
                          onChange={handleChange}
                          className={`custom-input ${errors.gender ? "is-invalid" : ""}`}
                        >
                          <option value="">Select gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </Form.Select>
                        {errors.gender && (
                          <div className="invalid-feedback">{errors.gender}</div>
                        )}
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="custom-form-group">
                        <Form.Label className="custom-label">Position *</Form.Label>
                        <Form.Control
                          type="text"
                          name="position"
                          value={formData.position}
                          onChange={handleChange}
                          className={`custom-input ${errors.position ? "is-invalid" : ""}`}
                          placeholder="Enter position"
                        />
                        {errors.position && (
                          <div className="invalid-feedback">{errors.position}</div>
                        )}
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="custom-form-group">
                        <Form.Label className="custom-label">Department *</Form.Label>
                        <Form.Control
                          type="text"
                          name="department"
                          value={formData.department}
                          onChange={handleChange}
                          className={`custom-input ${errors.department ? "is-invalid" : ""}`}
                          placeholder="Enter department"
                        />
                        {errors.department && (
                          <div className="invalid-feedback">{errors.department}</div>
                        )}
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="custom-form-group">
                        <Form.Label className="custom-label">Joining Date *</Form.Label>
                        <Form.Control
                          type="date"
                          name="joiningDate"
                          value={formData.joiningDate}
                          onChange={handleChange}
                          className={`custom-input ${errors.joiningDate ? "is-invalid" : ""}`}
                        />
                        {errors.joiningDate && (
                          <div className="invalid-feedback">{errors.joiningDate}</div>
                        )}
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="custom-form-group">
                        <Form.Label className="custom-label">Salary *</Form.Label>
                        <Form.Control
                          type="number"
                          name="salary"
                          value={formData.salary}
                          onChange={handleChange}
                          className={`custom-input ${errors.salary ? "is-invalid" : ""}`}
                          placeholder="Enter salary"
                        />
                        {errors.salary && (
                          <div className="invalid-feedback">{errors.salary}</div>
                        )}
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="custom-form-group">
                        <Form.Label className="custom-label">Emergency Contact</Form.Label>
                        <Form.Control
                          type="text"
                          name="emergencyContact"
                          value={formData.emergencyContact}
                          onChange={handleChange}
                          className="custom-input"
                          placeholder="Enter emergency contact"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="custom-form-group">
                        <Form.Label className="custom-label">Aadhar Number *</Form.Label>
                        <Form.Control
                          type="text"
                          name="aadhar"
                          value={formData.aadhar}
                          onChange={handleChange}
                          className={`custom-input ${errors.aadhar ? "is-invalid" : ""}`}
                          placeholder="Enter Aadhar number"
                        />
                        {errors.aadhar && (
                          <div className="invalid-feedback">{errors.aadhar}</div>
                        )}
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="custom-form-group">
                        <Form.Label className="custom-label">PAN Number *</Form.Label>
                        <Form.Control
                          type="text"
                          name="panNo"
                          value={formData.panNo}
                          onChange={handleChange}
                          className={`custom-input ${errors.panNo ? "is-invalid" : ""}`}
                          placeholder="Enter PAN number"
                        />
                        {errors.panNo && (
                          <div className="invalid-feedback">{errors.panNo}</div>
                        )}
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="custom-form-group">
                        <Form.Label className="custom-label">GitHub ID *</Form.Label>
                        <Form.Control
                          type="text"
                          name="githubId"
                          value={formData.githubId}
                          onChange={handleChange}
                          className={`custom-input ${errors.githubId ? "is-invalid" : ""}`}
                          placeholder="Enter GitHub username"
                        />
                        {errors.githubId && (
                          <div className="invalid-feedback">{errors.githubId}</div>
                        )}
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="custom-form-group">
                        <Form.Label className="custom-label">LinkedIn ID *</Form.Label>
                        <Form.Control
                          type="text"
                          name="linkedInId"
                          value={formData.linkedInId}
                          onChange={handleChange}
                          className={`custom-input ${errors.linkedInId ? "is-invalid" : ""}`}
                          placeholder="Enter LinkedIn profile URL"
                        />
                        {errors.linkedInId && (
                          <div className="invalid-feedback">{errors.linkedInId}</div>
                        )}
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="custom-form-group">
                    <Form.Label className="custom-label">Address</Form.Label>
                    <Form.Control
                      as="textarea"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="custom-input"
                      placeholder="Enter address"
                      rows={3}
                    />
                  </Form.Group>

                  <Form.Group className="custom-form-group">
                    <Form.Label className="custom-label">Education</Form.Label>
                    <Form.Control
                      as="textarea"
                      name="education"
                      value={formData.education}
                      onChange={handleChange}
                      className="custom-input"
                      placeholder="Enter education details"
                      rows={3}
                    />
                  </Form.Group>

                  <Form.Group className="custom-form-group">
                    <div className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="isAdmin"
                        checked={isAdmin}
                        onChange={(e) => setIsAdmin(e.target.checked)}
                      />
                      <label className="form-check-label" htmlFor="isAdmin">
                        Register as Admin
                      </label>
                    </div>
                  </Form.Group>

                  <div className="text-center mt-4">
                    <Button
                      type="submit"
                      className="custom-button"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Registering..." : "Register"}
                    </Button>
                  </div>

                  <div className="text-center mt-3">
                    <p className="mb-0">
                      Already have an account?{" "}
                      <Link to="/login" className="custom-link">
                        Login here
                      </Link>
                    </p>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
      
      <Modal 
        show={showSuccessModal} 
        onHide={() => setShowSuccessModal(false)}
        centered
        size="sm"
        backdrop="static"
        keyboard={false}
      >
        <Modal.Body className="text-center p-4">
          <div className="mb-3">
            <svg width="50" height="50" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#52c41a"/>
            </svg>
          </div>
          <h4 className="mb-3">Registration successful!</h4>
          <p className="text-muted">Redirecting to login page...</p>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default NewUser;
