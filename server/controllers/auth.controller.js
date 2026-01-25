const bcrypt = require("bcrypt");
const User = require("../models/User");
const { treeifyError } = require("zod/v4/core");
const { generateToken } = require("../utils/jwt");

const joinHandler = async (req, res) => {
  try {
    const { username, email, password, age, country, termsAccepted } = req.body;

    // -------- Check if user already exists --------
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    console.log("EXISTING USER:", existingUser);


    if (existingUser?.username === username) {
      return res.status(409).json({
        message: "Username is already taken",
        errors: ["Username is already taken"],
      });
    }
    if (existingUser?.email === email) {
      return res.status(409).json({
        message: "Email is already registered",
        errors: ["Email is already registered"],
      });
    }


    if (existingUser?.username === username && existingUser?.email === email) {
       return res.status(409).json({
         message: "Username or email already exists",
         errors: ["Username or email already exists"],
       });
    }

    

    // -------- Hash password --------
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // -------- Create new user --------
    const newUser = new User({
      username : username.toLowerCase(),
      email,
      password: hashedPassword,
      age,
      country,
      termsAccepted,
    });

    await newUser.save();

    // -------- Success response --------
    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
      },
    });
  } catch (err) {
    console.error("JOIN ERROR:", err);

    // Duplicate key fallback (extra safety)
    if (err.code === 11000) {
      return res.status(409).json({
        message: "Username or email already exists",
        errors: ["Username or email already exists"],
      });
    }

   

    return res.status(500).json({
      message: "internal server error",
      errors: ["internal server error"],
    });
  }
};

const loginHandler = async (req, res) => {
  try {
    const { email, password } = req.body;

    // -------- Find user by email --------
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
        errors: ["Invalid email or password"],
      });
    }

    console.log("FOUND USER during login:", user);
    // -------- Compare password --------
    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
        errors: ["Invalid email or password"],
      });
    }

    // -------- Generate JWT --------
    console.log("PAYLOAD BEFORE TOKEN:", {
      id: user._id,
      username: user.username,
      country: user.country,
    });

    const token = generateToken({
      id: user._id,
      username: user.username,
      country: user.country,
    });

    console.log(process.env.MODE);
    // -------- Set httpOnly cookie --------
    // res.cookie("token", token, {
    // //   httpOnly: true,


    //   secure: process.env.MODE === "production",
    //   sameSite: process.env.MODE === "production" ? "strict" : "lax",
    //   maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    // });


    res.cookie("token", token, {
      httpOnly: true,
      // secure: false, // localhost
      secure: true, // localhost

      sameSite: "none", // allow cross-port
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // -------- Success response --------
   return res.status(200).json({
     message: "Login successful",
     user: {
       id: user._id,
       username: user.username,
       email: user.email,
     },
   });
  } catch (err) {
    console.error("LOGIN ERROR:", err);

    return res.status(500).json({
      message: "Internal server error",
      errors: ["Internal server error"],
    });
  }
};



const logoutHandler = (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      // secure: process.env.NODE_ENV === "production",
      secure: true,
      sameSite: "none", // must match login cookie
    });

    return res.status(200).json({
      message: "Logged out successfully",
      errors: ["logged out successfully"],
    });
  } catch (err) {
    return res.status(500).json({
      message: "Logout failed",
      errors: ["Logout failed"],
    });
  }
};

module.exports = {
  joinHandler,
  loginHandler,
  logoutHandler,
};

