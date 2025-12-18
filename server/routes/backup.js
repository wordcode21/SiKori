const express = require('express');
const router = express.Router();
const { sequelize, User, Student, Activity, SummativeAspect, FormativeItem, Assessment } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

// Helper to format date for filename
const getTimestamp = () => new Date().toISOString().replace(/[:.]/g, '-');

// EXPORT BACKUP
// Ping route for health check
router.get('/ping', (req, res) => { console.log('Backup ping received'); res.json({ message: 'Backup API is alive' }); });

// Reusable backup export logic
const exportBackup = async (req, res) => {
    try {
        const users = await User.findAll();
        const students = await Student.findAll();
        const activities = await Activity.findAll();
        const summativeAspects = await SummativeAspect.findAll();
        const formativeItems = await FormativeItem.findAll();
        const assessments = await Assessment.findAll();

        const data = {
            metadata: {
                version: '1.0',
                timestamp: new Date(),
                exportedBy: req.user ? req.user.username : 'public'
            },
            data: { users, students, activities, summativeAspects, formativeItems, assessments }
        };

        console.log('Backup export initiated by', req.user ? req.user.username : 'public');
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="sikori_backup_${getTimestamp()}.json"`);
        res.json(data);
    } catch (e) {
        console.error('Backup export error:', e);
        res.status(500).json({ error: e.message });
    }
};

router.get('/', authenticate, authorize(['SUPER_ADMIN']), exportBackup);
router.get('/public', exportBackup); // Public route for backup without auth





// RESTORE BACKUP
router.post('/restore', authenticate, authorize(['SUPER_ADMIN']), async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { data } = req.body;

        if (!data || !data.users || !data.students) {
            return res.status(400).json({ error: 'Invalid backup file format' });
        }

        // 1. Disable Foreign Key Checks
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { transaction });

        // 2. Clear all tables safely (DELETE instead of TRUNCATE to respect transaction)
        await Assessment.destroy({ where: {}, transaction });
        await FormativeItem.destroy({ where: {}, transaction });
        await SummativeAspect.destroy({ where: {}, transaction });
        await Activity.destroy({ where: {}, transaction });
        await Student.destroy({ where: {}, transaction });
        await User.destroy({ where: {}, transaction });

        // 3. Insert Data (Users first if possible, but FK check disabled so order is flexible)
        // Using User.bulkCreate instead of generic insert to handle model-specific logic if any (though restore usually raw data)
        if (data.users?.length) await User.bulkCreate(data.users, { transaction });
        if (data.students?.length) await Student.bulkCreate(data.students, { transaction });
        if (data.activities?.length) await Activity.bulkCreate(data.activities, { transaction });
        if (data.summativeAspects?.length) await SummativeAspect.bulkCreate(data.summativeAspects, { transaction });
        if (data.formativeItems?.length) await FormativeItem.bulkCreate(data.formativeItems, { transaction });
        if (data.assessments?.length) await Assessment.bulkCreate(data.assessments, { transaction });

        // 4. Re-enable Foreign Key Checks
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { transaction });

        await transaction.commit();
        res.json({ message: 'Database restored successfully' });
    } catch (e) {
        await transaction.rollback();
        // Always try to re-enable FK checks if failed mid-way
        try { await sequelize.query('SET FOREIGN_KEY_CHECKS = 1'); } catch (err) { console.error('Failed to re-enable FK:', err); }
        res.status(500).json({ error: 'Restore failed: ' + e.message });
    }
});

module.exports = router;
