const { Router } = require("express");
const mongoose = require("mongoose");
const router = Router();
const Discussion = require("../models/Discussion");
const Comment = require("../models/Comment");
const authMiddleware = require("../middleware/auth");

router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    comment.text = text;
    await comment.save();

    res.status(200).json(comment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:commentId/reply", authMiddleware, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { text } = req.body;
    const { userId } = req;
    const reply = new Comment({ text, userId });
    await reply.save();

    const comment = await Comment.findById(commentId);
    comment.replies.push(reply._id);
    await comment.save();

    res.status(201).json(reply);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete(
  "/:commentId/reply/:replyId",
  authMiddleware,
  async (req, res) => {
    try {
      const { commentId, replyId } = req.params;
      const { userId } = req;

      const reply = await Comment.findOne({ _id: replyId, userId });

      if (!reply) {
        return res.status(404).json({ error: "Reply not found " });
      }

      await Comment.findByIdAndDelete(replyId);

      const comment = await Comment.findById(commentId);
      if (comment) {
        comment.replies = comment.replies.filter(
          (id) => id.toString() !== replyId
        );
        await comment.save();
      }

      res.status(200).json({ message: "Reply deleted successfully" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

router.get("/:commentId/like", authMiddleware, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { userId } = req;

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (comment.likes.includes(userId)) {
      return res
        .status(400)
        .json({ message: "You have already liked this Comment" });
    }

    comment.likes.push(userId);
    await comment.save();

    res.status(200).json({ message: "Comment Liked Successfully!", comment });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Like Comment Failed", error: error.message });
  }
});

router.get("/:commentId/unlike", authMiddleware, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { userId } = req;

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (!comment.likes.includes(userId)) {
      return res
        .status(400)
        .json({ message: "You have already unliked this Comment", comment });
    }

    comment.likes = comment.likes.filter((id) => id === userId);
    await comment.save();

    res.json({
      message: "Comment unliked successfully",
      comment,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Unlike Comment Failed", error: error.message });
  }
});

module.exports = router;
