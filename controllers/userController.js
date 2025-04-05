const Chat = require("../Models/Chat");
const User = require("../Models/User"); // Import the User model

// Get the details of the authenticated user
exports.getUserDetails = async (req, res) => {
  try {
    // Fetch the user based on the ID from the authenticated token (from req.user)
    
    const user = await User.findById(req.user.userId).select("-password"); // Exclude the password field
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get the list of friends for the authenticated user
exports.getFriendsList = async (req, res) => {
  try {
    // Fetch the authenticated user and populate the friends field (which contains ObjectIds of other User documents)
    const user = await User.findById(req.user.userId).populate(
      "friends",
      "-password"
    ); // Exclude password from friend details
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    


    res.json(user.friends); // Return the list of friends
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get a list of all users
exports.getAllUsers = async (req, res) => {
  try {
    // Fetch the requesting user to check sent friend requests and friends
    const requestingUser = await User.findById(req.user.userId)
    console.log("requestingUser :" , requestingUser);
    

    if (!requestingUser) {
      return res.status(404).json({ message: "Requesting user not found" });
    }
    // Fetch all users excluding the requester themselves
    const users = await User.find({
      _id: { $ne: req.user.userId }, // Exclude the requester themselves
    }).select("-password"); // Exclude password

    console.log("User:" , users);
    
    // Add a `status` field to each user
    const usersWithStatus = users.map((user) => {
      let status = "not_sent"; // Default status
      if (user.friendRequests.includes(requestingUser._id)) {
        status = "request_sent";
      } else if (user.friends.includes(requestingUser._id)) {
        status = "friend";
      }
      return {
        ...user.toObject(), // Convert Mongoose document to plain object
        status, // Add the status field
      };
    });



    res.json(usersWithStatus);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Function to send a friend request (already implemented)
exports.sendRequest = async (req, res) => {
  try {
    // Ensure receiverId is provided
    console.log("req:", req.user.userId);

    if (!req.body.receiverId) {
      return res.status(400).json({ message: "Receiver ID is required" });
    }

    const sender = await User.findById(req.user.userId);
    const receiver = await User.findById(req.body.receiverId);

    // Check if sender exists
    if (!sender) {
      return res.status(404).json({ message: "Sender not found" });
    }

    // Check if receiver exists
    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found" });
    }

    // Check if a request has already been sent or the user is already friends
    if (sender.friendRequests.includes(receiver._id)) {
      return res.status(400).json({ message: "Friend request already sent" });
    }

    if (sender.friends.includes(receiver._id)) {
      return res.status(400).json({ message: "You are already friends" });
    }

    // Add the receiver to the sender's friendRequests list
    receiver.friendRequests.push(sender._id);

    // Save the sender (you can also save the receiver here if necessary, depending on your schema)
    await receiver.save();

    // Optionally, you can also send a notification to the receiver here if your app requires it.

    res
      .status(200)
      .json({
        receiver: receiver,
        sender: sender,
        message: "Friend request sent successfully",
      });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.declineRequest = async (req, res) => {
  try {
    const { senderId } = req.body;

    // Ensure senderId is provided
    if (!senderId) {
      return res.status(400).json({ message: "Sender ID is required" });
    }

    const receiver = await User.findById(req.user.userId);

    // Check if receiver exists
    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found" });
    }

    // Check if sender's request exists in receiver's friendRequests
    const requestIndex = receiver.friendRequests.indexOf(senderId);
    if (requestIndex === -1) {
      return res.status(400).json({ message: "Friend request not found" });
    }

    // Remove senderId from receiver's friendRequests
    receiver.friendRequests.splice(requestIndex, 1);

    // Save the receiver
    await receiver.save();

    // Optionally, you can also notify the sender here if your app requires it.

    res.status(200).json({ message: "Friend request declined successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


// Function to accept a friend request (already implemented)
// exports.acceptRequest = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.userId);
//     const sender = await User.findById(req.body.senderId); // senderId is expected to be sent in the request body

//     if (!sender) {
//       return res.status(404).json({ message: "Sender not found" });
//     }

//     // Remove the sender from the user’s friendRequests and add to friends list
//     user.friendRequests = user.friendRequests.filter(
//       (id) => !id.equals(sender._id)
//     );
//     user.friends.push(sender._id);

//     sender.friends.push(user._id); // Also add the user to the sender's friends list
//     await user.save();
//     await sender.save();

//     res.status(200).json({ message: "Friend request accepted" });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// Fetch received friend requests
exports.getReceivedRequests = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select("friendRequests")
      .populate("friendRequests", "username email"); // Populate sender details

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user.friendRequests); // Send the populated friend requests
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Accept friend request
exports.acceptRequest = async (req, res) => {
  try {
    const { senderId } = req.body;
    const receiverId = req.user.userId;

    const user = await User.findById(receiverId);
    const sender = await User.findById(senderId);

    if (!user || !sender) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.friendRequests.includes(senderId)) {
      return res.status(400).json({ message: "No such friend request found" });
    }

    // Add each other to friends list
    user.friends.push(senderId);
    sender.friends.push(receiverId);

    // Remove the request from friendRequests
    user.friendRequests = user.friendRequests.filter(
      (id) => id.toString() !== senderId
    );

    // Save users
    await user.save();
    await sender.save();

    // ✅ Check if a chat already exists (prevent duplicate chats)
    const existingChat = await Chat.findOne({
      participants: { $all: [senderId, receiverId], $size: 2 }
    });

    if (!existingChat) {
      // 🧱 Create a new chat
      const newChat = new Chat({
        participants: [senderId, receiverId],
        messages: [],
      });

      await newChat.save();
      console.log("💬 New chat created:", newChat._id);
    }

    res.status(200).json({ message: "Friend request accepted and chat initialized" });
  } catch (err) {
    console.error("❌ Error in acceptRequest:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Decline friend request
exports.declineRequest = async (req, res) => {
  try {
    const { senderId } = req.body;

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove the request from friendRequests
    user.friendRequests = user.friendRequests.filter(
      (id) => id.toString() !== senderId
    );

    await user.save();

    res.status(200).json({ message: "Friend request declined" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
