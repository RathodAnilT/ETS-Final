import React, { useState } from "react";
import { Table, Form, InputGroup } from "react-bootstrap";
import { FaSearch, FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import { Link } from "react-router-dom";
import "./EmpTable.css";

const EmpTable = ({ employee }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");

  // Handle search input
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle column sort
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Get sort icon based on current sort state
  const getSortIcon = (field) => {
    if (sortField !== field) return <FaSort className="sort-icon" />;
    return sortDirection === "asc" ? (
      <FaSortUp className="sort-icon active" />
    ) : (
      <FaSortDown className="sort-icon active" />
    );
  };

  // Filter and sort employees
  const filteredEmployees = employee
    .filter((emp) => {
      return (
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    })
    .sort((a, b) => {
      const direction = sortDirection === "asc" ? 1 : -1;
      
      if (sortField === "name") {
        return a.name.localeCompare(b.name) * direction;
      } else if (sortField === "position") {
        return a.position.localeCompare(b.position) * direction;
      } else if (sortField === "email") {
        return a.email.localeCompare(b.email) * direction;
      }
      return 0;
    });

  return (
    <div className="employee-table-container">
      <div className="table-controls">
        <InputGroup className="search-input">
          <InputGroup.Text>
            <FaSearch />
          </InputGroup.Text>
          <Form.Control
            placeholder="Search employees..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </InputGroup>
      </div>

      <div className="table-responsive">
        <Table className="employee-table">
        <thead>
            <tr>
              <th onClick={() => handleSort("name")}>
                <div className="th-content">
                  Name {getSortIcon("name")}
                </div>
              </th>
              <th onClick={() => handleSort("position")}>
                <div className="th-content">
                  Position {getSortIcon("position")}
                </div>
              </th>
              <th onClick={() => handleSort("email")}>
                <div className="th-content">
                  Email {getSortIcon("email")}
                </div>
              </th>
          </tr>
        </thead>
        <tbody>
            {filteredEmployees.length > 0 ? (
              filteredEmployees.map((emp) => (
                <tr key={emp._id}>
                  <td>
                    <Link to={`/user-profile/${emp._id}`} className="employee-name-link">
                      {emp.name}
                    </Link>
                  </td>
                  <td>{emp.position || "Not specified"}</td>
                <td>{emp.email}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="text-center py-4">
                  {searchTerm ? "No matching employees found" : "No employees available"}
                </td>
              </tr>
            )}
        </tbody>
        </Table>
      </div>
      
      {filteredEmployees.length > 0 && (
        <div className="table-footer">
          Showing {filteredEmployees.length} of {employee.length} employees
        </div>
      )}
    </div>
  );
};

export default EmpTable;
