const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const BlacklistedToken = require("../models/BlacklistedToken");
const auth = require("../middleware/auth");

const router = express.Router();

// Token oluşturma fonksiyonu
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "24h", // Token süresini 24 saate indirdik
  });
};

// Kayıt olma
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Email kontrolü
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: "Bu email adresi zaten kullanımda",
        error: "DuplicateEmailError",
      });
    }

    // Yeni kullanıcı oluştur
    const user = new User({ name, email, password });
    await user.save();

    // Token oluştur
    const token = generateToken(user._id);

    // Başarılı yanıt
    res.status(201).json({
      message: "Kayıt başarılı",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Validasyon hatası",
        errors: Object.values(error.errors).map((err) => err.message),
        errorType: "ValidationError",
      });
    }
    res.status(400).json({
      message: "Kayıt işlemi başarısız",
      error: error.message,
      errorType: "RegistrationError",
    });
  }
});

// Giriş yapma
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Kullanıcıyı bul (şifre ile birlikte)
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({
        message: "Geçersiz email veya şifre",
        error: "AuthenticationError",
      });
    }

    // Şifreyi kontrol et
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        message: "Geçersiz email veya şifre",
        error: "AuthenticationError",
      });
    }

    // Son giriş zamanını güncelle
    user.lastLogin = new Date();
    await user.save();

    // Token oluştur
    const token = generateToken(user._id);

    // Başarılı yanıt
    res.json({
      message: "Giriş başarılı",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        lastLogin: user.lastLogin,
      },
      token,
    });
  } catch (error) {
    res.status(400).json({
      message: "Giriş işlemi başarısız",
      error: error.message,
      errorType: "LoginError",
    });
  }
});

// Kullanıcı bilgilerini getir
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        message: "Kullanıcı bulunamadı",
        error: "UserNotFoundError",
      });
    }

    res.json({
      message: "Kullanıcı bilgileri başarıyla getirildi",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(400).json({
      message: "Kullanıcı bilgileri getirilemedi",
      error: error.message,
      errorType: "FetchUserError",
    });
  }
});

// Çıkış yapma
router.post("/logout", auth, async (req, res) => {
  try {
    // Token'ı blacklist'e ekle
    const blacklistedToken = new BlacklistedToken({
      token: req.token,
      userId: req.userId,
    });
    await blacklistedToken.save();

    // Başarılı yanıt
    res.json({
      message: "Başarıyla çıkış yapıldı",
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      message: "Çıkış işlemi başarısız",
      error: error.message,
      errorType: "LogoutError",
    });
  }
});

// Token kontrolü
router.post("/verify-token", async (req, res) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        message: "Token bulunamadı",
        error: "TokenRequiredError",
      });
    }

    // Blacklist kontrolü
    const isBlacklisted = await BlacklistedToken.findOne({ token });
    if (isBlacklisted) {
      return res.status(401).json({
        message: "Token geçersiz",
        error: "InvalidTokenError",
      });
    }

    // Token doğrulama
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        message: "Geçersiz token",
        error: "InvalidTokenError",
      });
    }

    res.json({
      message: "Token geçerli",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        message: "Token geçersiz veya süresi dolmuş",
        error: error.name,
      });
    }
    res.status(401).json({
      message: "Token doğrulanamadı",
      error: error.message,
      errorType: "TokenVerificationError",
    });
  }
});

module.exports = router;
