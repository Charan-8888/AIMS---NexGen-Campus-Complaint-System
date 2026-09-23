const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[0-9]{10}$/, 'Phone must be a 10-digit number'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false, // Never return password in queries by default
    },
    role: {
      type: String,
      enum: ['USER', 'STAFF', 'MANAGER', 'ADMIN'],
      default: 'USER',
    },
    department: {
      type: String,
      trim: true,
    },
    studentId: {
      type: String,
      trim: true,
      sparse: true,
    },
    employeeId: {
      type: String,
      trim: true,
      sparse: true,
    },
    profileImage: {
      url: String,
      publicId: String, // Cloudinary public_id
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Password reset
    passwordResetToken: String,
    passwordResetExpires: Date,
    // Track last login
    lastLoginAt: Date,
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => {
        delete ret.passwordHash;
        delete ret.passwordResetToken;
        delete ret.passwordResetExpires;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ─── Indexes ───────────────────────────────────────────────────────────────
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// ─── Pre-save Hook: hash password ─────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

// ─── Methods ───────────────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
