const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET ALL USERS (Super Admin only)
router.get('/', authenticate, authorize(['SUPER_ADMIN']), async (req, res) => {
    try {
        const users = await User.findAll({ attributes: { exclude: ['password'] } });
        res.json(users);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// CREATE USER (Super Admin only)
router.post('/', authenticate, authorize(['SUPER_ADMIN']), async (req, res) => {
    try {
        const { username, password, fullName, role, nip } = req.body;

        const existing = await User.findOne({ where: { username } });
        if (existing) return res.status(400).json({ error: 'Username sudah digunakan' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            username,
            password: hashedPassword,
            fullName,
            role,
            nip
        });

        res.status(201).json({ message: 'User created', user: { id: newUser.id, username: newUser.username, role: newUser.role } });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// UPDATE USER (Super Admin only)
router.put('/:id', authenticate, authorize(['SUPER_ADMIN']), async (req, res) => {
    try {
        const { password, fullName, role, nip } = req.body;
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (fullName) user.fullName = fullName;
        if (role) user.role = role;
        if (nip) user.nip = nip;

        if (password && password.trim() !== "") {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        }

        await user.save();
        res.json({ message: 'User updated successfully' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// DELETE USER (Super Admin only)
router.delete('/:id', authenticate, authorize(['SUPER_ADMIN']), async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Prevent deleting self? Frontend should handle, but backend safety:
        if (user.id === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself' });

        await user.destroy();
        res.json({ message: 'User deleted successfully' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
