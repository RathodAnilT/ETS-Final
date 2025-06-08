import React, { useState, useContext, useEffect } from "react";
import { Form, Input, Button, Upload, message, Card, Spin } from "antd";
import { UploadOutlined } from "@ant-design/icons";
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
  const [fileList, setFileList] = useState([]);

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

        // Set initial file list if user has an image
        if (response.data.user.image && response.data.user.image !== "uploads/images/user-default.jpg") {
          setFileList([
            {
              uid: '-1',
              name: 'profile.jpg',
              status: 'done',
              url: `${process.env.REACT_APP_BACKEND_URL}/${response.data.user.image}`,
            },
          ]);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        message.error("Failed to load user data");
      } finally {
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
    const formData = new FormData();

      // Add all form fields to FormData
      formData.append("name", values.username);
      formData.append("email", values.email);
      formData.append("position", values.position);
      formData.append("phone", values.phone);
      formData.append("address", values.address);
      formData.append("aadhar", values.aadhar);
      formData.append("panNo", values.panNo);

      // Add image if it exists
      if (fileList.length > 0 && fileList[0].originFileObj) {
        const file = fileList[0].originFileObj;
        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
          message.error("Image size should be less than 5MB");
          return;
        }
        // Validate file type
        if (!file.type.startsWith('image/')) {
          message.error("Please upload an image file");
          return;
        }
        formData.append("image", file);
    }

      const response = await axios({
        method: 'patch',
        url: `${process.env.REACT_APP_BACKEND_URL}/api/users/editEmployee/${uid}`,
        data: formData,
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'multipart/form-data',
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

  const handleFileChange = ({ fileList }) => {
    setFileList(fileList);
  };

  const beforeUpload = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('You can only upload image files!');
      return false;
    }
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('Image must be smaller than 5MB!');
      return false;
    }
    return false; // Prevent auto upload
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

          <Form.Item
          label="Profile Photo"
          help="Upload a profile photo (max 5MB, JPG/PNG only)"
        >
          <Upload
            name="image"
            listType="picture"
            maxCount={1}
            fileList={fileList}
            onChange={handleFileChange}
            beforeUpload={beforeUpload}
            accept="image/jpeg,image/png"
          >
            <Button icon={<UploadOutlined />}>Upload Photo</Button>
            </Upload>
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
