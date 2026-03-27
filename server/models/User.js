// const mongoose = require("mongoose");

// const userSchema = new mongoose.Schema(
//   {
//     // AUTH BASICS
//     username: {
//       type: String,
//       required: true,
//       unique: true,
//       trim: true,
//       minlength: 3,
//       maxlength: 20,
//     },

//     fullName: {
//       type: String,
//       trim: true,
//       maxlength: 50,
//       default: "",
//     },

//     email: {
//       type: String,
//       required: true,
//       unique: true,
//       lowercase: true,
//       trim: true,
//     },

//     password: {
//       type: String,
//       required: true,
//       minlength: 6,
//     },

//     // PROFILE INFO
//     bio: {
//       type: String,
//       maxlength: 150,
//       default: "",
//     },

//     // 🌍 COUNTRY (keep existing)
//     country: {
//       type: String, // ISO code like "IN", "US"
//       required: true,
//       trim: true,
//     },

//     // ✅ OPTIONAL (recommended for future use)
//     countryCode: {
//       type: String,
//       trim: true,
//       minlength: 2,
//       maxlength: 2,
//     },

//     // 🚻 GENDER
//     gender: {
//       type: String,
//       enum: ["male", "female", "non_binary", "prefer_not_to_say"],
//       default: "prefer_not_to_say",
//     },

//     profilePicture: {
//       type: String,
//       default: null,
//     },

//     avatarMeta: {
//       publicId: String,
//       blurHash: String,
//     },

//     age: {
//       type: Number,
//       required: true,
//       min: 16,
//     },

//     postsCount: {
//       type: Number,
//       default: 0,
//     },

//     // SOCIAL GRAPH
//     followers: [
//       {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "User",
//       },
//     ],

//     following: [
//       {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "User",
//       },
//     ],

//     // SAFETY & MODERATION
//     blockedUsers: [
//       {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "User",
//       },
//     ],

//     reportedUsers: [
//       {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "User",
//       },
//     ],

//     // ACCOUNT STATUS
//     isActive: {
//       type: Boolean,
//       default: true,
//     },
//   },
//   { timestamps: true },
// );

// module.exports = mongoose.model("User", userSchema);


const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // AUTH BASICS
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
    },

    fullName: {
      type: String,
      trim: true,
      maxlength: 50,
      default: "",
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    // ✅ changed required: false so Google users don't need a password
    password: {
      type: String,
      minlength: 6,
      default: null,
      validate: {
        validator: function () {
          // password is required ONLY if user has no googleId
          if (!this.googleId) {
            return this.password != null && this.password.length >= 6;
          }
          return true; // Google users don't need a password
        },
        message: "Password is required for non-Google users",
      },
    },

    // ✅ NEW: Google OAuth field
    googleId: {
      type: String,
      default: null,
    },

    // PROFILE INFO
    bio: {
      type: String,
      maxlength: 150,
      default: "",
    },

    // 🌍 COUNTRY
    country: {
      type: String,
      required: true,
      trim: true,
    },

    countryCode: {
      type: String,
      trim: true,
      minlength: 2,
      maxlength: 2,
    },

    // 🚻 GENDER
    gender: {
      type: String,
      enum: ["male", "female", "non_binary", "prefer_not_to_say"],
      default: "prefer_not_to_say",
    },

    profilePicture: {
      type: String,
      default: null,
    },

    avatarMeta: {
      publicId: String,
      blurHash: String,
    },

    age: {
      type: Number,
      required: true,
      min: 16,
    },

    postsCount: {
      type: Number,
      default: 0,
    },

    // SOCIAL GRAPH
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // SAFETY & MODERATION
    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    reportedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // ACCOUNT STATUS
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
