const { DataTypes } = require('sequelize');
const bcryptjs = require('bcryptjs');

module.exports = (sequelize) => {
    const User = sequelize.define(
        'User',
        {
            id: {
                type: DataTypes.BIGINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true
            },
            firstName: {
                type: DataTypes.STRING(50),
                allowNull: false,
                validate: {
                    len: [2, 50],
                    isAlpha: true
                }
            },
            lastName: {
                type: DataTypes.STRING(50),
                allowNull: false,
                validate: {
                    len: [2, 50],
                    isAlpha: true
                }
            },
            email: {
                type: DataTypes.STRING(100),
                allowNull: false,
                unique: true,
                lowercase: true,
                validate: {
                    isEmail: true
                }
            },
            password: {
                type: DataTypes.STRING(255),
                allowNull: false,
                validate: {
                    len: [6, 100]
                }
            },
            role: {
                type: DataTypes.ENUM('customer', 'admin'),
                defaultValue: 'customer'
            },
            isEmailVerified: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },
            isActive: {
                type: DataTypes.BOOLEAN,
                defaultValue: true
            },
            passwordResetToken: {
                type: DataTypes.STRING(255),
                allowNull: true
            },
            passwordResetExpires: {
                type: DataTypes.DATE,
                allowNull: true
            },
            passwordResetUsed: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },
            lastLoginAt: {
                type: DataTypes.DATE,
                allowNull: true
            },
            loginAttempts: {
                type: DataTypes.INTEGER,
                defaultValue: 0
            },
            lockUntil: {
                type: DataTypes.DATE,
                allowNull: true
            }
        },
        {
            timestamps: true,
            indexes: [
                { fields: ['role'] }
            ]
        }
    );

    // Hash password before saving (only if modified)
    User.beforeSave(async (user) => {
        if (!user.changed('password')) return;

        try {
            const salt = await bcryptjs.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 10);
            user.password = await bcryptjs.hash(user.password, salt);
        } catch (error) {
            throw error;
        }
    });

    // Instance method to compare passwords during login
    User.prototype.matchPassword = async function (enteredPassword) {
        return await bcryptjs.compare(enteredPassword, this.password);
    };

    // Instance method to generate password reset token
    User.prototype.getPasswordResetToken = function () {
        const crypto = require('crypto');
        const resetToken = crypto.randomBytes(32).toString('hex');

        this.passwordResetToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');
        this.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        this.passwordResetUsed = false;

        return resetToken;
    };

    // Instance method to increment login attempts
    User.prototype.incLoginAttempts = async function () {
        if (this.lockUntil && this.lockUntil < Date.now()) {
            this.loginAttempts = 1;
            this.lockUntil = null;
        } else {
            this.loginAttempts += 1;

            // Lock account after 5 failed attempts for 2 hours
            const maxAttempts = 5;
            if (this.loginAttempts >= maxAttempts && !this.isLocked()) {
                this.lockUntil = new Date(Date.now() + 2 * 60 * 60 * 1000);
            }
        }

        return await this.save();
    };

    // Instance method to reset login attempts
    User.prototype.resetLoginAttempts = async function () {
        this.loginAttempts = 0;
        this.lockUntil = null;
        return await this.save();
    };

    // Instance method to check if account is locked
    User.prototype.isLocked = function () {
        return !!(this.lockUntil && this.lockUntil > Date.now());
    };

    return User;
};
