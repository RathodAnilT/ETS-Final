import React, { useEffect, useState } from "react";
import axios from "axios";
import { ListGroup, Alert, Button, Badge } from "react-bootstrap";
import { Spin } from "antd";
import CardUI from "../../UI/CardUI";
import getIcon from "../../utils/getIcon";
import moment from "moment";
import { FaUser, FaCalendarAlt, FaClock } from "react-icons/fa";
import "./ApproveLeave.css";

const ApproveLeave = () => {
  const [user, setUser] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updateLeave, setUpdateLeave] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/leaves/applied-leave/`);
        setUser(response.data.user);
        setUpdateLeave(false);
        setLoading(false);
      } catch (error) {
        setLoading(false);
        console.log(error);
      }
    };
    fetchUser();
  }, [updateLeave]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const fetchCurrentUser = async () => {
        try {
          const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/users/${localStorage.getItem('userId')}`);
          setCurrentUser(response.data.user);
        } catch (error) {
          console.error('Error fetching current user:', error);
        }
      };
      fetchCurrentUser();
    }
  }, []);

  const leaveApproval = async (permission, leaveId, employeeId) => {
    if (!currentUser) return;
    
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.patch(`${process.env.REACT_APP_BACKEND_URL}/api/leaves/approve-leave/${leaveId}`, {
        applyForLeave: permission,
        approverId: currentUser._id,
        approverName: currentUser.name,
      });
      
      if (response.data.success) {
        setSuccess(response.data.message);
        setUpdateLeave(true);
        setLoading(true);
      }
    } catch (error) {
      console.log(error);
      setError(error.response?.data?.message || "Failed to approve leave");
      setUpdateLeave(false);
    }
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = user.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(user.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  if (currentUser && !currentUser.isSuperUser) {
    return (
      <div className="text-center mt-5">
        <Alert variant="warning">
          You don't have permission to approve leaves. Only managers can approve leaves.
        </Alert>
      </div>
    );
  }

  return (
    <div className="approve-leave-container">
      {loading ? (
        <div className="text-center py-5">
          <Spin size="large" />
        </div>
      ) : (
        <>
          {error && (
            <Alert variant="danger" className="mb-3">
              {error}
            </Alert>
          )}
          {success && (
            <Alert variant="success" className="mb-3">
              {success}
            </Alert>
          )}
          {user.length === 0 ? (
            <div className="no-requests">
              <Alert variant="info">
                <FaClock className="me-2" />
                No pending leave requests at the moment.
              </Alert>
            </div>
          ) : (
            <>
              <h3 className="approve-leave-header">
                <FaCalendarAlt className="me-2" />
                Pending Leave Requests
              </h3>
              <div className="leave-requests-list">
                {currentItems.map((employee) => (
                  <div key={employee._id} className="leave-request-card">
                    <div className="employee-info">
                      <img
                        src={`${process.env.REACT_APP_BACKEND_URL}/${employee.image}`}
                        alt={employee.name}
                        className="employee-avatar"
                      />
                      <div className="employee-details">
                        <h5>{employee.name}</h5>
                        <p><FaUser className="me-1" /> {employee.position}</p>
                        <p>{employee.email}</p>
                      </div>
                    </div>
                    
                    {employee.leaveDate && employee.leaveDate.length > 0 && (
                      <div className="leave-details">
                        {employee.leaveDate.map((leave, index) => (
                          <div key={index}>
                            <p>
                              <strong>From:</strong> {moment(leave.startDate).format('MMM DD, YYYY')}
                            </p>
                            <p>
                              <strong>To:</strong> {moment(leave.leaveDate).format('MMM DD, YYYY')}
                            </p>
                            <p>
                              <strong>Duration:</strong> {leave.leaveDays} days
                            </p>
                            {leave.reason && (
                              <p>
                                <strong>Reason:</strong> {leave.reason}
                              </p>
                            )}
                            <Badge
                              className={`leave-status ${leave.leave_status}`}
                            >
                              {leave.leave_status}
                            </Badge>
                            {leave.leave_status === "pending" && (
                              <div className="action-buttons">
                                <Button
                                  variant="success"
                                  className="btn-approve"
                                  onClick={() => leaveApproval(true, leave._id, employee._id)}
                                >
                                  Approve
                                </Button>
                                <Button
                                  variant="danger"
                                  className="btn-reject"
                                  onClick={() => leaveApproval(false, leave._id, employee._id)}
                                >
                                  Reject
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="pagination-container">
                  <ul className="pagination">
                    <li>
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </button>
                    </li>
                    {[...Array(totalPages)].map((_, index) => (
                      <li key={index + 1}>
                        <button
                          onClick={() => handlePageChange(index + 1)}
                          className={currentPage === index + 1 ? 'active' : ''}
                        >
                          {index + 1}
                        </button>
                      </li>
                    ))}
                    <li>
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ApproveLeave;
