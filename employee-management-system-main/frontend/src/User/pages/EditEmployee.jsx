import React, { useState, useContext, useEffect } from "react";
import { Form, Input, Button, message, Card, Spin } from "antd";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import userContext from "../../context/userContext";
import "./EditEmployee.css";

const EditEmployee = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const auth = useContext(userContext);
  const navigate = useNavigate();
  const { uid } = useParams();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/api/users/${uid}`,
          {
            headers: {
              Authorization: `Bearer ${auth.token}`,
            },
          }
        );
        setUserData(response.data.user);
        form.setFieldsValue({
          username: response.data.user.name,
          email: response.data.user.email,
          position: response.data.user.position,
          phone: response.data.user.phone,
          address: response.data.user.address,
          aadhar: response.data.user.aadhar,
          panNo: response.data.user.panNo,
        });
        setLoading(false);
      } catch (error) {
        console.error("Error fetching user data:", error);
        message.error("Failed to load user data");
        setLoading(false);
      }
    };

    if (uid) {
      fetchUserData();
    }
  }, [uid, auth.token, form]);

  const onFinish = async (values) => {
    try {
      setUploading(true);
      
      const response = await axios({
        method: 'patch',
        url: `${process.env.REACT_APP_BACKEND_URL}/api/users/editEmployee/${uid}`,
        data: {
          name: values.username,
          email: values.email,
          position: values.position,
          phone: values.phone,
          address: values.address,
          aadhar: values.aadhar,
          panNo: values.panNo
        },
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.data.success) {
        message.success("Employee updated successfully");
        navigate(`/user-profile/${uid}`);
      } else {
        throw new Error(response.data.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error("Could not update data. Please try again!");
      }
    } finally {
      setUploading(false);
    }
  };

  const onFinishFailed = (errorInfo) => {
    console.log("Failed:", errorInfo);
    message.error("Please provide all required data!");
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
        <p>Loading user data...</p>
      </div>
    );
  }

  return (
    <Card className="edit-employee-card">
      <div className="edit-header">
        <h2>Edit Profile</h2>
        <p>Update your profile information below</p>
      </div>

      <Form
        form={form}
        name="editEmployee"
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        layout="vertical"
      >
        <Form.Item
          name="username"
          label="Full Name"
          rules={[{ required: true, message: "Please input your name!" }]}
        >
          <Input placeholder="Enter your full name" />
        </Form.Item>

        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: "Please input your email!" },
            { type: "email", message: "Please enter a valid email!" },
          ]}
        >
          <Input placeholder="Enter your email" />
        </Form.Item>

        <Form.Item
          name="position"
          label="Position"
          rules={[{ required: true, message: "Please input your position!" }]}
        >
          <Input placeholder="Enter your position" />
        </Form.Item>

        <Form.Item
          name="phone"
          label="Phone Number"
          rules={[{ required: true, message: "Please input your phone number!" }]}
        >
          <Input placeholder="Enter your phone number" />
        </Form.Item>

        <Form.Item
          name="address"
          label="Address"
          rules={[{ required: true, message: "Please input your address!" }]}
        >
          <Input.TextArea rows={3} placeholder="Enter your address" />
        </Form.Item>

        <Form.Item
          name="aadhar"
          label="Aadhar Number"
          rules={[{ required: true, message: "Please input your Aadhar number!" }]}
        >
          <Input placeholder="Enter your Aadhar number" />
        </Form.Item>

        <Form.Item
          name="panNo"
          label="PAN Number"
          rules={[{ required: true, message: "Please input your PAN number!" }]}
        >
          <Input placeholder="Enter your PAN number" />
        </Form.Item>

        <Form.Item className="form-actions">
          <Button type="primary" htmlType="submit" loading={uploading}>
            Save Changes
          </Button>
          <Button onClick={() => navigate(`/user-profile/${uid}`)} className="cancel-btn">
            Cancel
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default EditEmployee;
