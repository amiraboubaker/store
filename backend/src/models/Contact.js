const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('Contact', {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
        name: { type: DataTypes.STRING(100), allowNull: false },
        email: { type: DataTypes.STRING(100), allowNull: false, validate: { isEmail: true } },
        subject: { type: DataTypes.STRING(200), allowNull: true },
        message: { type: DataTypes.TEXT, allowNull: false },
    }, { timestamps: true });
};
