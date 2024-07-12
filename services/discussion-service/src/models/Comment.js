const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema({
  text: String,
  userId: String,
  likes: { type: [String], default: [] },
  replies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Comment", CommentSchema);
