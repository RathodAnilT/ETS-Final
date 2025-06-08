const laborSharingRoutes = require('./routes/laborSharingRoutes');

// Routes
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/labor-sharing', laborSharingRoutes); 