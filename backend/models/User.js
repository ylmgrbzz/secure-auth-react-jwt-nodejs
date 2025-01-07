const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "İsim alanı zorunludur"],
      trim: true,
      minlength: [3, "İsim en az 3 karakter olmalıdır"],
      maxlength: [50, "İsim en fazla 50 karakter olabilir"],
    },
    email: {
      type: String,
      required: [true, "Email alanı zorunludur"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Geçerli bir email adresi giriniz",
      ],
    },
    password: {
      type: String,
      required: [true, "Şifre alanı zorunludur"],
      minlength: [6, "Şifre en az 6 karakter olmalıdır"],
      select: false, // Varsayılan olarak şifreyi getirme
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Şifre hashleme middleware
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Şifre karşılaştırma metodu
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error("Şifre karşılaştırma hatası");
  }
};

// Hassas verileri JSON'dan çıkar
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.__v;
  return user;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
