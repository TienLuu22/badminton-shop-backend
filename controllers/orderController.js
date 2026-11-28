const Order = require('../models/Order');
const Product = require('../models/Product');
require('../models/User');

// 1. CREATE: Đặt đơn hàng mới (Tự động kiểm tra & trừ tồn kho từng phân loại)
const createOrder = async (req, res) => {
  try {
    const { userId, items, shippingAddress, paymentMethod, shippingFee = 0, note = '' } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Giỏ hàng trống, không thể đặt đơn' });
    }

    let subtotal = 0;
    const orderItemsSnapshot = [];

    // Duyệt từng món khách đặt để kiểm tra tồn kho và chụp bản sao (Snapshot) giá/tên
    for (const item of items) {
      const product = await Product.findOneAndUpdate(
        {
          _id: item.productId,
          variants: {
            $elemMatch: { sku: item.sku.toUpperCase(), stock: { $gte: item.quantity } }
          }
        },
        {
          $inc: { 'variants.$.stock': -item.quantity } // Trừ tồn kho nguyên tử
        },
        { new: true }
      );

      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Sản phẩm (SKU: ${item.sku}) đã hết hàng hoặc không đủ số lượng`
        });
      }

      // Tìm đúng biến thể khách mua để lấy giá hiện hành tại thời điểm đặt
      const variant = product.variants.find(v => v.sku === item.sku.toUpperCase());
      const unitPrice = variant.salePrice != null ? parseFloat(variant.salePrice.toString()) : parseFloat(variant.price.toString());

      subtotal += unitPrice * item.quantity;

      // Lưu cứng Snapshot vào đơn hàng để tránh sai lệch nếu sau này shop đổi giá
      orderItemsSnapshot.push({
        productId: product._id,
        productName: product.name,
        sku: variant.sku,
        attributes: variant.attributes || {},
        price: unitPrice,
        quantity: item.quantity
      });
    }

    // Tạo mã đơn hàng tự động (VD: ORD-1732610000123)
    const orderCode = `ORD-${Date.now()}`;
    const totalAmount = subtotal + Number(shippingFee);

    const newOrder = await Order.create({
      orderCode,
      userId,
      items: orderItemsSnapshot,
      shippingAddress,
      paymentMethod,
      shippingFee,
      totalAmount,
      note
    });

    res.status(201).json({
      success: true,
      message: 'Đặt hàng thành công!',
      data: newOrder
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Lỗi khi tạo đơn hàng',
      error: error.message
    });
  }
};

// 2. READ + POPULATE: Lấy lịch sử đơn hàng của 1 khách hàng
const getOrdersByUser = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.userId })
      .populate('userId', 'fullName phone email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy danh sách đơn hàng',
      error: error.message
    });
  }
};

const Cart = require('../models/Cart');

// 3. THANH TOÁN TRỰC TIẾP TỪ GIỎ HÀNG (POST /api/orders/checkout)
const checkoutFromCart = async (req, res) => {
  try {
    const { userId, shippingAddress, paymentMethod = 'cod', shippingFee = 30000, note = '' } = req.body;

    // 1. Lấy giỏ hàng hiện tại của khách
    const cart = await Cart.findOne({ userId });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Giỏ hàng đang trống, không thể thanh toán' });
    }

    let subtotal = 0;
    const orderItemsSnapshot = [];

    // 2. Kiểm tra tồn kho & trừ kho từng món trong giỏ
    for (const item of cart.items) {
      const product = await Product.findOneAndUpdate(
        {
          _id: item.productId,
          variants: { $elemMatch: { sku: item.sku, stock: { $gte: item.quantity } } }
        },
        { $inc: { 'variants.$.stock': -item.quantity } },
        { new: true }
      );

      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Sản phẩm (SKU: ${item.sku}) không đủ tồn kho để thanh toán`
        });
      }

      const variant = product.variants.find(v => v.sku === item.sku);
      const basePrice = variant.salePrice != null
        ? parseFloat(variant.salePrice.toString())
        : parseFloat(variant.price.toString());
      const stringingFee = item.stringingOption?.fee ? Number(item.stringingOption.fee) : 0;
      const finalUnitPrice = basePrice + stringingFee;

      subtotal += finalUnitPrice * item.quantity;

      orderItemsSnapshot.push({
        productId: product._id,
        productName: product.name,
        sku: variant.sku,
        attributes: variant.attributes || {},
        stringingOption: item.stringingOption || null,
        price: finalUnitPrice,
        quantity: item.quantity
      });
    }

    // 3. Tạo đơn hàng Snapshot
    const newOrder = await Order.create({
      orderCode: `ORD-${Date.now()}`,
      userId,
      items: orderItemsSnapshot,
      shippingAddress,
      paymentMethod,
      shippingFee: Number(shippingFee),
      totalAmount: subtotal + Number(shippingFee),
      paymentStatus: paymentMethod === 'cod' ? 'unpaid' : 'pending',
      note
    });

    // 4. Làm trống giỏ hàng sau khi thanh toán thành công
    await Cart.findOneAndUpdate({ userId }, { $set: { items: [] } });

    res.status(201).json({
      success: true,
      message: 'Thanh toán và tạo đơn hàng thành công!',
      data: newOrder
    });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Lỗi thanh toán', error: error.message });
  }
};

// 4. LẤY CHI TIẾT 1 ĐƠN HÀNG (GET /api/orders/:orderId)
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('userId', 'fullName phone email')
      .populate('items.productId', 'images slug');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi lấy chi tiết đơn hàng', error: error.message });
  }
};

// 5. KHÁCH HỦY ĐƠN HÀNG & HOÀN TỒN KHO (PATCH /api/orders/:orderId/cancel)
const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể hủy đơn hàng khi đang ở trạng thái Chờ xác nhận!'
      });
    }

    // Hoàn trả lại số lượng tồn kho cho từng phân loại SKU
    for (const item of order.items) {
      await Product.findOneAndUpdate(
        { _id: item.productId, 'variants.sku': item.sku },
        { $inc: { 'variants.$.stock': item.quantity } }
      );
    }

    order.status = 'cancelled';
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Đã hủy đơn hàng và hoàn trả tồn kho thành công!',
      data: order
    });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Lỗi khi hủy đơn hàng', error: error.message });
  }
};

// 6. ADMIN: LẤY TOÀN BỘ ĐƠN HÀNG CỦA HỆ THỐNG (GET /api/orders/admin/all)
const getAllOrdersAdmin = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('userId', 'fullName email phone')
      .populate('items.productId', 'images slug')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi lấy danh sách đơn hàng Admin', error: error.message });
  }
};

// 7. ADMIN: CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG (PATCH /api/orders/admin/:orderId/status)
const updateOrderStatusAdmin = async (req, res) => {
  try {
    const { status, paymentStatus } = req.body;
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    const prevStatus = order.status;

    // Nếu chuyển sang 'cancelled' từ trạng thái chưa hủy -> tự động hoàn trả tồn kho
    if (status === 'cancelled' && prevStatus !== 'cancelled') {
      for (const item of order.items) {
        await Product.findOneAndUpdate(
          { _id: item.productId, 'variants.sku': item.sku },
          { $inc: { 'variants.$.stock': item.quantity } }
        );
      }
    }

    if (status) order.status = status;
    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    } else if (status === 'delivered' && order.paymentStatus !== 'paid') {
      order.paymentStatus = 'paid'; // Giao thành công mặc định thu đủ tiền
    }

    await order.save();
    res.status(200).json({
      success: true,
      message: 'Đã cập nhật trạng thái đơn hàng!',
      data: order
    });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Lỗi cập nhật trạng thái đơn', error: error.message });
  }
};

module.exports = {
  createOrder, 
  getOrdersByUser, 
  checkoutFromCart, 
  getOrderById, 
  cancelOrder, 
  getAllOrdersAdmin, 
  updateOrderStatusAdmin 
};
