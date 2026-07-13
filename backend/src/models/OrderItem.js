const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const OrderItem = sequelize.define(
        'OrderItem',
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
            productId: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true
            },
            quantity: {
                type: DataTypes.INTEGER,
                allowNull: false,
                validate: {
                    min: 1
                }
            },
            unitPrice: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
                validate: {
                    min: 0
                }
            },
            lineTotal: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
                validate: {
                    min: 0
                }
            },
            productSnapshot: {
                type: DataTypes.JSON,
                allowNull: true,
                defaultValue: {}
            }
        },
        {
            timestamps: false,
            indexes: [
                { fields: ['orderId'] },
                { fields: ['productId'] }
            ]
        }
    );

    OrderItem.associate = (models) => {
        OrderItem.belongsTo(models.Order, {
            foreignKey: 'orderId',
            as: 'order',
            onDelete: 'CASCADE'
        });
        OrderItem.belongsTo(models.Product, {
            foreignKey: 'productId',
            as: 'product',
            onDelete: 'SET NULL'
        });
    };

    return OrderItem;
};
