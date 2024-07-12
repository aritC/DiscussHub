const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();

const authMiddleware = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token)
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });

  try {
    const response = await axios.get(
      `${process.env.USER_SERVICE_URL}/auth/validate`,
      {
        headers: {
          Authorization: req.header("Authorization"),
        },
      }
    );

    const tokenResponse = response.data;

    if (!tokenResponse.valid) {
      return res.status(401).json({ message: "Invalid token." });
    }

    req.userId = tokenResponse.userId;
    next();
  } catch (err) {
    res.status(400).json({ message: "Invalid token." });
  }
};

module.exports = authMiddleware;
