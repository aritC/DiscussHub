const { Router } = require("express");
const multer = require("multer");
const mongoose = require("mongoose");
const router = Router();
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 5 * 1000 * 1000,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
      cb(null, true);
    } else {
      cb(new FileTypeError("Only JPEG and PNG files are allowed."));
    }
  },
});
const fs = require("fs");
const FileTypeError = require("../errors/FileTypeError");
const authMiddleware = require("../middleware/auth");
const Discussion = require("../models/Discussion");
const Comment = require("../models/Comment");
const {
  addDiscussion,
  searchDiscussionByTags,
  searchDiscussionsByText,
} = require("../util/elasticSearchHelper");

const { uploadFileToS3 } = require("../util/s3Helper");

router.get("/", authMiddleware, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const totalDiscussion = await Discussion.countDocuments();
    const discussions = await Discussion.aggregate([
      { $sort: { createdAt: -1 } },
      { $skip: offset },
      { $limit: limit },
      {
        $lookup: {
          from: "comments",
          localField: "comments",
          foreignField: "_id",
          let: { commentIds: "$comments" },
          pipeline: [{ $sort: { createdAt: -1 } }, { $limit: 2 }],
          as: "comments",
        },
      },
    ]);

    res.status(200).json({
      totalPages: Math.ceil(totalDiscussion / limit),
      currentPage: parseInt(page),
      data: discussions,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Get All Discussion Failed", message: error.message });
  }
});

router.post("/", authMiddleware, upload.single("image"), async (req, res) => {
  try {
    if (req.file) {
      const filePath = req.file.path;
      const uploadResult = await uploadFileToS3(filePath);
      req.body.imageUrl = uploadResult.Location;

      fs.unlinkSync(filePath);
    }
    const newDiscussion = new Discussion(req.body);
    const savedDiscussion = await newDiscussion.save();

    const esRes = await addDiscussion(savedDiscussion);

    if (esRes.result !== "created")
      throw new Error("Could not insert document to ES");

    res.status(201).json(savedDiscussion);
  } catch (error) {
    if (error instanceof FileTypeError) {
      return res
        .status(400)
        .json({ message: "Bad Image Type", error: error.message });
    }
    res
      .status(500)
      .json({ message: "Create Discussion Failed", error: error.message });
  }
});

router.put("/:id", authMiddleware, upload.single("image"), async (req, res) => {
  try {
    if (req.file) {
      const filePath = req.file.path;
      const uploadResult = await uploadFileToS3(filePath);
      req.body.imageUrl = uploadResult.Location;

      fs.unlinkSync(filePath);
    }

    const DiscussionId = req.params.id;
    const updatedDiscussion = await Discussion.findByIdAndUpdate(
      DiscussionId,
      req.body,
      { new: true }
    );

    if (!updatedDiscussion) {
      return res.status(404).json({ message: "Discussion not found" });
    }

    res.status(200).json(updatedDiscussion);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Update Discussion Failed", error: error.message });
  }
});

router.get("/:id/view", authMiddleware, async (req, res) => {
  try {
    const discussionId = req.params.id;
    const updatedDiscussion = await Discussion.findByIdAndUpdate(
      discussionId,
      { $inc: { viewCount: 1 } },
      { new: true } // Return the updated document
    );

    if (!updatedDiscussion) {
      return res.status(404).json({ message: "Discussion not found" });
    }

    res.status(200).json(updatedDiscussion);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Update Discussion Failed", error: error.message });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const discussionId = req.params.id;
    const updatedDiscussion = await Discussion.findByIdAndDelete(discussionId);

    if (!updatedDiscussion) {
      return res.status(404).json({ message: "Discussion not found" });
    }

    res.status(200).json({ message: "Discussion Deleted" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Update Discussion Failed", error: error.message });
  }
});

router.get("/:discussionId/like", authMiddleware, async (req, res) => {
  try {
    const discussionId = req.params.discussionId;
    const { userId } = req;

    const discussion = await Discussion.findById(discussionId);

    if (!discussion) {
      return res.status(404).json({ message: "Discussion not found" });
    }
    console.log(discussion.likes.includes("a"), userId);

    if (discussion.likes.includes(userId)) {
      return res
        .status(400)
        .json({ message: "You have already liked this Discussion" });
    }

    discussion.likes.push(userId);

    await discussion.save();

    res.status(200).json({ message: "Discussion Liked Successfully!" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Like Discussion Failed", error: error.message });
  }
});

router.get("/:discussionId/unlike", authMiddleware, async (req, res) => {
  try {
    const discussionId = req.params.discussionId;
    const { userId } = req;

    const discussion = Discussion.findById(discussionId);

    if (!discussion) {
      return res.status(404).json({ message: "Discussion not found" });
    }

    if (!discussion.likes.includes(userId)) {
      return res
        .status(400)
        .json({ message: "You have already unliked this Discussion" });
    }

    discussion.likes = discussion.likes.filter((id) => !id.equals(userId));
    await discussion.save();

    res.json({
      message: "Discussion unliked successfully",
      likesCount: discussion.likes.length,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Unlike Discussion Failed", error: error.message });
  }
});

router.post("/:id/comment", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const { userId } = req;

    const comment = new Comment({ text, userId });
    await comment.save();

    const discussion = await Discussion.findById(id);
    if (!discussion)
      return res.status(404).json({ message: "Discussion Not Found" });

    discussion.comments.push(comment._id);
    await discussion.save();

    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:dicussionId/comment/:commentId", async (req, res) => {
  try {
    const { dicussionId, commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    await Comment.findByIdAndDelete(commentId);

    const discussion = await Discussion.findById(dicussionId);
    if (discussion) {
      discussion.comments = discussion.comments.filter(
        (id) => id.toString() !== commentId
      );
      await discussion.save();
    }

    res.status(200).json({ message: "Comment deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/tags", authMiddleware, async (req, res) => {
  try {
    const tags = req.body.tags;
    if (!tags || !Array.isArray(tags)) {
      return res.status(400).json({
        error: "Tags must be provided as an array in the request body",
      });
    }
    let discussions = await searchDiscussionByTags(tags);
    discussions = discussions.map((discussion) => discussion._source.document);
    res.json(discussions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/search", authMiddleware, async (req, res) => {
  try {
    let discussions = await searchDiscussionsByText(req.query.q);
    discussions = discussions.map((discussion) => discussion._source.document);

    res.json(discussions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:discussionId", authMiddleware, async (req, res) => {
  try {
    const discussionId = req.params.discussionId;
    const discussion = await Discussion.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(discussionId) } },
      {
        $addFields: {
          likesCount: { $size: "$likes" },
        },
      },
      {
        $lookup: {
          from: "comments",
          localField: "comments",
          foreignField: "_id",
          pipeline: [{ $sort: { createdAt: -1 } }, { $limit: 2 }],
          as: "comments",
        },
      },
      {
        $project: {
          _id: 1,
          text: 1,
          imageUrl: 1,
          hashtags: 1,
          createdAt: 1,
          updatedAt: 1,
          likesCount: { $size: "$likes" },
          commentsCount: { $size: "$comments" },
          comments: 1,
          viewCount: 1,
        },
      },
    ]);

    if (!discussion)
      return res.status(404).json({ message: "No Discussion Found" });

    res.status(200).json(discussion);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Get Discussion By Id Failed", error: error.message });
  }
});

module.exports = router;
