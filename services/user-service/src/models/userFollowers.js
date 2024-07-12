const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const UserFollows = sequelize.define("UserFollows", {
  followerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "Users",
      key: "id",
    },
  },
  followedId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "Users",
      key: "id",
    },
  },
});

module.exports = UserFollows;
