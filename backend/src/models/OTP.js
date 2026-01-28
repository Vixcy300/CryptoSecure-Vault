const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OTP = sequelize.define('OTP', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false
    },
    code: {
        type: DataTypes.STRING,
        allowNull: false
    },
    purpose: {
        type: DataTypes.ENUM('login', 'register', '2fa'),
        defaultValue: 'login'
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: false
    },
    verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    attempts: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    metadata: {
        type: DataTypes.JSON, // For storing panic mode flag etc.
        allowNull: true
    }
}, {
    tableName: 'otps',
    timestamps: true
});

module.exports = OTP;
