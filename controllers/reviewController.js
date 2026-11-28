const Review = require('../models/Review');
const Order = require('../models/Order');
require('../models/User');
require('../models/Product');

const createReview = async (req, res) => {
  try {
    const { productId, userId, rating, comment } = req.body;
    let { orderId } = req.body;

    // Tự động tìm đơn hàng chứa sản phẩm này của khách nếu Frontend chưa truyền orderId
    if (!orderId && userId && productId) {
      const matchedOrder = await Order.findOne({ userId, 'items.productId': productId });
      if (!matchedOrder) {
        return res.status(400).json({
          success: false,
          message: 'Bạn cần mua sản phẩm này trước khi gửi đánh giá!'
        });
      }
      orderId = matchedOrder._id;
    }

    const newReview = await Review.findOneAndUpdate(
      { userId, productId, orderId },
      { rating, comment, status: 'approved' },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(201).json({
      success: true,
      data: newReview
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Không thể tạo đánh giá',
      error: error.message
    });
  }
};

const getReviewByProduct = async (req, res) => {
  try {
    const reviews = await Review.find({ productId: req.params.productId })
      .populate('userId', 'fullName')
      .sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy đánh giá',
      error: error.message
    });
  }
};

module.exports = {
  createReview,
  getReviewByProduct
};