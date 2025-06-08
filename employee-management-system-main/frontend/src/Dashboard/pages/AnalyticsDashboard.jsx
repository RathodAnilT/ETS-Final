import React, { useState, useEffect, useContext } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Grid, Paper, Typography, Box, CircularProgress, Alert, Button, ButtonGroup, Container } from '@mui/material';
import axios from 'axios';
import userContext from '../../context/userContext';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { FaFilePdf, FaFileExcel } from 'react-icons/fa';
import ExcelJS from 'exceljs/dist/exceljs.min.js';

const localizer = momentLocalizer(moment);
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const AnalyticsDashboard = () => {
  const [taskData, setTaskData] = useState([]);
  const [leaveData, setLeaveData] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);
  const authUser = useContext(userContext);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!authUser.isLoggedIn || !authUser.token) {
        setError('Please log in to view analytics');
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/api/users/${authUser.userId}`,
          {
            headers: {
              'Authorization': `Bearer ${authUser.token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.data && response.data.user) {
          setUserData(response.data.user);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Failed to load user data');
      }
    };

    fetchUserData();
  }, [authUser.isLoggedIn, authUser.token, authUser.userId]);

  useEffect(() => {
    const fetchData = async () => {
      if (!authUser.isLoggedIn || !authUser.token) {
        setError('Please log in to view analytics');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const config = {
          headers: {
            'Authorization': `Bearer ${authUser.token}`,
            'Content-Type': 'application/json'
          }
        };

        // Fetch tasks for the specific user
        const tasksResponse = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/tasks/assigned-to/${authUser.userId}`, config);
        const tasks = tasksResponse.data.tasks || [];
        
        // Process tasks data with employee names
        const taskStatusCount = tasks.reduce((acc, task) => {
          const status = task.status ? task.status.toLowerCase() : 'unknown';
          if (!acc[status]) {
            acc[status] = {
              count: 0,
              tasks: []
            };
          }
          acc[status].count += 1;
          acc[status].tasks.push({
            title: task.title,
            assignedTo: task.assignedTo?.name || 'Unassigned',
            assignedBy: task.createdBy?.name || 'Unknown',
            approver: task.approvedBy?.name || 'Not Approved',
            dueDate: task.dueDate,
            status: task.status
          });
          return acc;
        }, {});

        const taskData = Object.entries(taskStatusCount).map(([name, data]) => ({
          name,
          value: data.count,
          tasks: data.tasks
        }));
        setTaskData(taskData);

        // Fetch leaves for the specific user
        const leavesResponse = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/api/leaves/user/${authUser.userId}`,
          {
            headers: {
              'Authorization': `Bearer ${authUser.token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        const leaves = leavesResponse.data.leaveData || [];
        
        // Process leaves data with employee names
        const leaveTypeCount = leaves.reduce((acc, leave) => {
          const type = leave.type ? leave.type.toLowerCase() : 'unknown';
          if (!acc[type]) {
            acc[type] = {
              count: 0,
              leaves: []
            };
          }
          acc[type].count += 1;
          acc[type].leaves.push({
            type: leave.type,
            employeeName: leave.employee?.name || userData?.name || 'Unknown',
            approver: leave.approvedBy?.name || 'Not Approved',
            startDate: leave.startDate,
            endDate: leave.endDate,
            status: leave.status
          });
          return acc;
        }, {});

        const leaveData = Object.entries(leaveTypeCount).map(([name, data]) => ({
          name,
          value: data.count,
          leaves: data.leaves
        }));
        setLeaveData(leaveData);

        // Create calendar events from tasks and leaves with employee names
        const events = [
          ...tasks.map(task => ({
            title: `Task: ${task.title} (Assigned to: ${task.assignedTo?.name || 'Unassigned'})`,
            start: new Date(task.dueDate || task.createdAt),
            end: new Date(task.dueDate || task.updatedAt),
            type: 'task',
            status: task.status,
            assignedBy: task.createdBy?.name || 'Unknown',
            approver: task.approvedBy?.name || 'Not Approved'
          })),
          ...leaves.map(leave => ({
            title: `Leave: ${leave.type} (${leave.employee?.name || userData?.name || 'Unknown'})`,
            start: new Date(leave.startDate || leave.createdAt),
            end: new Date(leave.endDate || leave.updatedAt),
            type: 'leave',
            status: leave.status,
            approver: leave.approvedBy?.name || 'Not Approved'
          }))
        ];
        setCalendarEvents(events);

        // For now, keep sample attendance data since it's not implemented yet
        const sampleAttendance = [];
        const today = new Date();
        for (let i = 0; i < 30; i++) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          sampleAttendance.push({
            date: date.toISOString().split('T')[0],
            present: Math.floor(Math.random() * 20) + 15,
            absent: Math.floor(Math.random() * 5) + 1
          });
        }
        setAttendanceData(sampleAttendance);

      } catch (error) {
        console.error('Error fetching analytics data:', error);
        setError(error.response?.data?.message || 'Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    if (userData) {
      fetchData();
    }
  }, [authUser.isLoggedIn, authUser.token, authUser.userId, userData]);

  const eventStyleGetter = (event) => {
    let backgroundColor = '#3174ad';
    if (event.type === 'leave') {
      backgroundColor = event.status === 'approved' ? '#00C49F' : '#FFBB28';
    } else if (event.type === 'task') {
      backgroundColor = event.status === 'completed' ? '#00C49F' : 
                       event.status === 'in-progress' ? '#FFBB28' : '#FF8042';
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '3px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Add title and employee info
    doc.setFontSize(20);
    doc.text('Analytics Report', 14, 15);
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 25);
    doc.text(`Employee: ${userData?.name || 'Unknown'}`, 14, 35);
    doc.text(`Position: ${userData?.position || 'Not specified'}`, 14, 45);
    doc.text(`Department: ${userData?.department || 'Not specified'}`, 14, 55);
    
    // Task Status Distribution
    doc.setFontSize(16);
    doc.text('Task Status Distribution', 14, 70);
    doc.setFontSize(12);
    
    const taskTableData = taskData.flatMap(status => 
      status.tasks.map(task => [
        task.title,
        task.assignedTo,
        task.assignedBy,
        task.approver,
        task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A',
        task.status
      ])
    );
    
    autoTable(doc, {
      startY: 75,
      head: [['Task Title', 'Assigned To', 'Assigned By', 'Approved By', 'Due Date', 'Status']],
      body: taskTableData,
      theme: 'grid'
    });
    
    // Leave Type Distribution
    doc.setFontSize(16);
    doc.text('Leave Type Distribution', 14, doc.lastAutoTable.finalY + 20);
    doc.setFontSize(12);
    
    const leaveTableData = leaveData.flatMap(type => 
      type.leaves.map(leave => [
        leave.type,
        leave.employeeName,
        leave.approver,
        new Date(leave.startDate).toLocaleDateString(),
        new Date(leave.endDate).toLocaleDateString(),
        leave.status
      ])
    );
    
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 25,
      head: [['Leave Type', 'Employee', 'Approved By', 'Start Date', 'End Date', 'Status']],
      body: leaveTableData,
      theme: 'grid'
    });
    
    // Calendar Events
    doc.setFontSize(16);
    doc.text('Calendar Events', 14, doc.lastAutoTable.finalY + 20);
    doc.setFontSize(12);
    
    const calendarTableData = calendarEvents.map(event => [
      event.title,
      event.type === 'task' ? event.assignedBy : 'N/A',
      event.approver,
      new Date(event.start).toLocaleDateString(),
      new Date(event.end).toLocaleDateString(),
      event.type,
      event.status
    ]);
    
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 25,
      head: [['Event', 'Assigned By', 'Approved By', 'Start Date', 'End Date', 'Type', 'Status']],
      body: calendarTableData,
      theme: 'grid'
    });
    
    doc.save(`analytics-report-${userData?.name || 'employee'}.pdf`);
  };

  const exportToExcel = () => {
    const workbook = new ExcelJS.Workbook();
    
    // Add employee info to the first sheet
    const infoSheet = workbook.addWorksheet('Report Info');
    infoSheet.columns = [
      { header: 'Field', key: 'field', width: 20 },
      { header: 'Value', key: 'value', width: 30 }
    ];
    infoSheet.addRow({ field: 'Employee Name', value: userData?.name || 'Unknown' });
    infoSheet.addRow({ field: 'Position', value: userData?.position || 'Not specified' });
    infoSheet.addRow({ field: 'Department', value: userData?.department || 'Not specified' });
    infoSheet.addRow({ field: 'Report Generated On', value: new Date().toLocaleDateString() });
    
    // Task Status Sheet
    const taskSheet = workbook.addWorksheet('Task Status');
    taskSheet.columns = [
      { header: 'Task Title', key: 'title', width: 30 },
      { header: 'Assigned To', key: 'assignedTo', width: 20 },
      { header: 'Assigned By', key: 'assignedBy', width: 20 },
      { header: 'Approved By', key: 'approver', width: 20 },
      { header: 'Due Date', key: 'dueDate', width: 15 },
      { header: 'Status', key: 'status', width: 15 }
    ];
    
    taskData.forEach(status => {
      status.tasks.forEach(task => {
        taskSheet.addRow({
          title: task.title,
          assignedTo: task.assignedTo,
          assignedBy: task.assignedBy,
          approver: task.approver,
          dueDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A',
          status: task.status
        });
      });
    });
    
    // Leave Type Sheet
    const leaveSheet = workbook.addWorksheet('Leave Types');
    leaveSheet.columns = [
      { header: 'Leave Type', key: 'type', width: 20 },
      { header: 'Employee', key: 'employeeName', width: 20 },
      { header: 'Approved By', key: 'approver', width: 20 },
      { header: 'Start Date', key: 'startDate', width: 15 },
      { header: 'End Date', key: 'endDate', width: 15 },
      { header: 'Status', key: 'status', width: 15 }
    ];
    
    leaveData.forEach(type => {
      type.leaves.forEach(leave => {
        leaveSheet.addRow({
          type: leave.type,
          employeeName: leave.employeeName,
          approver: leave.approver,
          startDate: new Date(leave.startDate).toLocaleDateString(),
          endDate: new Date(leave.endDate).toLocaleDateString(),
          status: leave.status
        });
      });
    });
    
    // Calendar Events Sheet
    const calendarSheet = workbook.addWorksheet('Calendar Events');
    calendarSheet.columns = [
      { header: 'Event', key: 'title', width: 40 },
      { header: 'Assigned By', key: 'assignedBy', width: 20 },
      { header: 'Approved By', key: 'approver', width: 20 },
      { header: 'Start Date', key: 'start', width: 15 },
      { header: 'End Date', key: 'end', width: 15 },
      { header: 'Type', key: 'type', width: 15 },
      { header: 'Status', key: 'status', width: 15 }
    ];
    
    calendarEvents.forEach(event => {
      calendarSheet.addRow({
        title: event.title,
        assignedBy: event.type === 'task' ? event.assignedBy : 'N/A',
        approver: event.approver,
        start: new Date(event.start).toLocaleDateString(),
        end: new Date(event.end).toLocaleDateString(),
        type: event.type,
        status: event.status
      });
    });
    
    workbook.xlsx.writeBuffer().then(buffer => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-report-${userData?.name || 'employee'}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        backgroundColor: 'white',
        p: 2,
        borderRadius: 1,
        boxShadow: 1
      }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
          My Analytics Dashboard
        </Typography>
        <ButtonGroup variant="contained" aria-label="export buttons">
          <Button 
            startIcon={<FaFilePdf />}
            onClick={exportToPDF}
            sx={{ 
              backgroundColor: '#dc3545',
              '&:hover': { backgroundColor: '#c82333' },
              px: 3
            }}
          >
            Export PDF
          </Button>
          <Button 
            startIcon={<FaFileExcel />}
            onClick={exportToExcel}
            sx={{ 
              backgroundColor: '#28a745',
              '&:hover': { backgroundColor: '#218838' },
              px: 3
            }}
          >
            Export Excel
          </Button>
        </ButtonGroup>
      </Box>
      
      <Grid container spacing={3}>
        {/* Tasks Completed Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%', boxShadow: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50', fontWeight: 'bold' }}>
              My Tasks Status Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={taskData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Leaves Taken Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%', boxShadow: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50', fontWeight: 'bold' }}>
              My Leave Types Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={leaveData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {leaveData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Calendar View */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, height: '600px', boxShadow: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50', fontWeight: 'bold' }}>
              My Tasks & Leaves Calendar
            </Typography>
            <div style={{ height: '500px' }}>
              <Calendar
                localizer={localizer}
                events={calendarEvents}
                startAccessor="start"
                endAccessor="end"
                eventPropGetter={eventStyleGetter}
                style={{ height: '100%' }}
                views={['month', 'week', 'day']}
                defaultView="month"
                popup
                selectable
              />
            </div>
          </Paper>
        </Grid>

        {/* Attendance Trend Chart */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, boxShadow: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50', fontWeight: 'bold' }}>
              My Attendance Trend (Sample Data)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="present" stroke="#8884d8" />
                <Line type="monotone" dataKey="absent" stroke="#ff7300" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AnalyticsDashboard; 