const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  receiverName: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  province: { type: String, required: true, trim: true },
  district: { type: String, required: true, trim: true },
  ward: { type: String, required: true, trim: true },
  street: { type: String, required: true, trim: true },
  isDefault: { type: Boolean, default: false }
});

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, default: null },
    passwordHash: { type: String, required: true },
    phone: { type: String, trim: true, default: null },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
    status: { type: String, enum: ['active', 'blocked'], default: 'active' },
    addresses: { type: [addressSchema], default: [] }
  },
  { timestamps: true }
);

// Đồng bộ Partial Unique Index với MongoDB
userSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { email: { $type: 'string' } } }
);
userSchema.index(
  { phone: 1 },
  { unique: true, partialFilterExpression: { phone: { $type: 'string' } } }
);

// Ràng buộc nghiệp vụ: Phải có ít nhất email hoặc phone
userSchema.pre('validate', function (next) {
  if (!this.email && !this.phone) {
    this.invalidate('email', 'Vui lòng cung cấp Email hoặc Số điện thoại.');
  }
  next();
});

module.exports = mongoose.model('User', userSchema);