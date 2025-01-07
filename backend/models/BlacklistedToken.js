const mongoose = require("mongoose");

const blacklistedTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 7 * 24 * 60 * 60, // 7 gün sonra otomatik silinir
  },
});

const BlacklistedToken = mongoose.model(
  "BlacklistedToken",
  blacklistedTokenSchema
);

module.exports = BlacklistedToken;
