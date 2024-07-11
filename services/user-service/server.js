const express = require("express");
const cors = require("cors");
const authRoutes = require("./src/routes/auth");
const usersRoutes = require("./src/routes/users");
const sequelize = require("./src/config/database");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/users", usersRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 3000;

sequelize.sync({ force: false }).then(() => {
  console.log("Databse Synced");
  app.listen(PORT, () => {
    console.log(`User service listening on port ${PORT}`);
  });
});
