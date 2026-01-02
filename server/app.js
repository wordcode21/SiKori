const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const { authenticate } = require('./middleware/auth');

const app = express();

app.use(cors({ exposedHeaders: ['Content-Disposition'] }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/backup', require('./routes/backup'));
app.use('/api', authenticate, apiRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'Kokurikuler API Ready', status: 'Running' });
});

module.exports = app;
