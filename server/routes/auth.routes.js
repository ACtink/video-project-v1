const express = require("express");
const { joinHandler, loginHandler } = require("../controllers/auth.controller");
const validate = require("../middlewares/validate");
const { joinSchema, loginSchema } = require("../validators/auth.schema");

const router = express.Router();


const authMiddleware = require("../middlewares/auth");
const { logoutHandler } = require("../controllers/auth.controller");

router.get("/profile", authMiddleware , (req, res) => {
  res.status(200).json({
    message: "Protected data",
    user: req.user,
  });
});


router.post("/join", validate(joinSchema), joinHandler);
router.post("/login", validate(loginSchema), loginHandler);
router.post("/logout", authMiddleware, logoutHandler);


module.exports = router;
