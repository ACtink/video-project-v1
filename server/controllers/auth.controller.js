const bcrypt = require("bcrypt");
const User = require("../models/User");
const { generateToken , generateRefreshToken } = require("../utils/jwt");

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


const mobileJoinHandler = async (req, res) => {
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

    // -------- Create user --------
    const newUser = new User({
      username: username.toLowerCase(),
      email,
      password: hashedPassword,
      age,
      country,
      termsAccepted,
    });

    await newUser.save();

    // -------- Generate tokens --------
    const accessToken = generateToken({
      id: newUser._id,
      username: newUser.username,
      country: newUser.country,
    });

    const refreshToken = generateRefreshToken({
      id: newUser._id,
    });

    // -------- Success response --------
    return res.status(201).json({
      message: "User registered successfully",

      accessToken,
      refreshToken,

      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
      },
    });
  } catch (err) {
    console.error("MOBILE JOIN ERROR:", err);

    // Duplicate key fallback
    if (err.code === 11000) {
      return res.status(409).json({
        message: "Username or email already exists",
        errors: ["Username or email already exists"],
      });
    }

    return res.status(500).json({
      message: "Internal server error",
      errors: ["Internal server error"],
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


  //  res.cookie("token", token, {
  //    httpOnly: true, // JS cannot read it (security)
  //    secure: true, // REQUIRED for SameSite=None
  //    sameSite: "none", // REQUIRED for cross-site cookies
  //    maxAge: 7 * 24 * 60 * 60 * 1000,
  //  });
const isProd = process.env.NODE_ENV === "production";

res.cookie("token", token, {
  httpOnly: true,

  secure: isProd, // prod → true, dev → false

  sameSite: isProd
    ? "lax" // prod (subdomain safe)
    : "lax", // dev (localhost safe)

  domain: isProd
    ? ".quikchat.live" // prod only
    : undefined, // dev → DO NOT set domain

  path: "/",

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




 const mobileLoginHandler = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await authenticateUser(email, password);

    const accessToken = generateToken({
      id: user._id,
      username: user.username,
      country: user.country,
    });

    // Optional separate refresh token
    const refreshToken = generateRefreshToken({
      id: user._id,
    });

    return res.status(200).json({
      message: "Login successful",

      accessToken,
      refreshToken,

      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (err) {
    return res.status(401).json({
      message: err.message,
      errors: [err.message],
    });
  }
};


const logoutHandler = (req, res) => {
  try {
    // res.clearCookie("token", {
    //   httpOnly: true,
    //   // secure: process.env.NODE_ENV === "production",
    //   secure: true,
    //   sameSite: "none", // must match login cookie
    // });

    res.clearCookie("token", {
      path: "/",
      domain:
        process.env.NODE_ENV === "production" ? ".quikchat.live" : undefined,
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




const googleCallbackHandler = (req, res) => {
  try {
    const user = req.user; // passport puts user here

    const token = generateToken({
      id: user._id,
      username: user.username,
      country: user.country,
    });

    const isProd = process.env.NODE_ENV === "production";

    // Exact same cookie as your loginHandler
    res.cookie("token", token, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      domain: isProd ? ".quikchat.live" : undefined,
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Redirect to frontend after login
    res.redirect(`${process.env.CLIENT_URL}/`);
  } catch (err) {
    console.error("GOOGLE CALLBACK ERROR:", err);
    res.redirect(`${process.env.CLIENT_URL}/login?error=google_failed`);
  }
};

// add to exports
module.exports = {
  joinHandler,
  loginHandler,
  logoutHandler,
  googleCallbackHandler, // ✅ add this
  mobileLoginHandler, // ✅ add this
  mobileJoinHandler, // ✅ add this
};
