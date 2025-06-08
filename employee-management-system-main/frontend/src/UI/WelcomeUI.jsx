import React, { useState, useEffect } from "react";
import { FiSun, FiCloud, FiCloudRain, FiMoon } from "react-icons/fi";
import { FaCloudSun, FaCalendarAlt } from "react-icons/fa";
import "./WelcomeUI.css";

const WelcomeUI = ({ employee }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weatherIcon, setWeatherIcon] = useState(<FiSun />);

  useEffect(() => {
    // Update time every minute
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    // Randomly pick a weather icon for demo purposes
    const weatherIcons = [
      <FiSun className="weather-icon sun" />,
      <FiCloud className="weather-icon cloud" />,
      <FiCloudRain className="weather-icon rain" />,
      <FaCloudSun className="weather-icon cloudy-sun" />,
      <FiMoon className="weather-icon moon" />
    ];
    setWeatherIcon(weatherIcons[Math.floor(Math.random() * weatherIcons.length)]);

    return () => clearInterval(interval);
  }, []);

  const getGreetings = () => {
    let timeNow = currentTime.getHours();
    let greeting =
      timeNow >= 5 && timeNow < 12
        ? "Good Morning"
        : timeNow >= 12 && timeNow < 18
        ? "Good Afternoon"
        : "Good Evening";
    return greeting;
  };

  // Get user's first name for a more personal greeting
  const getDisplayName = () => {
    if (!employee || !employee.name) return "there";
    
    // Extract first name from full name
    const firstName = employee.name.split(' ')[0];
    return firstName;
  };

  // Format the current date
  const formatDate = () => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return currentTime.toLocaleDateString('en-US', options);
  };

  // Format the current time
  const formatTime = () => {
    return currentTime.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className="welcome-section">
      <div className="welcome-content">
        <div className="welcome-user">
          <div className="greeting-wrapper">
            <h1 className="greeting">{getGreetings()}</h1>
            <h2 className="user-name">{getDisplayName()}</h2>
          </div>
          <p className="welcome-message">Welcome to your Employee Dashboard</p>
        </div>

        <div className="date-time-info">
          <div className="current-datetime">
            <div className="date-display">
              <FaCalendarAlt className="date-icon" />
              <span>{formatDate()}</span>
            </div>
            <div className="time-display">
              <span>{formatTime()}</span>
            </div>
          </div>
          <div className="weather-display">
            {weatherIcon}
            <span className="temperature">28°C</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeUI;
