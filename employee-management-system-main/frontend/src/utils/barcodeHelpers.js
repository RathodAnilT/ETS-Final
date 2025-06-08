/**
 * Validates if a string is a properly formatted employee ID
 * Format: EMP-YYYY-NNNN where YYYY is the year and NNNN is a sequential number
 * 
 * @param {string} employeeId - The employee ID to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const isValidEmployeeId = (employeeId) => {
  return /^EMP-\d{4}-\d{4}$/.test(employeeId);
};

/**
 * Generates a unique employee ID based on year and a sequential number
 * 
 * @param {Array} existingIds - Array of existing employee IDs
 * @returns {string} - A new unique employee ID
 */
export const generateEmployeeId = (existingIds = []) => {
  // Format: EMP-YEAR-SEQUENTIAL NUMBER (e.g., EMP-2023-0001)
  const currentYear = new Date().getFullYear();
  
  // Find the highest sequential number in existing IDs for this year
  const yearPrefix = `EMP-${currentYear}-`;
  const thisYearIds = existingIds.filter(id => id && id.startsWith(yearPrefix));
  
  let highestSeq = 0;
  thisYearIds.forEach(id => {
    const seqStr = id.substring(yearPrefix.length);
    const seq = parseInt(seqStr, 10);
    if (!isNaN(seq) && seq > highestSeq) {
      highestSeq = seq;
    }
  });
  
  // Create new ID with sequence incremented by 1
  const newSeq = highestSeq + 1;
  const paddedSeq = newSeq.toString().padStart(4, '0');
  
  return `${yearPrefix}${paddedSeq}`;
};

/**
 * Creates a print window for the barcode
 * 
 * @param {string} elementId - ID of the HTML element containing the barcode
 */
export const printBarcode = (elementId) => {
  const printContent = document.getElementById(elementId);
  if (!printContent) return;
  
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
 