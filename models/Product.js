const mongoose = require('mongoose');

const decimalToNumber = (val) => (val != null ? parseFloat(val.toString()) : null);

const variantSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true, trim: true, uppercase: true },
    attributes: { type: mongoose.Schema.Types.Mixed, default: {} },
    price: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      get: decimalToNumber
    },
    salePrice: {
      type: mongoose.Schema.Types.Decimal128,
      default: null,
      get: decimalToNumber
    },
    stock: { type: Number, required: true, min: 0, default: 0 }
  },
  { _id: false, toJSON: { getters: true }, toObject: { getters: true } }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true
    },
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: true,
      index: true
    },
    description: { type: String, default: '' },
    images: { type: [String], default: [] },
    specifications: { type: mongoose.Schema.Types.Mixed, default: {} },
    variants: { type: [variantSchema], default: [] },
    ratingAverage: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ['active', 'inactive', 'out_of_stock'],
      default: 'active'
    }
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true }
  }
);

productSchema.index({ 'variants.sku': 1 }, { unique: true, sparse: true });
productSchema.index(
  { name: 'text', 'variants.sku': 'text' },
  { weights: { name: 10, 'variants.sku': 5 } }
);

module.exports = mongoose.model('Product', productSchema);