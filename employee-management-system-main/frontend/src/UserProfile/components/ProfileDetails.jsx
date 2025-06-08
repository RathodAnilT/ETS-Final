import React from "react";
import CardUI from "../../UI/CardUI";
import { ListGroup, Button } from "react-bootstrap";
import { Spin } from "antd";
import ChartUI from "../../UI/ChartUI";
import "../pages/Profile.css";
import getIcon from "../../utils/getIcon";
import EmployeeBarcode from "../../User/components/EmployeeBarcode";
import AssignedTasks from "./AssignedTasks";

const ListGroupItem = (props) => {
  return (
    <ListGroup.Item>
      <span className="d-flex justify-content-between align-items-start">
        <span className="fw-bold">{props.title}</span>
        <span>{props.value}</span>
      </span>
    </ListGroup.Item>
  );
};

const ProfileDetails = (props) => {
  const handlePrintBarcode = () => {
    const printContent = document.getElementById('barcode-section');
    const windowUrl = 'about:blank';
    const uniqueName = new Date().getTime();
    const windowName = 'Print' + uniqueName;
    const printWindow = window.open(windowUrl, windowName, 'left=0,top=0,width=800,height=600,toolbar=0,scrollbars=0,status=0');
    
    printWindow.document.write('<html><head><title>Employee ID Card</title>');
    printWindow.document.write('<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">');
    printWindow.document.write('<style>.barcode-card{width:350px; margin:20px auto; border:1px solid #ddd; padding:15px; box-shadow:0 2px 10px rgba(0,0,0,0.1); border-radius:8px;}</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write(printContent.innerHTML);
    printWindow.document.write('</body></html>');
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  return props.user ? (
    <>
      <CardUI width="100%" className="mb-4">
        <h3 className="text-center mb-4 profile-detail-heading">
          {getIcon("user")}
          Personal Details
        </h3>
        <ListGroup variant="flush" className="container px-lg-5 py-lg-2">
          <ListGroupItem value={props.user.name} title="Full Name" />
          <ListGroupItem value={props.user.position} title="Position" />
          <ListGroupItem
            value={props.user.dateOfBirth.split("T")[0]}
            title="Date Of Birth"
          />
          <ListGroupItem value={props.user.address} title="Address" />
          <ListGroupItem value={props.user.aadhar} title="Aadhar No" />
          <ListGroupItem value={props.user.panNo} title="Pan No" />
          <ListGroupItem value={props.user.employeeId} title="Employee ID" />
        </ListGroup>
        {props.user.leaveDate && <ChartUI leaves={props.user.leaveDate} />}
      </CardUI>
      
      <AssignedTasks userId={props.user._id} />
      
      <CardUI width="100%" className="mt-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3 className="profile-detail-heading mb-0">
            {getIcon("barcode")}
            Employee ID Card
          </h3>
          <Button 
            variant="outline-primary"
            size="sm"
            onClick={handlePrintBarcode}
            className="no-print"
          >
            {getIcon("print")} Print ID Card
          </Button>
        </div>
        
        <div id="barcode-section" className="d-flex justify-content-center">
          <EmployeeBarcode 
            employeeId={props.user.employeeId}
            name={props.user.name}
            department={props.user.department}
            position={props.user.position}
          />
        </div>
      </CardUI>
    </>
  ) : (
    <Spin />
  );
};

export default ProfileDetails;
