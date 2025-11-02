const jwt = require("jsonwebtoken");
const User = require("../Models/User");

const authenticateToken = async (req, res, next) => {
  try {
    // Read token from Authorization header OR cookies
    const authHeader = req.headers.authorization;

    const token =
      (authHeader && authHeader.startsWith("Bearer ") && authHeader.split(" ")[1] !== "null" && authHeader.split(" ")[1]) ||
      req.cookies?.token;

    console.log("req.headers.authorization:", req.headers.authorization);
    console.log("req.cookies.token:", req.cookies?.token);
    console.log("final token:", token);

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.SECRET_KEY || "your_secret_key");

    // Find user
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    req.user = { userId: user._id, name: user.username };
    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    res.status(403).json({ error: "Invalid or expired token" });
  }
};

module.exports = authenticateToken;
