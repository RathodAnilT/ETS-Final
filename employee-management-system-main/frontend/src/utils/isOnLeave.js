const isOnLeave = (D1, D3) => {
  if (!D1 || !D3) return { isOnLeave: false, startDate: null, endDate: null };
  
  D3 = new Date(D3);
  let isOnLeave = false;
  let startDate = Date.now();
  let endDate = Date.now();
  
  for (const d in D1) {
    if (!D1[d] || !D1[d].startDate || !D1[d].leaveDate) continue;
    
    startDate = new Date(D1[d].startDate);
    endDate = new Date(D1[d].leaveDate);
    
    if (
      D3.getTime() <= endDate.getTime() &&
      D3.getTime() >= startDate.getTime()
    ) {
      isOnLeave = true;
      break;
    }
  }
  return { isOnLeave, startDate, endDate };
};

const userOnLeave = (employee) => {
  if (!employee || !Array.isArray(employee)) return [];
  
  const currentDate = new Date();
  return employee.filter(emp => {
    if (!emp || !emp.leaveDate) return false;
    const leaveStatus = isOnLeave(emp.leaveDate, currentDate);
    return leaveStatus.isOnLeave;
  });
};

export default userOnLeave;
