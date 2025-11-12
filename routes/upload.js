const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();

// Ensure 'uploads' directory exists
const uploadDir = path.join(__dirname, "../uploads");

console.log(uploadDir);

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

router.post("/", upload.single("file"), (req, res) => {
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ fileUrl });
});

module.exports = router;
