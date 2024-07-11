const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const bcrypt = require("bcrypt");
const UserFollows = require("./userFollows.js");

const User = sequelize.define("User", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  mobile: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true,
    validate: {
      isNumeric: true,
    },
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

User.beforeCreate(async (user) => {
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
});

User.prototype.validatePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

User.belongsToMany(User, {
  through: UserFollows,
  as: "Followers",
  foreignKey: "followedId",
  otherKey: "followerId",
});

User.belongsToMany(User, {
  through: UserFollows,
  as: "Followings",
  foreignKey: "followerId",
  otherKey: "followedId",
});

module.exports = User;
