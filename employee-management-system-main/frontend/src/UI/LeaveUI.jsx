import React from "react";
import {getLeaveData} from "../utils/leaveFunctions";
import userOnLeave from "../utils/isOnLeave";
import { Avatar } from "antd";
import { Spin } from "antd";

import "./LeaveUI.css";
import getIcon from "../utils/getIcon";
import { Link } from "react-router-dom";

const LeaveUI = ({ employee = [], superuser = false }) => {
  if (!employee || !Array.isArray(employee)) {
    return (
      <div className="container leave-section">
        <Spin />
      </div>
    );
  }

  const leaveUsers = userOnLeave(employee);

  if (superuser) {
    return (
      <div className="container leave-section">
        <div className="d-flex justify-content-between sticky-head">
          <h3>Pending Approval</h3>
          <Link to={"/approve-leave"} className="text-decoration-none mt-1">
            <span className="leave-req">Leave Requests &gt;</span>
          </Link>
        </div>
        {employee.length > 0 ? (
          employee.map((emp) => {
            if (emp && getLeaveData(emp.leaveDate) > 0) {
              return (
                <div
                  key={emp._id}
                  className="d-flex justify-content-between mt-2"
                >
                  <div className="d-flex gap-4">
                    <Avatar src={`${process.env.REACT_APP_BACKEND_URL}/${emp.image}`} size={30} />
                    <span className="leave-text">{emp.name}</span>
                  </div>
                  <span className="leave-text">
                    {getLeaveData(emp.leaveDate)}
                  </span>
                </div>
              );
            }
            return null;
          })
        ) : (
          <p>No employees found</p>
        )}
      </div>
    );
  }

  return (
    <div className="leave-section">
      <h3>On Leave</h3>
      {leaveUsers && Array.isArray(leaveUsers) && leaveUsers.length > 0 ? (
        leaveUsers.map((user, index) => (
          <div key={index} className="d-flex justify-content-between mt-3">
            <div className="d-flex gap-4">
              <Avatar src={`${process.env.REACT_APP_BACKEND_URL}/${user.image}`} size={30} />
              <span className="leave-text">{user.name}</span>
            </div>
            <span className="leave-text">
              {getLeaveData(user.leaveDate)}
            </span>
          </div>
        ))
      ) : (
        <p>No employees on leave</p>
      )}
    </div>
  );
};

export default LeaveUI;
