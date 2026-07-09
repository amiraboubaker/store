const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const AdminActionLog = sequelize.define(
        'AdminActionLog',
        {
            id: {
                type: DataTypes.BIGINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true
            },
            adminId: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: false
            },
            adminEmail: {
                type: DataTypes.STRING(100),
                allowNull: true
            },
            action: {
                type: DataTypes.STRING(50),
                allowNull: false,
                validate: {
                    notEmpty: true
                }
            },
            entity: {
                type: DataTypes.STRING(50),
                allowNull: false,
                validate: {
                    notEmpty: true
                }
            },
            entityId: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            details: {
                type: DataTypes.JSON,
                allowNull: true,
                defaultValue: {}
            },
            ip: {
                type: DataTypes.STRING(45),
                allowNull: true
            }
        },
        {
            timestamps: true,
            indexes: [
                { fields: ['adminId'] },
                { fields: ['action'] },
                { fields: ['entity'] },
                { fields: ['createdAt'] }
            ]
        }
    );

    AdminActionLog.associate = (models) => {
        AdminActionLog.belongsTo(models.User, {
            foreignKey: 'adminId',
            as: 'admin',
            onDelete: 'CASCADE'
        });
    };

    return AdminActionLog;
};
