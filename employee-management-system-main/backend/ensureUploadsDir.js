const fs = require('fs');
const path = require('path');

const uploadsDir = path.join(__dirname, 'uploads', 'images');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Uploads directory created successfully');
} 