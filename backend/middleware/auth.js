const jwt = require("jsonwebtoken");
const User = require("../models/User");
const BlacklistedToken = require("../models/BlacklistedToken");

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new Error("Token bulunamadı");
    }

    // Token blacklist kontrolü
    const isBlacklisted = await BlacklistedToken.findOne({ token });
    if (isBlacklisted) {
      throw new Error("Token geçersiz");
    }

    // Token doğrulama
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.userId) {
      throw new Error("Geçersiz token");
    }

    // Kullanıcı kontrolü
    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new Error("Kullanıcı bulunamadı");
    }

    // Request nesnesine kullanıcı ve token bilgilerini ekle
    req.user = user;
    req.token = token;
    req.userId = decoded.userId;

    next();
  } catch (error) {
    res.status(401).json({
      message: error.message || "Lütfen giriş yapın",
      error: "AuthenticationError",
    });
  }
};

module.exports = auth;
