import React, { useContext } from "react";
import { useForm } from "react-hook-form";
import { Form } from "react-bootstrap";
import { useNavigate, Link } from "react-router-dom";
import { App } from "antd";
import axiosInstance from "../../utils/axiosConfig";
import userContext from "../../context/userContext";
import "./LoginUser.css";

const SparkLogo = () => (
  <svg className="login-logo" width="60" height="60" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="sparkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#4facfe', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#00f2fe', stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    <path fill="url(#sparkGradient)" d="M50,5 L61.8,38.2 L95,38.2 L69.1,59.8 L80.9,92 L50,70.4 L19.1,92 L30.9,59.8 L5,38.2 L38.2,38.2 Z" />
    <text x="50" y="60" fontSize="18" fontWeight="bold" fill="#fff" textAnchor="middle" dy=".3em">
      SP4RK
    </text>
  </svg>
);

const LoginUser = () => {
  const authUser = useContext(userContext);
  const navigate = useNavigate();
  const { message } = App.useApp();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    try {
      const response = await axiosInstance.post('/api/users/login', {
        email: data.email,
        password: data.password,
      });

      if (response.data.success) {
        const { token, user } = response.data;
        const { _id, name, isSuperUser } = user;
        authUser.login(token, _id, isSuperUser, name);
        message.success("Login Successful!");
        navigate("/");
      }
    } catch (error) {
      console.error("Login error:", error);
      message.error(error.response?.data?.message || "Invalid Email or Password");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <SparkLogo />
          <h1 className="login-title">Welcome to SP4RK</h1>
          <p className="login-subtitle">Please log in to continue</p>
        </div>
        <Form onSubmit={handleSubmit(onSubmit)} className="login-form">
          <div className="form-group">
            <input
              type="email"
              placeholder="Email address"
              className="form-control"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[\w-.]+@([\w-]+.)+[\w-]{2,4}$/,
                  message: "Please enter a valid email",
                },
              })}
            />
            {errors.email && (
              <div className="error-text">{errors.email.message}</div>
            )}
          </div>

          <div className="form-group">
            <input
              type="password"
              placeholder="Password"
              className="form-control"
              {...register("password", {
                required: "Password is required",
                pattern: {
                  value: /^([a-zA-Z0-9@*#$%^&*!]{6,15})$/,
                  message: "Password should contain at least 6 characters",
                },
              })}
            />
            {errors.password && (
              <div className="error-text">{errors.password.message}</div>
            )}
          </div>

          <button type="submit" className="login-button">
            Login
          </button>

          <div className="login-links">
            <a href="#forgot-password">Forgot password?</a>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default LoginUser;
