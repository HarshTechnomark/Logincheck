const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
    match: /.+\@.+\..+/,
    unique: true,
  },

  password: {
    type: String,
    required: true,
  },

  token: {
    type: String,
    default: "",
  },

  is_admin: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("User", userSchema);
