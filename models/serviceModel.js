const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },

  service: {
    type: String,
    required: true,
  },

  price: {
    type: Number,
    required: true,
  },
});

module.exports = mongoose.model("Service", serviceSchema);
