import './ApplyLeaveForm.css';
import React, { useState, useContext } from 'react';
import { Form, Button, Alert, Card, Spinner } from 'react-bootstrap';
import { DatePicker, Input } from 'antd';
import moment from 'moment';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import userContext from '../../context/userContext';

const { RangePicker } = DatePicker;
const { TextArea } = Input;

const ApplyLeaveForm = () => {
  const auth = useContext(userContext);
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [leaveData, setLeaveData] = useState({
    startDate: null,
    endDate: null,
    reason: '',
    leaveDays: 0
  });

  // Disable past dates
  const disabledDate = (current) => {
    return current && current < moment().startOf('day');
  };

  const handleDateChange = (dates) => {
    if (dates && dates[0] && dates[1]) {
      const startDate = dates[0].format('YYYY-MM-DD');
      const endDate = dates[1].format('YYYY-MM-DD');
      
      // Calculate number of days
      const start = moment(startDate);
      const end = moment(endDate);
      const days = end.diff(start, 'days') + 1; // Include both start and end dates
      
      setLeaveData({
        ...leaveData,
        startDate,
        endDate,
        leaveDays: days
      });
    } else {
      setLeaveData({
        ...leaveData,
        startDate: null,
        endDate: null,
        leaveDays: 0
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!leaveData.startDate || !leaveData.endDate) {
      setError('Please select start and end dates');
      return;
    }
    
    if (!leaveData.reason.trim()) {
      setError('Please provide a reason for your leave');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/leaves/apply-leave/${auth.userId}`,
        {
          leaveDate: {
            leaveStartDate: leaveData.startDate,
            leaveEndDate: leaveData.endDate,
            reason: leaveData.reason,
            leaveDays: leaveData.leaveDays
          }
        },
        {
          headers: {
            Authorization: `Bearer ${auth.token}`
          }
        }
      );
      
      if (response.data.success) {
        setSuccess('Leave request submitted successfully!');
        
        // Reset form
        setLeaveData({
          startDate: null,
          endDate: null,
          reason: '',
          leaveDays: 0
        });
        
        // Redirect after short delay
        setTimeout(() => {
          navigate('/all-leaves');
        }, 2000);
      }
    } catch (error) {
      console.error('Error applying for leave:', error);
      setError(error.response?.data?.message || 'Failed to submit leave request. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="apply-leave-center">
    <div className="apply-leave-box">
      <div className="apply-leave-header">
        Apply for Leave
      </div>
      <div className="apply-leave-card">
        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}
  
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-4">
            <Form.Label>Select Leave Period</Form.Label>
            <div>
              <RangePicker
                style={{ width: '100%' }}
                onChange={handleDateChange}
                disabledDate={disabledDate}
                format="YYYY-MM-DD"
                placeholder={['Start Date', 'End Date']}
                size="large"
              />
            </div>
            {leaveData.leaveDays > 0 && (
              <div className="text-muted mt-2">
                Total: <strong>{leaveData.leaveDays}</strong> day(s)
              </div>
            )}
          </Form.Group>
  
          <Form.Group className="mb-4">
            <Form.Label>Reason for Leave</Form.Label>
            <TextArea
              rows={4}
              placeholder="Please provide details about your leave request"
              value={leaveData.reason}
              onChange={(e) => setLeaveData({ ...leaveData, reason: e.target.value })}
            />
          </Form.Group>
  
          <div className="button-group">
            <Button
              className="btn-cancel"
              onClick={() => navigate('/all-leaves')}
              type="button"
            >
              Cancel
            </Button>
            <Button
              className="btn-submit"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner as="span" animation="border" size="sm" className="me-2" />
                  Submitting...
                </>
              ) : (
                'Submit Leave Request'
              )}
            </Button>
          </div>
        </Form>
      </div>
    </div>
  </div>
  
  );
};

export default ApplyLeaveForm; 