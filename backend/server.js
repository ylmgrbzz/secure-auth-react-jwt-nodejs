require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/auth");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB bağlantısı
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB bağlantısı başarılı"))
  .catch((err) => console.error("MongoDB bağlantı hatası:", err));

// Routes
app.use("/api/auth", authRoutes);

// Route kontrolü için middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`); // Her isteği logla
  next();
});

// 404 handler
app.use((req, res) => {
  console.log("404 - Route bulunamadı:", req.originalUrl);
  res.status(404).json({
    message: "Route bulunamadı",
    path: req.originalUrl,
    method: req.method,
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error("Hata:", err.stack);
  res.status(500).json({
    message: "Bir şeyler ters gitti!",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
  console.log("Mevcut route'lar:");
  console.log("/api/auth/register - POST");
  console.log("/api/auth/login - POST");
  console.log("/api/auth/verify-token - POST");
  console.log("/api/auth/me - GET");
  console.log("/api/auth/logout - POST");
});
