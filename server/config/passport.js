const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const googleId = profile.id;

        // Check if user already exists with this email
        let user = await User.findOne({ email });

        if (user) {
          // Link googleId if not already linked
          if (!user.googleId) {
            user.googleId = googleId;
            await user.save();
          }
          return done(null, user);
        }

        // New Google user — create with minimal required fields
        // Username = google id (unique), they can update later
        user = await User.create({
          email,
          googleId,
          username: `user_${googleId.slice(0, 8)}${Math.random().toString(36).slice(2, 6)}`,
          fullName: profile.displayName || "",
          profilePicture: profile.photos?.[0]?.value || null,
          password: null,
          age: 18, // default, let them update later
          country: "US", // default, let them update later
          termsAccepted: true,
        });

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    },
  ),
);
