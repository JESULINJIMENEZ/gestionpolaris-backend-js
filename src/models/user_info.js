const { DataTypes } = require('sequelize');
const sequelize = require('../../database');
const User = require('./users');
const UserInfo = sequelize.define('UserInfo', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
            model: User,
            key: 'id',
        }
    },
    address: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    neiborhood: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    city: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    voting_point:{
        type: DataTypes.STRING,
        allowNull: true,
    }
},{
    tableName: "UserInfo",
    timestamps: true,
    paranoid: true,
});

User.hasOne(UserInfo, { foreignKey: 'user_id', onDelete: 'CASCADE' });
UserInfo.belongsTo(User, { foreignKey: 'user_id', onDelete: 'CASCADE' });


module.exports = UserInfo;