const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Product = sequelize.define(
        'Product',
        {
            id: {
                type: DataTypes.BIGINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true
            },
            name: {
                type: DataTypes.STRING(255),
                allowNull: false,
                validate: {
                    notEmpty: true,
                    len: [2, 255]
                }
            },
            slug: {
                type: DataTypes.STRING(255),
                allowNull: false,
                unique: true
            },
            category: {
                type: DataTypes.STRING(100),
                allowNull: false,
                validate: {
                    notEmpty: true
                }
            },
            material: {
                type: DataTypes.STRING(100),
                allowNull: true,
                defaultValue: 'unspecified'
            },
            price: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
                validate: {
                    min: 0.01
                }
            },
            stock: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
                validate: {
                    min: 0
                }
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: false,
                validate: {
                    notEmpty: true
                }
            },
            images: {
                type: DataTypes.JSON,
                allowNull: false,
                defaultValue: []
            }
        },
        {
            timestamps: true,
            indexes: [
                { fields: ['category'] },
                { fields: ['material'] },
                { fields: ['price'] },
                { fields: ['stock'] },
                { fields: ['name'] }
            ]
        }
    );

    return Product;
};
