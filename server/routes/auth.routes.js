const express = require("express");
const { joinHandler, loginHandler, mobileLoginHandler, mobileJoinHandler } = require("../controllers/auth.controller");
const validate = require("../middlewares/validate");
const { joinSchema, loginSchema } = require("../validators/auth.schema");

const router = express.Router();


const authMiddleware = require("../middlewares/auth");
const { logoutHandler } = require("../controllers/auth.controller");
const User = require("../models/User");



router.get("/profile", authMiddleware, async (req, res) => {
  try {

    // console.log("REQ.USER:", req.user);
    const user = await User.findById(req.user.id).select(
      "_id username fullName email bio country profilePicture followers following postsCount createdAt"
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

const passport = require("passport");
const { googleCallbackHandler } = require("../controllers/auth.controller");

// Google OAuth routes
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
    prompt: "select_account", // ✅ always shows account picker
  }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.CLIENT_URL}/login?error=google_failed`,
    session: false,
  }),
  googleCallbackHandler,
);


router.post("/join", validate(joinSchema), joinHandler);
router.post("/mobile/join", validate(joinSchema), mobileJoinHandler);
router.post("/login", validate(loginSchema), loginHandler);
router.post("/logout", authMiddleware, logoutHandler);

router.post("/mobile/login", validate(loginSchema), mobileLoginHandler);

module.exports = router;
