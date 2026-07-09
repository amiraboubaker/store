const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Cart = sequelize.define(
        'Cart',
        {
            id: {
                type: DataTypes.BIGINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true
            },
            userId: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
                unique: true
            },
            items: {
                type: DataTypes.JSON,
                allowNull: false,
                defaultValue: []
            }
        },
        {
            timestamps: true,
            indexes: [{ fields: ['userId'] }]
        }
    );

    Cart.associate = (models) => {
        Cart.belongsTo(models.User, {
            foreignKey: 'userId',
            onDelete: 'CASCADE'
        });
    };

    return Cart;
};
