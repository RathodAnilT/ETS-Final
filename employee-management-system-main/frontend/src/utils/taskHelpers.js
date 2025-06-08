/**
 * Helper functions for task management
 */

/**
 * Generates a unique task ID with format TASK-YYMM-NNNNNN
 * @param {Array} existingTasks - Array of existing tasks to avoid ID collisions
 * @returns {string} A unique task ID
 */
export const generateTaskId = (existingTasks) => {
  // Create a format like TASK-YY-MM-NNNNNN for better uniqueness
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  
  // Find the highest random number used for today's date if any
  let maxRandom = 0;
  const todayPrefix = `TASK-${year}${month}-`;
  
  if (existingTasks && existingTasks.length > 0) {
    existingTasks.forEach(task => {
      if (task.taskId && task.taskId.startsWith(todayPrefix)) {
        const randomPart = task.taskId.substring(todayPrefix.length);
        const randomNum = parseInt(randomPart, 10);
        if (!isNaN(randomNum) && randomNum > maxRandom) {
          maxRandom = randomNum;
        }
      }
    });
  }
  
  // Generate next random number (or start with 1 if none found)
  const nextRandom = (maxRandom + 1).toString().padStart(6, '0');
  return `${todayPrefix}${nextRandom}`;
};

/**
 * Validates if a task ID is in the correct format
 * @param {string} taskId - The task ID to validate
 * @returns {boolean} Whether the task ID is valid
 */
export const isValidTaskId = (taskId) => {
  if (!taskId) return false;
  
  // Check format TASK-YYMM-NNNNNN (where YYMM is year and month, NNNNNN is a sequence number)
  return /^TASK-\d{4}-\d{6}$/i.test(taskId);
};

/**
 * Fixes a task object to ensure it has a valid taskId
 * @param {Object} task - The task object to fix
 * @param {Array} existingTasks - Array of existing tasks (for generating new IDs)
 * @returns {Object} The fixed task object
 */
export const ensureValidTaskId = (task, existingTasks) => {
  if (!task) return null;
  
  // If task has valid ID, return as is
  if (task.taskId && isValidTaskId(task.taskId)) {
    return task;
  }
  
  // Check if the task's id field is actually a valid taskId format
  // This handles cases where tasks were created with id in taskId format
  if (task.id && typeof task.id === 'string' && isValidTaskId(task.id)) {
    console.log(`Using task.id as taskId: ${task.id}`);
    return {
      ...task,
      taskId: task.id
    };
  }
  
  // Generate new ID if missing or invalid
  const newTaskId = generateTaskId(existingTasks);
  console.log(`Generated new task ID: ${newTaskId} for task with MongoDB ID: ${task.id}`);
  
  return {
    ...task,
    taskId: newTaskId
  };
};

/**
 * Creates a print window for the task barcode
 * 
 * @param {string} elementId - ID of the HTML element containing the barcode
 */
export const printTaskBarcode = (elementId) => {
  const printContent = document.getElementById(elementId);
  if (!printContent) return;
  
  const windowUrl = 'about:blank';
  const uniqueName = new Date().getTime();
  const windowName = 'Print' + uniqueName;
  const printWindow = window.open(windowUrl, windowName, 'left=0,top=0,width=800,height=600,toolbar=0,scrollbars=0,status=0');
  
  printWindow.document.write('<html><head><title>Task Barcode</title>');
  printWindow.document.write('<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">');
  printWindow.document.write('<style>.task-barcode-card{width:350px; margin:20px auto; border:1px solid #ddd; padding:15px; box-shadow:0 2px 10px rgba(0,0,0,0.1); border-radius:8px;}</style>');
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
 