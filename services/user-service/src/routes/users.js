const express = require("express");
const { Op } = require("sequelize");
const User = require("../models/user");
const UserFollows = require("../models/userFollowers");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();

router.put("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { name, mobile, email, password } = req.body;

  try {
    const user = User.findByPk(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const hashedPassword = password
      ? await bcrypt.hash(password, 10)
      : user.password;
    await user.update({ name, mobile, email, password: hashedPassword });
    res.status(200).json(user);
  } catch (error) {
    res
      .status(500)
      .json({ error: "User Update Failed", message: error.message });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const user = User.findByPk(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    await user.destroy();
    res.status(200).json({ message: "User deleted" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "User Delete Failed", message: error.message });
  }
});

router.get("/all", authMiddleware, async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const users = await User.findAndCountAll({
      attributes: { exclude: ["password"] },
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.status(200).json({
      totalPages: Math.ceil(users.count / limit),
      currentPage: parseInt(page),
      data: users.rows,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Get All Users Failed", message: error.message });
  }
});

router.get("/search", authMiddleware, async (req, res) => {
  const { name, page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const users = await User.findAndCountAll({
      where: {
        name: { [Op.like]: `%${name}%` },
      },
      attributes: { exclude: ["password"] },
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.status(200).json({
      totalPages: Math.ceil(users.count / limit),
      currentPage: parseInt(page),
      data: users.rows,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Search User Failed", message: error.message });
  }
});

router.get("/follow/:id", authMiddleware, async (req, res) => {
  const { id: followedId } = req.params;
  const userId = req.userId;

  if (userId === followedId) {
    return res.status(400).json({ message: "User cannot follow themselves." });
  }

  try {
    const followedUser = await User.findByPk(followedId);
    if (!followedUser)
      return res.status(404).json({ message: "User doesnt exist" });

    const existingFollow = await UserFollows.findOne({
      where: {
        followerId: userId,
        followedId: followedId,
      },
    });

    if (existingFollow) {
      return res
        .status(400)
        .json({ message: "You're already following this user" });
    }

    await UserFollows.create({ followerId: userId, followedId });

    res.status(200).json({ message: "success" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Follow User Failed", message: error.message });
  }
});

router.get("/followers", authMiddleware, async (req, res) => {
  try {
    const { userId } = req;
    let follwerIds = await UserFollows.findAll({
      where: {
        followedId: userId,
      },
    });

    follwerIds = follwerIds.map((follower) => parseInt(follower.followerId));

    const followers = await User.findAll({
      where: {
        id: { [Op.or]: [...follwerIds] },
      },
      attributes: { exclude: ["password", "mobile"] },
    });

    res.status(200).json(followers);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Get All Followers failed", message: error.message });
  }
});

router.get("/unfollow/:id", authMiddleware, async (req, res) => {
  const { id: followedId } = req.params;
  const userId = req.userId;

  if (userId === followedId) {
    return res
      .status(400)
      .json({ message: "User cannot unfollow themselves." });
  }

  try {
    const followedUser = await User.findByPk(followedId);
    if (!followedUser)
      return res.status(404).json({ message: "User doesnt exist" });

    const existingFollow = await UserFollows.findOne({
      where: {
        followerId: userId,
        followedId: followedId,
      },
    });

    if (!existingFollow) {
      return res
        .status(400)
        .json({ message: "You're not following this user" });
    }

    await UserFollows.destroy({
      where: {
        followerId: userId,
        followedId: followedId,
      },
    });

    res.status(200).json({ message: "success" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Unfollow User Failed", message: error.message });
  }
});

module.exports = router;
