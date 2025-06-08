import "./App.css";
import { Route, BrowserRouter as Router, Routes, Navigate, useLocation } from "react-router-dom";
import Dashboard from "./Dashboard/pages/Dashboard";
import MainNav from "./Navigation/MainNav";
import EditEmployee from "./User/pages/EditEmployee";
import { useCallback, useState, useEffect } from "react";
import userContext from "./context/userContext";
import { AuthProvider } from "./context/AuthContext";
import LeavePage from "./Dashboard/components/LeavePage";
import ApproveLeave from "./Dashboard/components/ApproveLeave";
import AllLeaves from "./Dashboard/pages/AllLeaves";
import axiosInstance from "./utils/axiosConfig";
import UserProfile from "./Dashboard/components/UserProfile";
import { ConfigProvider, App as AntdApp, message } from "antd";
import NewUser from "./User/pages/NewUser";
import LoginUser from "./User/pages/LoginUser";
import NotFound from "./NotFound";
import Admin from "./Admin/pages/Admin";
import TaskManagement from "./Admin/TaskManagement";
import CompletionReviewPanel from "./Dashboard/components/CompletionReviewPanel";
import NotificationCenter from "./Dashboard/components/NotificationCenter";
import ApplyLeavePage from "./Dashboard/pages/ApplyLeavePage";
import Footer from './components/Footer';
import About from './components/About/About';
import Home from "./pages/Home";
import EmployeeHandbook from "./pages/EmployeeHandbook";
import TrainingPortal from "./pages/TrainingPortal";
import SystemGuide from "./pages/SystemGuide";
import AnalyticsDashboard from './Dashboard/pages/AnalyticsDashboard';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Services from './pages/Services';

// Define Layout component to conditionally render MainNav and Footer
const Layout = ({ children }) => {
  const location = useLocation();
  const showNav = location.pathname !== '/login';

  return (
    <div className="app-wrapper">
      {showNav && <MainNav />}
      <div className="content-wrapper">
        {children}
      </div>
      {showNav && <Footer />}
    </div>
  );
};

function App() {
  // Configure message component
  useEffect(() => {
    message.config({
      top: 100,
      duration: 3,
      maxCount: 3,
      prefixCls: 'ant-message',
    });
  }, []);

  const getLocalItem = () => {
    const items = localStorage.getItem("items");
    if (items) {
      return JSON.parse(items);
    } 
    
    // If no 'items' object found, check for direct token storage
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    const userName = localStorage.getItem("userName");
    const isSuperUser = localStorage.getItem("isSuperUser") === "true";
    
    if (token) {
      // If token exists in direct localStorage, create an items-like object
      return {
        token,
        userId,
        userName,
        isSuperUser
      };
    }
    
    return null;
  };
  
  const isAuth = getLocalItem();
  const [session, setSession] = useState(isAuth || {
    token: "",
    userId: "",
    isSuperUser: false,
    userName: ""
  });
  
  // Ensure token synchronization on initial load
  useEffect(() => {
    if (session.token) {
      // Synchronize tokens across different storage mechanisms
      localStorage.setItem('token', session.token);
      localStorage.setItem('userId', session.userId);
      localStorage.setItem('userName', session.userName);
      localStorage.setItem('isSuperUser', session.isSuperUser);
      
      // Validate token format
      try {
        const parts = session.token.split('.');
        if (parts.length !== 3) {
          console.error("Warning: Token doesn't look like a valid JWT (should have 3 parts)");
        } else {
          // Don't log the full token payload in production
          console.log("Token validated with correct format");
        }
      } catch (e) {
        console.error("Error validating token:", e);
      }
    }
  }, [session.token, session.userId, session.userName, session.isSuperUser]);

  // Force token refresh on app initialization
  useEffect(() => {
    // Check if token exists but authUser is not logged in
    const token = localStorage.getItem('token');
    if (token) {
      // Attempt to extract expiration from token
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          const expiration = payload.exp * 1000;
          if (Date.now() < expiration) {
            console.log("Valid token found, refreshing authentication state");
            const userId = localStorage.getItem('userId');
            const isSuperUser = localStorage.getItem('isSuperUser') === 'true';
            const userName = localStorage.getItem('userName');
            
            // Update session with token
            setSession({
              token,
              userId,
              isSuperUser,
              userName
            });
          } else {
            console.log("Expired token found, clearing authentication state");
            logout();
          }
        }
      } catch (error) {
        console.error("Error parsing token:", error);
      }
    }
  }, []);
  
  const [currentUser, setCurrentUser] = useState(null);
  
  const setLocalItem = (token, userId, superuser, userName) => {
    localStorage.setItem(
      "items",
      JSON.stringify({
        token: token,
        userId: userId,
        isSuperUser: superuser,
        userName: userName
      })
    );
    return true;
  };

  const login = useCallback((jwttoken, uid, superuser, userName) => {
    // Update session state
    setSession({
      token: jwttoken,
      userId: uid,
      isSuperUser: superuser,
      userName: userName
    });
    
    // Store in items for context
    setLocalItem(jwttoken, uid, superuser, userName);
    
    // Also store directly in localStorage for compatibility with existing code
    localStorage.setItem('token', jwttoken);
    localStorage.setItem('userId', uid);
    localStorage.setItem('userName', userName);
    localStorage.setItem('isSuperUser', superuser);
  }, []);

  const logout = useCallback(() => {
    // Remove items object
    localStorage.removeItem("items");
    
    // Also remove direct localStorage items
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("isSuperUser");
    
    setSession({
      token: "",
      userId: "",
      isSuperUser: false,
      userName: ""
    });
  }, []);

  const { token, userId, isSuperUser, userName } = session;

  const getUserData = async () => {
    if (token) {
      try {
        const response = await axiosInstance.get(`/api/users/${userId}`);
        setCurrentUser(response.data.user);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    }
  };

  return (
    <ConfigProvider>
      <AntdApp>
        <AuthProvider>
          <userContext.Provider
            value={{
              isLoggedIn: !!token,
              token: token,
              userId: userId,
              isSuperUser: isSuperUser,
              userName: userName,
              currentUser: currentUser,
              getUserData: getUserData,
              login: login,
              logout: logout,
            }}
          >
            <Router>
              <Layout>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<LoginUser />} />
                  <Route path="/signup" element={<NewUser />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/leave-page" element={<AllLeaves />} />
                  <Route path="/ask-for-leave/:uid" element={<ApplyLeavePage />} />
                  <Route path="/edit/:uid" element={<EditEmployee />} />
                  <Route path="/user-profile/:uid" element={<UserProfile userId={userId} />} />
                  <Route path="/approve-leave" element={<ApproveLeave />} />
                  <Route path="/profile" element={<Navigate to={`/user-profile/${userId}`} replace />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/task-management" element={<TaskManagement />} />
                  <Route path="/completion-review" element={<CompletionReviewPanel />} />
                  <Route path="/notifications" element={<NotificationCenter />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/employee-handbook" element={<EmployeeHandbook />} />
                  <Route path="/training-portal" element={<TrainingPortal />} />
                  <Route path="/system-guide" element={<SystemGuide />} />
                  <Route path="/analytics" element={<AnalyticsDashboard />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/services" element={<Services />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Layout>
            </Router>
          </userContext.Provider>
        </AuthProvider>
      </AntdApp>
    </ConfigProvider>
  );
}

export default App;
