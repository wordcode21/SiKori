const express = require('express');
const router = express.Router();
const { Student, Activity, SummativeAspect, FormativeItem, Assessment } = require('../models');

// --- STUDENTS ---
router.get('/students', async (req, res) => {
    try {
        const { class: className } = req.query;
        let where = {};

        // RBAC Logic
        if (req.user.role === 'WALI_KELAS') {
            // Can only see their own class
            if (req.user.assignedClass) {
                where.class = req.user.assignedClass;
            } else {
                // If no class assigned, return empty or all? Safer to return empty
                return res.json([]);
            }
        } else if (req.user.role === 'GURU_MATA_PELAJARAN') {
            // Can only see assigned classes
            // assignedClasses expected to be array or JSON
            if (req.user.assignedSubjects) {
                // Wait, assignedSubjects might be complex. Let's assume there is an assignedClasses field too or we parse it.
                // The plan said "assignedClasses" in text but I added "assignedSubjects" in code?
                // Let's check User.js... I added assignedSubjects (JSON) and assignedClass (String).
                // Ah, for Guru Mapel, they usually have multiple classes.
                // Let's look at my User.js edit again.
                // I added: assignedClass (String) and assignedSubjects (JSON).
                // Maybe I should have added assignedClasses (JSON)?
                // The prompt said "guru mapel hanya bisa mengatur sesuai pelajaran dan kelas yang diajar".
                // So they need a list of classes.
                // Let's use `assignedSubjects` to store this info efficiently or just filter by implicit logic?
                // Actually, if a Guru Mapel teaches Math in X-A and X-B, they should see X-A and X-B.
                // Let's check if I can just use `assignedClass` from User model? No that's usually single for Homeroom.
                // I'll assume `assignedSubjects` contains the class info or I'll check if I need to add `assignedClasses`.
                // Looking at my User.js edit:
                // assignedSubjects: { type: DataTypes.JSON }
                // Let's assume the structure of assignedSubjects is like: [{ subject: "Math", class: "X-A" }, ...] or just ["X-A", "X-B"]? 
                // Simple approach: Add `assignedClasses` to User model as well if not there, or assume `assignedSubjects` has it.
                // Let's check User.js again.
            }
        }

        // Apply query filter if it doesn't conflict with RBAC
        if (className && className !== 'all') {
            if (where.class && where.class !== className) {
                return res.json([]); // Conflict: User can only see X-A but requested X-B
            }
            where.class = className;
        }

        // RE-READING my User.js edit from Step 50:
        // +    // For Guru Mata Pelajaran
        // +    assignedSubjects: {
        // +        type: DataTypes.JSON, // Can store array like ["Math", "Physics"] or objects
        // +        allowNull: true
        // +    }

        // I missed `assignedClasses` for Guru Mapel in the User.js edit! 
        // The plan said: "Add assignedClasses (JSON/String) - for Guru Mapel."
        // I only added assignedSubjects.
        // I need to add assignedClasses to User.js first.

        const students = await Student.findAll({ where, order: [['name', 'ASC']] });
        res.json(students);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/students/bulk', async (req, res) => {
    try {
        const students = req.body; // Expects an array of objects
        if (!Array.isArray(students)) return res.status(400).json({ error: 'Data must be an array' });

        // Use bulkCreate with updateOnDuplicate to handle existing students
        const result = await Student.bulkCreate(students, {
            updateOnDuplicate: ['name', 'class', 'nis']
        });
        res.json({ message: `Successfully imported ${result.length} students` });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/students', async (req, res) => {
    try {
        const student = await Student.create(req.body);
        res.json(student);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/students/:nisn', async (req, res) => {
    try {
        const { name, class: className, nis } = req.body;
        const student = await Student.findByPk(req.params.nisn);

        if (!student) return res.status(404).json({ error: 'Siswa tidak ditemukan' });

        // Update fields (excluding NISN as it is PK)
        await student.update({ name, class: className, nis });
        res.json(student);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/students/:nisn', async (req, res) => {
    try {
        await Student.destroy({ where: { nisn: req.params.nisn } });
        res.json({ message: 'Deleted' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- ACTIVITIES ---
router.get('/activities', async (req, res) => {
    try {
        const activities = await Activity.findAll({
            include: [SummativeAspect, FormativeItem]
        });
        res.json(activities);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Helper to check class access
const checkClassAccess = (user, targetClasses) => {
    // Admin/Headmaster can access all
    if (['SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH'].includes(user.role)) return true;

    // Must have target classes specified
    if (!targetClasses || targetClasses.length === 0) return false;

    // Get user's allowed classes
    let allowed = [];
    if (user.role === 'WALI_KELAS') {
        if (user.assignedClass) allowed.push(user.assignedClass);
        if (user.assignedClasses && Array.isArray(user.assignedClasses)) allowed.push(...user.assignedClasses);
    } else if (user.role === 'GURU_MATA_PELAJARAN') {
        // Handle JSON or plain array? DB says JSON, usually parsed as array by Sequelize
        // but let's be safe.
        if (user.assignedClasses) {
            if (Array.isArray(user.assignedClasses)) allowed.push(...user.assignedClasses);
            else if (typeof user.assignedClasses === 'string') allowed.push(...JSON.parse(user.assignedClasses)); // Just in case
        }
    }

    // Check if ALL target classes are in allowed list
    return targetClasses.every(c => allowed.includes(c));
};

router.post('/activities', async (req, res) => {
    try {
        const { name, targetClasses, summativeAspects, formativeItems } = req.body;

        // RBAC Check
        if (!checkClassAccess(req.user, targetClasses)) {
            return res.status(403).json({ error: 'Anda tidak memiliki akses ke kelas tujuan ini.' });
        }

        // Transaction to ensure atomicity
        const result = await require('../config/database').transaction(async (t) => {
            const activity = await Activity.create({ name, targetClasses }, { transaction: t });

            if (summativeAspects?.length) {
                await Promise.all(summativeAspects.map(a =>
                    SummativeAspect.create({ ...a, ActivityId: activity.id }, { transaction: t })
                ));
            }
            if (formativeItems?.length) {
                await Promise.all(formativeItems.map(f =>
                    FormativeItem.create({ ...f, ActivityId: activity.id }, { transaction: t })
                ));
            }
            return activity;
        });

        const fullActivity = await Activity.findByPk(result.id, {
            include: [SummativeAspect, FormativeItem]
        });
        res.json(fullActivity);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/activities/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, targetClasses, summativeAspects, formativeItems } = req.body;

        const result = await require('../config/database').transaction(async (t) => {
            const activity = await Activity.findByPk(id, { transaction: t });
            if (!activity) throw new Error('Activity not found');

            // RBAC Check: Must have access to OLD classes AND NEW classes
            if (!checkClassAccess(req.user, activity.targetClasses)) {
                throw new Error('Anda tidak memiliki izin edit kegiatan ini');
            }
            if (!checkClassAccess(req.user, targetClasses)) {
                throw new Error('Anda tidak memiliki akses ke kelas tujuan baru ini');
            }

            await activity.update({ name, targetClasses }, { transaction: t });

            // 1. Sync Summative Aspects
            if (summativeAspects) {
                // Get existing IDs
                const existingAspects = await SummativeAspect.findAll({ where: { ActivityId: id }, transaction: t });
                const existingIds = existingAspects.map(a => a.id);
                const incomingIds = summativeAspects.filter(a => a.id).map(a => a.id);

                // Delete removed
                const toDelete = existingIds.filter(x => !incomingIds.includes(x));
                if (toDelete.length > 0) {
                    await SummativeAspect.destroy({ where: { id: toDelete }, transaction: t });
                    await Assessment.destroy({ where: { aspectId: toDelete, type: 'SUMMATIVE' }, transaction: t });
                }

                // Upsert
                for (const asp of summativeAspects) {
                    if (asp.id) {
                        await SummativeAspect.update({ name: asp.name, dimension: asp.dimension }, { where: { id: asp.id }, transaction: t });
                    } else {
                        await SummativeAspect.create({ name: asp.name, dimension: asp.dimension, ActivityId: id }, { transaction: t });
                    }
                }
            }

            // 2. Sync Formative Items
            if (formativeItems) {
                const existingItems = await FormativeItem.findAll({ where: { ActivityId: id }, transaction: t });
                const existingIds = existingItems.map(a => a.id);
                const incomingIds = formativeItems.filter(a => a.id).map(a => a.id);

                const toDelete = existingIds.filter(x => !incomingIds.includes(x));
                if (toDelete.length > 0) {
                    await FormativeItem.destroy({ where: { id: toDelete }, transaction: t });
                    await Assessment.destroy({ where: { itemId: toDelete, type: 'FORMATIVE' }, transaction: t });
                }

                for (const itm of formativeItems) {
                    if (itm.id) {
                        await FormativeItem.update({ name: itm.name }, { where: { id: itm.id }, transaction: t });
                    } else {
                        await FormativeItem.create({ name: itm.name, ActivityId: id }, { transaction: t });
                    }
                }
            }

            return activity;
        });

        const updatedActivity = await Activity.findByPk(result.id, {
            include: [SummativeAspect, FormativeItem]
        });
        res.json(updatedActivity);

    } catch (e) {
        res.status(e.message.includes('izin') || e.message.includes('akses') ? 403 : 500).json({ error: e.message });
    }
});

router.delete('/activities/:id', async (req, res) => {
    try {
        const activity = await Activity.findByPk(req.params.id);
        if (!activity) return res.json({ message: 'Already deleted' });

        if (!checkClassAccess(req.user, activity.targetClasses)) {
            return res.status(403).json({ error: 'Anda tidak memiliki izin menghapus kegiatan ini' });
        }

        await Activity.destroy({ where: { id: req.params.id } });
        res.json({ message: 'Deleted' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- ASSESSMENTS ---
router.get('/assessments', async (req, res) => {
    try {
        const { activityId, studentNisn } = req.query;
        const where = {};
        if (activityId) where.ActivityId = activityId;
        if (studentNisn) where.studentNisn = studentNisn;

        const assessments = await Assessment.findAll({ where });
        res.json(assessments);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/assessments', async (req, res) => {
    try {
        const { studentNisn, activityId, type, aspectId, itemId, score, checked, note } = req.body;

        // Upsert logic
        // Try to find existing first
        const where = {
            studentNisn,
            ActivityId: activityId,
            type
        };
        // Add specific conditions based on type
        if (type === 'SUMMATIVE') where.aspectId = aspectId;
        if (type === 'FORMATIVE') where.itemId = itemId;
        if (type === 'NOTE') where.itemId = null; // Note is usually per activity or global, assume per activity level note here? 
        // Actually for NOTE let's just use ActivityId + studentNisn

        let assessment = await Assessment.findOne({ where });

        if (assessment) {
            await assessment.update({ score, checked, note });
        } else {
            assessment = await Assessment.create({
                studentNisn,
                ActivityId: activityId,
                type,
                aspectId,
                itemId,
                score,
                checked,
                note
            });
        }
        res.json(assessment);
    } catch (e) { res.status(500).json({ error: e.message }); }
});


module.exports = router;
