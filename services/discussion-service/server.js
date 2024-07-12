const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const discussionRoutes = require("./src/routes/discussionRoutes");
const commentRoutes = require("./src/routes/commentRoutes");

require("dotenv").config();
const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI);

app.use(express.json());

app.use("/discussion", discussionRoutes);
app.use("/comments", commentRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Post service running on port ${PORT}`);
});
