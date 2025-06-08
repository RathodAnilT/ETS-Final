import React, { useState, useEffect } from "react";
import { Card, Row, Col, Spin, Alert, Badge, Empty } from "antd";
import { UserOutlined, TeamOutlined, MailOutlined, PhoneOutlined } from "@ant-design/icons";
import axios from "axios";
import moment from "moment";

const AdminDashboard = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError("Please login to view admin profiles");
          setLoading(false);
          return;
        }

        const response = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/api/users/admins`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (response.data.success && Array.isArray(response.data.admins)) {
          setAdmins(response.data.admins);
        } else {
          setAdmins([]);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching admins:", error);
        setError(error.response?.data?.message || "Failed to fetch admin profiles");
        setLoading(false);
      }
    };

    fetchAdmins();
  }, []);

  if (loading) {
    return (
      <div className="text-center p-5">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Alert message={error} type="error" showIcon />
      </div>
    );
  }

  if (!admins || admins.length === 0) {
    return (
      <div className="admin-dashboard p-4">
        <h2 className="mb-4">
          <TeamOutlined className="me-2" />
          Admin Profiles
        </h2>
        <Empty description="No admin profiles found" />
      </div>
    );
  }

  return (
    <div className="admin-dashboard p-4">
      <h2 className="mb-4">
        <TeamOutlined className="me-2" />
        Admin Profiles
      </h2>
      
      <Row gutter={[16, 16]}>
        {admins.map((admin) => (
          <Col xs={24} sm={12} md={8} lg={6} key={admin._id}>
            <Card
              className="admin-card"
              cover={
                <div className="admin-avatar">
                  <img
                    src={admin.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(admin.name)}`}
                    alt={admin.name}
                    className="admin-image"
                  />
                </div>
              }
            >
              <div className="admin-info">
                <h4 className="admin-name">
                  <UserOutlined className="me-2" />
                  {admin.name}
                </h4>
                <p className="admin-email">
                  <MailOutlined className="me-2" />
                  {admin.email}
                </p>
                <p className="admin-phone">
                  <PhoneOutlined className="me-2" />
                  {admin.phone}
                </p>
                <div className="admin-meta">
                  <Badge status="success" text="Super Admin" />
                  <span className="join-date">
                    Joined: {moment(admin.joiningDate).format("MMM YYYY")}
                  </span>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default AdminDashboard; 