const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Payment = sequelize.define(
        'Payment',
        {
            id: {
                type: DataTypes.BIGINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true
            },
            orderId: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: false
            },
            amount: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
                validate: {
                    min: 0
                }
            },
            currency: {
                type: DataTypes.STRING(3),
                allowNull: false,
                defaultValue: 'USD'
            },
            provider: {
                type: DataTypes.STRING(50),
                allowNull: false,
                defaultValue: 'stripe'
            },
            providerPaymentId: {
                type: DataTypes.STRING(255),
                allowNull: true
            },
            status: {
                type: DataTypes.STRING(20),
                allowNull: false,
                defaultValue: 'pending',
                validate: {
                    isIn: [['pending', 'succeeded', 'failed', 'canceled']]
                }
            },
            errorMessage: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            paidAt: {
                type: DataTypes.DATE,
                allowNull: true
            },
            failedAt: {
                type: DataTypes.DATE,
                allowNull: true
            },
            metadata: {
                type: DataTypes.JSON,
                allowNull: true,
                defaultValue: {}
            }
        },
        {
            timestamps: true,
            indexes: [
                { fields: ['orderId'] },
                { fields: ['status'] },
                { fields: ['providerPaymentId'] }
            ]
        }
    );

    Payment.associate = (models) => {
        Payment.belongsTo(models.Order, {
            foreignKey: 'orderId',
            as: 'order',
            onDelete: 'CASCADE'
        });
    };

    return Payment;
};
