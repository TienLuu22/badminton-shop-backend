const mongoose = require('mongoose');

const decimalToNumber = (val) => (val != null ? parseFloat(val.toString()) : 0);

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    sku: { type: String, required: true },
    attributes: { type: mongoose.Schema.Types.Mixed, default: {} },
    price: { type: mongoose.Schema.Types.Decimal128, required: true, get: decimalToNumber },
    quantity: { type: Number, required: true, min: 1 }
  },
  { _id: false, toJSON: { getters: true } }
);

const orderSchema = new mongoose.Schema(
  {
    orderCode: { type: String, required: true, unique: true, uppercase: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: { type: [orderItemSchema], required: true },
    shippingAddress: {
      receiverName: { type: String, required: true },
      phone: { type: String, required: true },
      province: { type: String, required: true },
      district: { type: String, required: true },
      ward: { type: String, required: true },
      street: { type: String, required: true }
    },
    paymentMethod: {
      type: String,
      enum: ['cod', 'banking', 'momo', 'vnpay'],
      default: 'cod'
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'refunded'],
      default: 'unpaid'
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'],
      default: 'pending'
    },
    shippingFee: { type: mongoose.Schema.Types.Decimal128, default: 0, get: decimalToNumber },
    totalAmount: { type: mongoose.Schema.Types.Decimal128, required: true, get: decimalToNumber },
    note: { type: String, default: '' }
  },
  { timestamps: true, toJSON: { getters: true }, toObject: { getters: true } }
);

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ 'shippingAddress.province': 1, status: 1 });

module.exports = mongoose.model('Order', orderSchema);