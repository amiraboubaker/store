const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Order = sequelize.define(
        'Order',
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            userId: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            status: {
                type: DataTypes.STRING(20),
                allowNull: false,
                defaultValue: 'pending',
                validate: {
                    isIn: [['pending', 'paid', 'shipped', 'canceled']]
                }
            },
            subtotal: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
                validate: {
                    min: 0
                }
            },
            tax: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: true,
                defaultValue: 0,
                validate: {
                    min: 0
                }
            },
            shippingCost: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: true,
                defaultValue: 0,
                validate: {
                    min: 0
                }
            },
            total: {
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
            stripePaymentIntentId: {
                type: DataTypes.STRING(255),
                allowNull: true,
                unique: true
            },
            shippingAddress: {
                type: DataTypes.JSON,
                allowNull: true
            },
            notes: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            canceledAt: {
                type: DataTypes.DATE,
                allowNull: true
            },
            shippedAt: {
                type: DataTypes.DATE,
                allowNull: true
            },
            paidAt: {
                type: DataTypes.DATE,
                allowNull: true
            }
        },
        {
            timestamps: true,
            indexes: [
                { fields: ['userId'] },
                { fields: ['status'] },
                { fields: ['createdAt'] }
            ]
        }
    );

    Order.associate = (models) => {
        Order.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user',
            onDelete: 'CASCADE'
        });
        Order.hasMany(models.OrderItem, {
            foreignKey: 'orderId',
            as: 'items',
            onDelete: 'CASCADE'
        });
        Order.hasMany(models.Payment, {
            foreignKey: 'orderId',
            as: 'payments',
            onDelete: 'CASCADE'
        });
    };

    return Order;
};
