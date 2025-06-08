const express = require('express');
const app = express();
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const userRoutes = require('./routes/user-routes');
const HttpError = require('./models/http-error');
const path = require('path');

dotenv.config();

// Middleware
app.use(express.json());
app.use('/uploads/images', express.static(path.join('uploads', 'images')));

// CORS Headers
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, PUT');
  next();
});

// Routes
app.use('/api/users', userRoutes);

// Handle unsupported routes
app.use((req, res, next) => {
  const error = new HttpError('Could not find this route.', 404);
  throw error;
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (req.file) {
    fs.unlink(req.file.path, (err) => {
      console.log(err);
    });
  }
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || 'An unknown error occurred!' });
});

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    app.listen(process.env.PORT || 5001, () => {
      console.log(`Server Running on port ${process.env.PORT || 5001}`);
    });
  })
  .catch((err) => {
    console.log(err);
  }); 