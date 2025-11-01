const express = require("express");
const router = express.Router();
const {
  sendRequest,
  acceptRequest,
  getUserDetails,
  getFriendsList,
  getAllUsers,
  getReceivedRequests,
  declineRequest,
  removeFriend,
} = require("../controllers/userController");
const authenticateToken = require("../middleware/authMiddleware"); // Import the auth middleware

// Route for sending a friend request (protected by auth middleware)


router.post("/send-request", authenticateToken, sendRequest);

 
router.post("/decline-request", authenticateToken, declineRequest);

// Route for accepting a friend request (protected by auth middleware)
router.post("/accept-request", authenticateToken, acceptRequest);

// Route for getting the details of the currently authenticated user (protected by auth middleware)
router.get("/me", authenticateToken, getUserDetails);

// Route for getting the list of friends of the authenticated user (protected by auth middleware)
router.get("/friends", authenticateToken, getFriendsList);

router.post("/remove-friend", authenticateToken, removeFriend);


// Route for getting a list of all users (protected by auth middleware)
router.get("/all-users", authenticateToken, getAllUsers);

router.get("/received-requests", authenticateToken, getReceivedRequests);

module.exports = router;
