import React, { useState } from "react";
import { Form, Button, Alert, Modal } from "react-bootstrap";
import { DatePicker, Spin } from "antd";
import axios from "axios";
import moment from "moment";

const LeaveRequest = ({ userId, onLeaveSubmitted }) => {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [leaveData, setLeaveData] = useState({
    startDate: "",
    endDate: "",
    reason: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/leaves/apply-leave/${userId}`,
        {
          leaveDate: {
            leaveStartDate: leaveData.startDate,
            leaveEndDate: leaveData.endDate,
            reason: leaveData.reason,
            leaveDays: moment(leaveData.endDate).diff(moment(leaveData.startDate), 'days') + 1
          }
        }
      );

      if (response.data.user) {
        setSuccess("Leave request submitted successfully!");
        setLeaveData({
          startDate: "",
          endDate: "",
          reason: "",
        });
        setShowModal(false);
        if (onLeaveSubmitted) {
          onLeaveSubmitted();
        }
      }
    } catch (error) {
      setError(error.response?.data?.message || "Failed to submit leave request");
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (dates) => {
    if (dates) {
      setLeaveData({
        ...leaveData,
        startDate: dates[0].format("YYYY-MM-DD"),
        endDate: dates[1].format("YYYY-MM-DD"),
      });
    }
  };

  return (
    <>
      <Button variant="primary" onClick={() => setShowModal(true)}>
        Request Leave
      </Button>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Request Leave</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Leave Period</Form.Label>
              <DatePicker.RangePicker
                style={{ width: "100%" }}
                onChange={handleDateChange}
                disabledDate={(current) => {
                  return current && current < moment().startOf("day");
                }}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Reason</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={leaveData.reason}
                onChange={(e) =>
                  setLeaveData({ ...leaveData, reason: e.target.value })
                }
                placeholder="Enter reason for leave"
                required
              />
            </Form.Group>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? <Spin size="small" /> : "Submit Request"}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default LeaveRequest; 