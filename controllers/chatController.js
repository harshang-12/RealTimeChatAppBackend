const Chat = require("../Models/Chat");
const mongoose = require("mongoose");

// Fetch chat messages between the user and a specific friend
exports.chatMessage = async (req, res) => {
  try {


    const userId = req.user.userId; // Get the logged-in user's ID
    const friendId = req.params.friendId; // Get friend ID from query string

    // Validate if the friendId is provided
    if (!friendId) {
      return res.status(400).json({ message: "Friend ID is required" });
    }

    // Find the chat where both the user and friend are participants
    const chat = await Chat.findOne({
      participants: {
        $all: [
          new mongoose.Types.ObjectId(userId), // Use new keyword to create ObjectId
          new mongoose.Types.ObjectId(friendId), // Use new keyword to create ObjectId
        ],
      },
    }).populate("messages.sender", "username"); // Populate sender details with username


    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // Return the messages in the chat
    return res.json(chat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Send a new message to a friend
exports.sendMessage = async (req, res) => {
  try {
    const userId = req.user.userId; // Get the logged-in user's ID
    const friendId = req.params.friendId;
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: "Message cannot be empty" });
    }

    // Check if the chat exists, if not, create a new one
    let chat = await Chat.findOne({
      participants: {
        $all: [
          new mongoose.Types.ObjectId(userId), // Use new keyword to create ObjectId
          new mongoose.Types.ObjectId(friendId), // Use new keyword to create ObjectId
        ],
      },
    });

    if (!chat) {
      chat = new Chat({
        participants: [new mongoose.Types.ObjectId(userId), new mongoose.Types.ObjectId(friendId)], // Ensure ObjectId instances are created with 'new'
        messages: [],
      });
    }

    // Create the message object
    const newMessage = {
      sender: new mongoose.Types.ObjectId(userId), // Ensure sender ObjectId is created with 'new'
      content: message,
      timestamp: new Date(),
    };

    // Push the new message to the chat's messages array
    chat.messages.push(newMessage);
    await chat.save();

    return res.status(201).json(newMessage); // Return the newly created message
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
