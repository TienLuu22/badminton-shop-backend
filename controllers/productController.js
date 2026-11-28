const Product = require('../models/Product');
require('../models/Brand');
require('../models/Category');

const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({ status: 'active' })
      .populate('brandId', 'name slug country')
      .populate('categoryId', 'name slug')
      .sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy sản phẩm',
      error: error.message
    });
  }
};

const getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug })
      .populate('brandId', 'name slug country')
      .populate('categoryId', 'name slug');
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ',
      error: error.message
    });
  }
};

const createProduct = async (req, res) => {
  try {
    const newProduct = await Product.create(req.body);
    res.status(201).json({
      success: true,
      data: newProduct
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Dữ liệu không đúng',
      error: error.message
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm cập nhật'
      });
    }
    res.status(200).json({
      success: true,
      data: updatedProduct
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Lỗi khi cập nhật',
      error: error.message
    });
  }
};

const decreaseVariantStock = async (req, res) => {
  try {
    const { sku, quantity } = req.body;
    const updatedProduct = await Product.findOneAndUpdate(
      {
        _id: req.params.id,
        variants: {
          $elemMatch: { sku: sku.toUpperCase(), stock: { $gte: quantity } }
        }
      },
      {
        $inc: { 'variants.$.stock': -quantity }
      },
      { new: true }
    );
    if (!updatedProduct) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy tồn kho hoặc SKU'
      });
    }
    res.status(200).json({
      success: true,
      data: updatedProduct
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Lỗi trừ tồn kho',
      error: error.message
    });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);

    if (!deletedProduct) {
      return res.status(404).json({
        success: false,
        message: 'Không thấy sản phẩm cần xóa'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Đã xóa sản phẩm thành công'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Lỗi khi xóa sản phẩm',
      error: error.message
    });
  }
};

module.exports = {
  getAllProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  decreaseVariantStock,
  deleteProduct
};