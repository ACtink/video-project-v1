const express = require("express");
const { joinHandler, loginHandler } = require("../controllers/auth.controller");
const validate = require("../middlewares/validate");
const { joinSchema, loginSchema } = require("../validators/auth.schema");

const router = express.Router();


const authMiddleware = require("../middlewares/auth");
const { logoutHandler } = require("../controllers/auth.controller");
const User = require("../models/User");

// router.get("/profile", authMiddleware , (req, res) => {

//   console.log("REQ.USER:", req.user);
//   res.status(200).json({
//     message: "Protected data",
//     user: req.user,
//   });
// });


router.get("/profile", authMiddleware, async (req, res) => {
  try {

    // console.log("REQ.USER:", req.user);
    const user = await User.findById(req.user.id).select(
      "_id username email country profilePicture followers following postsCount createdAt"
    );

    // console.log("USER PROFILE-------------->:", user);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Profile data",
      user,
    });
  } catch (err) {
      console.error("PROFILE ERROR:", err);

    res.status(500).json({ message: "Server error" });
  }
});



router.post("/join", validate(joinSchema), joinHandler);
router.post("/login", validate(loginSchema), loginHandler);
router.post("/logout", authMiddleware, logoutHandler);


module.exports = router;
