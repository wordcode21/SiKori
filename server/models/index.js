const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User'); // Import User model

const Student = sequelize.define('Student', {
    nisn: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
    },
    nis: {
        type: DataTypes.STRING,
        allowNull: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    class: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

const Activity = sequelize.define('Activity', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    targetClasses: {
        type: DataTypes.JSON, // Stores array of class names e.g. ["X-A", "XI-B"]
        allowNull: true
    }
});

const SummativeAspect = sequelize.define('SummativeAspect', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    dimension: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

const FormativeItem = sequelize.define('FormativeItem', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

const Assessment = sequelize.define('Assessment', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    type: {
        type: DataTypes.ENUM('SUMMATIVE', 'FORMATIVE', 'NOTE'),
        allowNull: false
    },
    score: {
        type: DataTypes.STRING,
        allowNull: true // For Summative (SB, B, etc.)
    },
    checked: {
        type: DataTypes.BOOLEAN,
        allowNull: true // For Formative
    },
    note: {
        type: DataTypes.TEXT,
        allowNull: true // For Formative Notes
    }
});

// Relationships
Activity.hasMany(SummativeAspect, { onDelete: 'CASCADE' });
SummativeAspect.belongsTo(Activity);

Activity.hasMany(FormativeItem, { onDelete: 'CASCADE' });
FormativeItem.belongsTo(Activity);

// Assessment Links
Student.hasMany(Assessment, { foreignKey: 'studentNisn' });
Assessment.belongsTo(Student, { foreignKey: 'studentNisn' });

Activity.hasMany(Assessment);
Assessment.belongsTo(Activity);

SummativeAspect.hasMany(Assessment, { foreignKey: 'aspectId' });
Assessment.belongsTo(SummativeAspect, { foreignKey: 'aspectId' });

FormativeItem.hasMany(Assessment, { foreignKey: 'itemId' });
Assessment.belongsTo(FormativeItem, { foreignKey: 'itemId' });

module.exports = {
    sequelize,
    Student,
    Activity,
    SummativeAspect,
    FormativeItem,
    Assessment,
    User
};
