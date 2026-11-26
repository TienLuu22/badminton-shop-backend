const Cart = require('../models/Cart');
require('../models/Product');

// 1. LẤY GIỎ HÀNG CỦA KHÁCH (GET /api/carts/:userId)
const getCartByUser = async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.params.userId })
      .populate('items.productId', 'name slug images variants');

    if (!cart) {
      cart = await Cart.create({ userId: req.params.userId, items: [] });
    }

    res.status(200).json({ success: true, data: cart });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi lấy giỏ hàng', error: error.message });
  }
};

// 2. THÊM SẢN PHẨM VÀO GIỎ HÀNG (POST /api/carts/add)
const addToCart = async (req, res) => {
  try {
    const { userId, productId, sku, quantity = 1, stringingOption = null } = req.body;
    const normalizedSku = sku.toUpperCase();

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    // Kiểm tra trùng sản phẩm + SKU + thông số đan cước (khác kiểu đan sẽ tách thành dòng riêng)
    const existingIndex = cart.items.findIndex(item =>
      item.productId.toString() === productId &&
      item.sku === normalizedSku &&
      JSON.stringify(item.stringingOption || null) === JSON.stringify(stringingOption || null)
    );

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity += Number(quantity);
    } else {
      cart.items.push({
        productId,
        sku: normalizedSku,
        quantity: Number(quantity),
        stringingOption
      });
    }

    await cart.save();
    res.status(200).json({
      success: true,
      message: 'Đã thêm sản phẩm vào giỏ hàng',
      data: cart
    });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Không thể thêm vào giỏ', error: error.message });
  }
};

// 3. XÓA 1 MÓN KHỎI GIỎ HÀNG (DELETE /api/carts/:userId/items/:itemId)
const removeCartItem = async (req, res) => {
  try {
    const targetSku = req.params.itemId.toUpperCase();
    const updatedCart = await Cart.findOneAndUpdate(
      { userId: req.params.userId },
      { $pull: { items: { sku: targetSku } } },
      { new: true }
    );

    if (!updatedCart) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy giỏ hàng' });
    }

    res.status(200).json({
      success: true,
      message: 'Đã xóa sản phẩm khỏi giỏ hàng',
      data: updatedCart
    });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Lỗi khi xóa sản phẩm', error: error.message });
  }
};

// 4. CẬP NHẬT SỐ LƯỢNG MÓN TRONG GIỎ (PATCH /api/carts/:userId/items/:itemId)
const updateCartItemQuantity = async (req, res) => {
  try {
    const { quantity } = req.body;
    const newQty = Number(quantity);
    const targetSku = req.params.itemId.toUpperCase();

    // Nếu số lượng <= 0 thì xóa luôn món đó khỏi giỏ theo sku
    if (newQty <= 0) {
      const updatedCart = await Cart.findOneAndUpdate(
        { userId: req.params.userId },
        { $pull: { items: { sku: targetSku } } },
        { new: true }
      );
      return res.status(200).json({ success: true, message: 'Đã xóa món khỏi giỏ', data: updatedCart });
    }

    // Cập nhật đúng phần tử có sku khớp trong mảng items bằng toán tử $
    const updatedCart = await Cart.findOneAndUpdate(
      { userId: req.params.userId, 'items.sku': targetSku },
      { $set: { 'items.$.quantity': newQty } },
      { new: true }
    );

    if (!updatedCart) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm trong giỏ' });
    }

    res.status(200).json({
      success: true,
      message: 'Đã cập nhật số lượng',
      data: updatedCart
    });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Lỗi cập nhật số lượng', error: error.message });
  }
};

module.exports = {
  getCartByUser,
  addToCart,
  removeCartItem,
  updateCartItemQuantity
};