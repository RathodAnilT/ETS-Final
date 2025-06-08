import { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import userContext from "../context/userContext";
import { Avatar, Dropdown, Space, Badge } from "antd";
import { UserOutlined, LogoutOutlined, BellOutlined } from "@ant-design/icons";
import axios from "axios";

import { NavDropdown } from "react-bootstrap";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import Container from "react-bootstrap/Container";

import MainHeader from "./MainHeader";
import getIcon from "../utils/getIcon";
import "./MainNav.css";
import { FaBook, FaGraduationCap, FaQuestionCircle } from "react-icons/fa";

const NavLinks = (item) => {
  return (
    <Nav.Link
      className="nav-link-custom"
      href={item.link}
    >
      {getIcon(item.navIcon)}
      {item.navText}
    </Nav.Link>
  );
};

function MainNav() {
  const authUser = useContext(userContext);
  const navigate = useNavigate();
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    if (!authUser.isLoggedIn) {
      navigate("/login");
    }
  }, [authUser, navigate]);

  useEffect(() => {
    authUser.getUserData();
    // eslint-disable-next-line
  }, []);

  // Fetch unread notification count
  useEffect(() => {
    const fetchNotificationCount = async () => {
      if (!authUser.isLoggedIn || !authUser.token) return;
      
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/api/notifications/count`,
          {
            headers: {
              'Authorization': `Bearer ${authUser.token}`
            }
          }
        );
        
        if (response.data.success) {
          setUnreadNotifications(response.data.count);
        }
      } catch (error) {
        console.error('Error fetching notification count:', error);
      }
    };

    if (authUser.isLoggedIn) {
      fetchNotificationCount();
      
      // Set up polling for notification count
      const intervalId = setInterval(fetchNotificationCount, 60000); // Poll every minute
      return () => clearInterval(intervalId);
    }
  }, [authUser.isLoggedIn, authUser.token]);

  const handleLogout = () => {
    authUser.logout();
    navigate("/login");
  };

  const items = [
    {
      key: '1',
      label: (
        <Link to={`/user-profile/${authUser.userId}`} className="text-decoration-none">
          <Space>
            <UserOutlined />
            Profile
          </Space>
        </Link>
      ),
    },
    {
      key: '2',
      label: (
        <div onClick={handleLogout} style={{ cursor: 'pointer' }}>
          <Space>
            <LogoutOutlined />
            Logout
          </Space>
        </div>
      ),
    },
  ];

  return (
    <MainHeader>
      <Navbar expand="lg" className="custom-navbar">
        <Container>
          <Navbar.Brand>
            <Link
              to={`${authUser.isLoggedIn ? "/" : "/login"}`}
              className="brand-link"
            >
              <span className="brand-text">ETS</span>
            </Link>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              {authUser.isLoggedIn && (
                <>
                  <Nav.Link as={Link} to="/" className="nav-link-custom">
                    Home
                  </Nav.Link>
                  <Nav.Link as={Link} to="/dashboard" className="nav-link-custom">
                    Dashboard
                  </Nav.Link>
                  <Nav.Link as={Link} to="/leave-page" className="nav-link-custom">
                    Leaves
                  </Nav.Link>
                  <Nav.Link as={Link} to="/completion-review" className="nav-link-custom">
                    Task Approvals
                  </Nav.Link>
                  {authUser.isSuperUser && (
                    <>
                    <Nav.Link as={Link} to="/admin" className="nav-link-custom">
                      Admin
                    </Nav.Link>
                    <Nav.Link as={Link} to="/task-management" className="nav-link-custom">
                      Task Management
                    </Nav.Link>
                    </>
                  )}
                </>
              )}
              <Nav.Link as={Link} to="/about" className="nav-link-custom">
                About
              </Nav.Link>
            </Nav>
            {authUser.isLoggedIn && (
              <div className="d-flex align-items-center">
                <Nav.Link as={Link} to="/notifications" className="nav-link-custom me-3">
                  <Badge count={unreadNotifications} size="small">
                    <BellOutlined style={{ fontSize: '18px' }} />
                  </Badge>
                </Nav.Link>
                <Dropdown menu={{ items }} placement="bottomRight">
                  <Space className="user-profile">
                    <Avatar 
                      src={authUser.currentUser?.image ? `${process.env.REACT_APP_BACKEND_URL}/${authUser.currentUser.image}` : null}
                      icon={<UserOutlined />}
                      className="user-avatar"
                    />
                    <span className="user-name">{authUser.currentUser?.name}</span>
                  </Space>
                </Dropdown>
              </div>
            )}
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </MainHeader>
  );
}

export default MainNav;
