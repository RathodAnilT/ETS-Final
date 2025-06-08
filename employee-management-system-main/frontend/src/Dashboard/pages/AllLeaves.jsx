import React, { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import userContext from "../../context/userContext";
import { Spin, Badge, Card, Row, Col, Pagination, DatePicker, Empty } from "antd";
import { AiFillFilter } from "react-icons/ai";
import { Button, Dropdown } from "react-bootstrap";
import { GrClear } from "react-icons/gr";
import {
  FaCalendarAlt,
  FaUser,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaUserTie,
} from "react-icons/fa";
import axios from "axios";
import moment from "moment";
import "./AllLeaves.css";

const { RangePicker } = DatePicker;

const AllLeaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [sortedLeaves, setSortedLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(9);
  const [dateFilter, setDateFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const auth = useContext(userContext);
  const navigate = useNavigate();

  const getStatusIcon = (status) => {
    switch (status) {
      case "rejected":
        return <FaTimesCircle className="text-danger" />;
      case "approved":
        return <FaCheckCircle className="text-success" />;
      default:
        return <FaClock className="text-warning" />;
    }
  };

  const fetchLeaveData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/leaves/leave-data?userId=${auth.userId}`,
        {
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        }
      );
      if (response.data.success) {
        const sortedData = response.data.leaveData.sort(
          (a, b) => new Date(b.appliedAt) - new Date(a.appliedAt)
        );
        setLeaves(sortedData);
        setSortedLeaves(sortedData);
        setCurrentPage(1);
      } else {
        setError("Failed to fetch leave data");
      }
    } catch (error) {
      setError("Failed to load leave data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Filter logic now lives in useEffect
  useEffect(() => {
    let filteredData = [...leaves];

    if (statusFilter !== "all") {
      filteredData = filteredData.filter((data) => {
        const leaveStatus = String(data.leave_status).trim().toLowerCase();
        const selectedStatus = String(statusFilter).trim().toLowerCase();
        return leaveStatus === selectedStatus;
      });
    }

    if (dateFilter && dateFilter[0] && dateFilter[1]) {
      filteredData = filteredData.filter((leave) => {
        const leaveDate = moment(leave.appliedAt);
        return (
          leaveDate.isSameOrAfter(dateFilter[0], "day") &&
          leaveDate.isSameOrBefore(dateFilter[1], "day")
        );
      });
    }

    filteredData.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
    setSortedLeaves(filteredData);
    setCurrentPage(1);
  }, [statusFilter, dateFilter, leaves]);

  useEffect(() => {
    if (auth.token) {
      fetchLeaveData();
    }
  }, [auth.token]);

  const filterLeaveData = (status) => {
    setStatusFilter(status); // ✅ Triggers useEffect
  };

  const filterByDate = (dates) => {
    setDateFilter(dates?.length ? dates : null); // ✅ Triggers useEffect
  };

  const handleDateFilter = (type) => {
    const today = moment().startOf("day");
    let startDate, endDate;

    switch (type) {
      case "today":
        startDate = today;
        endDate = today;
          break;
      case "thisWeek":
        startDate = moment().startOf("week");
        endDate = moment().endOf("week");
          break;
      case "thisMonth":
        startDate = moment().startOf("month");
        endDate = moment().endOf("month");
          break;
        default:
        return;
    }

    setDateFilter([startDate, endDate]);
  };

  const clearAllFilters = () => {
    setStatusFilter("all");
    setDateFilter(null);
    setSortedLeaves(leaves);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const indexOfLastCard = currentPage * pageSize;
  const indexOfFirstCard = indexOfLastCard - pageSize;

  return (
    <div className="container mt-4 leave-page-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>My Leave Requests</h2>
        <Link to={`/ask-for-leave/${auth.userId}`}>
          <Button variant="primary">
            <FaCalendarAlt className="me-2" />
            Apply for Leave
          </Button>
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
          <button 
            type="button" 
            className="btn-close float-end" 
            onClick={() => setError(null)}
            aria-label="Close"
          ></button>
        </div>
      )}

      {/* Filters */}
      <div className="mb-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div className="d-flex gap-2">
          {/* Status Filter */}
        <Dropdown>
            <Dropdown.Toggle
              variant={statusFilter !== "all" ? "primary" : "outline-primary"}
            >
              <AiFillFilter />{" "}
              {statusFilter === "all"
                ? "Status Filter"
                : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
          </Dropdown.Toggle>
          <Dropdown.Menu>
              <Dropdown.Item onClick={() => filterLeaveData("approved")}>
              Approved
            </Dropdown.Item>
            <Dropdown.Item onClick={() => filterLeaveData("rejected")}>
              Rejected
            </Dropdown.Item>
            <Dropdown.Item onClick={() => filterLeaveData("pending")}>
              Pending
            </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item onClick={clearAllFilters}>
                <GrClear className="me-2" /> Clear All Filters
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>

          {/* Date Filter */}
          <Dropdown>
            <Dropdown.Toggle variant="outline-secondary">
              <FaCalendarAlt /> Date Filter
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <div className="p-2">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="w-100 mb-2"
                  onClick={() => handleDateFilter("today")}
                >
                  Today
                </Button>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="w-100 mb-2"
                  onClick={() => handleDateFilter("thisWeek")}
                >
                  This Week
                </Button>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="w-100"
                  onClick={() => handleDateFilter("thisMonth")}
                >
                  This Month
                </Button>
                <div className="mt-2">
                  <RangePicker onChange={filterByDate} value={dateFilter} />
                </div>
              </div>
            </Dropdown.Menu>
          </Dropdown>
        </div>

        <div className="text-muted">
          Showing {indexOfFirstCard + 1}-
          {Math.min(indexOfLastCard, sortedLeaves.length)} of{" "}
          {sortedLeaves.length} leaves
        </div>
      </div>

      {/* Data Display */}
      {loading ? (
        <div className="text-center">
          <Spin size="large" />
        </div>
      ) : sortedLeaves.length === 0 ? (
        <div className="text-center mt-4">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No leave requests found"
          />
          <Button
            type="primary"
            className="mt-3"
            onClick={() => navigate(`/ask-for-leave/${auth.userId}`)}
          >
            Apply for Leave
          </Button>
        </div>
      ) : (
        <>
          <Row gutter={[16, 16]}>
            {sortedLeaves
              .slice(indexOfFirstCard, indexOfLastCard)
              .map((leave) => (
                <Col xs={24} sm={12} lg={8} key={leave._id}>
                  <Card
                    className={`leave-card ${leave.leave_status}`}
                    size="small"
                  >
                    <div className="leave-details">
                      <div className="d-flex justify-content-between mb-1">
                        <div>
                          <strong className="small">Duration:</strong>
                          <div className="text-muted small">
                            {moment(leave.startDate).format('MMM DD')} - {moment(leave.leaveDate).format('MMM DD')}
                          </div>
                        </div>
                        <div>
                          <strong className="small">Days:</strong>
                          <div className="text-muted small">{leave.leaveDays} days</div>
                        </div>
                      </div>
                      
                      <div className="mb-1">
                        <strong className="small">Reason:</strong>
                        <div className="text-muted small text-truncate">{leave.reason}</div>
                      </div>
                      
                      <div className="d-flex justify-content-between mb-1">
                        <div>
                          <strong className="small">Applied:</strong>
                          <div className="text-muted small">
                            {moment(leave.appliedAt).format('MMM DD, hh:mm A')}
                          </div>
                        </div>
                        <div>
                          <strong className="small">Status:</strong>
                          <div className="text-muted small d-flex align-items-center">
                            {getStatusIcon(leave.leave_status)}
                            <span className="ms-1">{leave.leave_status}</span>
                          </div>
                        </div>
                      </div>

                      {leave.leave_status === "approved" && (
                        <div className="mb-1">
                          <strong className="small">Approved By:</strong>
                          <div className="text-muted small d-flex align-items-center">
                            <FaUserTie className="me-1" />
                            <span className="fw-bold me-1">
                              {leave.approvedBy?.name || leave.approvedBy?.username || 'Manager'}:
                            </span>
                            <span className="small">
                              {moment(leave.approvedAt).format('MMM DD, hh:mm A')}
                            </span>
                          </div>
                        </div>
                      )}

                      {leave.leave_status === "rejected" && (
                        <div className="mb-1">
                          <strong className="small">Rejected By:</strong>
                          <div className="text-muted small d-flex align-items-center">
                            <FaUserTie className="me-1" />
                            <span className="fw-bold me-1">
                              {leave.rejectedBy?.name || leave.rejectedBy?.username || 'Manager'}:
                            </span>
                            <span className="small">
                              {moment(leave.rejectedAt).format('MMM DD, hh:mm A')}
                            </span>
                          </div>
                        </div>
                      )}

                      {leave.leave_status === "pending" && (
                        <div className="mb-1">
                          <strong className="small">Pending Approval:</strong>
                          <div className="text-muted small d-flex align-items-center">
                            <FaClock className="me-1" />
                            Waiting for manager's approval
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                </Col>
              ))}
          </Row>

          {sortedLeaves.length > pageSize && (
            <div className="d-flex justify-content-center mt-4">
              <Pagination
                current={currentPage}
                total={sortedLeaves.length}
                pageSize={pageSize}
                onChange={handlePageChange}
                showSizeChanger={false}
              />
                  </div>
          )}
        </>
            )}
    </div>
  );
};

export default AllLeaves;
