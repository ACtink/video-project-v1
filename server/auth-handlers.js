


 const joinHandler = (req, res) => {
  try {
    const { username, email, password, age, country, acceptedTerms } = req.body;

    if (!username || !email || !password || !age || !country) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    if (Number(age) < 16) {
      return res.status(400).json({
        message: "You must be at least 16 years old",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    console.log("JOIN FORM DATA RECEIVED:", {
      username,
      email,
      age,
      country,
      acceptedTerms,
    });

    return res.status(201).json({
      message: "Form data received successfully",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
}; 

const loginHandler = (req, res) => {
  try {
    const { email, password } = req.body;

    // -------- Basic validation --------
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    console.log("LOGIN FORM DATA RECEIVED:", {
      email,
      password
    })

    return res.status(200).json({
      message: "Login data received successfully",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};




module.exports = { joinHandler , loginHandler};
