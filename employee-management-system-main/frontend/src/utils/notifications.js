/**
 * Utility functions for browser notifications
 */

// Check if browser notifications are supported and request permission if needed
export const requestNotificationPermission = async () => {
  // Check if the browser supports notifications
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  // Check if we already have permission
  if (Notification.permission === 'granted') {
    return true;
  }

  // Otherwise, request permission
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

// Send a browser notification
export const sendNotification = (title, options = {}) => {
  // Don't proceed if notifications aren't supported
  if (!('Notification' in window)) {
    return false;
  }

  // Don't proceed if we don't have permission
  if (Notification.permission !== 'granted') {
    return false;
  }

  // Set default options
  const defaultOptions = {
    icon: '/logo192.png', // Replace with your app's icon
    badge: '/logo192.png',
    silent: false,
    requireInteraction: false
  };

  // Merge options
  const mergedOptions = { ...defaultOptions, ...options };

  // Create and show notification
  try {
    const notification = new Notification(title, mergedOptions);
    
    // Optional: Handle notification click
    notification.onclick = function(event) {
      event.preventDefault();
      if (options.onClick) {
        options.onClick(event);
      } else {
        window.focus();
      }
    };

    return true;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
};

// Send a task completion request notification
export const sendTaskCompletionRequestNotification = (task) => {
  const title = 'Task Completion Request';
  const options = {
    body: `${task.assignedTo?.name || 'An employee'} has requested completion approval for task: ${task.title}`,
    requireInteraction: true,
    onClick: () => {
      // Navigate to the task management page
      window.location.href = '/task-management';
    }
  };
  
  return sendNotification(title, options);
};

// Send a task completion review notification
export const sendTaskCompletionReviewNotification = (task, isApproved) => {
  const title = `Task ${isApproved ? 'Approved' : 'Rejected'}`;
  const options = {
    body: `Your completion request for task "${task.title}" has been ${isApproved ? 'approved' : 'rejected'}.`,
    requireInteraction: true,
    onClick: () => {
      // Navigate to the user's tasks page
      window.location.href = '/profile';
    }
  };
  
  return sendNotification(title, options);
}; 