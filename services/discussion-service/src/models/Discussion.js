const mongoose = require("mongoose");
const mongoosastic = require("mongoose-elasticsearch-xp");
const elasticClient = require("../config/elasticsearchConfig");

const DiscussionSchema = new mongoose.Schema({
  text: String,
  imageUrl: String,
  hashtags: [String],
  userId: String,
  likes: { type: [String], default: [] },
  comments: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Comment",
    default: [],
  },
  viewCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

DiscussionSchema.plugin(mongoosastic, {
  esClient: elasticClient,
  index: "discussions",
});

const Discussion = mongoose.model("Discussion", DiscussionSchema);

module.exports = Discussion;
