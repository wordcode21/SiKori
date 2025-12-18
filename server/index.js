const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models'); // Import from models/index.js
const apiRoutes = require('./routes/api');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api', apiRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'Kokurikuler API Ready', status: 'Running' });
});

// Seed Super Admin
const seedSuperAdmin = async () => {
    const adminCount = await User.count({ where: { role: 'SUPER_ADMIN' } });
    if (adminCount === 0) {
        console.log('Seeding default Super Admin...');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);
        await User.create({
            username: 'admin',
            password: hashedPassword,
            fullName: 'Super Administrator',
            role: 'SUPER_ADMIN',
            nip: '000000'
        });
        console.log('Super Admin created: admin / password123');
    }
};

// Sync DB and Start Server
const startServer = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected successfully.');

        // Sync models (force: false means don't drop tables if they exist)
        // alter: true tries to update tables to match models
        await sequelize.sync({ alter: true });
        console.log('Database synced.');

        await seedSuperAdmin();

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        console.log('Retrying in 5 seconds...');
        setTimeout(startServer, 5000);
    }
};

startServer();
