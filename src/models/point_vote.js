const { DataTypes } = require('sequelize');
const sequelize = require('../../database');
const User = require('./users');
const PointVote = sequelize.define('PointVote', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    address:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    neiborhood:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    city:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    create_by: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
            model: User,
            key: 'id',
        }
    }
},{
    tableName: "PointVotes",
    timestamps: true,
    paranoid: true,
});

User.hasMany(PointVote, { foreignKey: 'create_by' });
PointVote.belongsTo(User, { foreignKey: 'create_by' });

module.exports = PointVote;