const mongoose = require('mongoose');

const inventoryLogSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    sku: { type: String, required: true, trim: true, uppercase: true },
    type: {
      type: String,
      enum: ['import', 'export', 'adjustment', 'return'],
      required: true
    },
    quantityChange: { type: Number, required: true },
    stockBefore: { type: Number, required: true, min: 0 },
    stockAfter: { type: Number, required: true, min: 0 },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    note: { type: String, default: '' }
  },
  {
    collection: 'inventory_logs',
    timestamps: { createdAt: true, updatedAt: false }
  }
);

inventoryLogSchema.index({ productId: 1, sku: 1, createdAt: -1 });
inventoryLogSchema.index({ orderId: 1 });

module.exports = mongoose.model('InventoryLog', inventoryLogSchema);