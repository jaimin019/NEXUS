const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['admin', 'engineer', 'technician', 'viewer'],
    default: 'engineer',
  },
  plant: { type: String, default: 'Bharat Refinery Unit-3' },
  avatar_initials: { type: String },
  created_at: { type: Date, default: Date.now },
});

// Compute avatar_initials from name before save
userSchema.pre('save', function (next) {
  if (this.isModified('name') || !this.avatar_initials) {
    const parts = this.name.trim().split(/\s+/);
    this.avatar_initials = parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : this.name.substring(0, 2).toUpperCase();
  }
  next();
});

// Never return password in JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
