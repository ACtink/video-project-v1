// scripts/fixPostsCount.js
const mongoose = require("mongoose");
require("dotenv").config({ path: "../.env" }); // adjust path if needed

const User = require("../models/User");
const Post = require("../models/Post");

async function fixPostsCount() {
  await mongoose.connect(process.env.MONGO_URI);

  const users = await User.find({});

  for (const user of users) {
    const count = await Post.countDocuments({ user: user._id });
    await User.findByIdAndUpdate(user._id, { postsCount: count });
    console.log(`Updated ${user.username}: ${count} posts`);
  }

  console.log("Done!");
  mongoose.disconnect();
}

fixPostsCount().catch(console.error);
