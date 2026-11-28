const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrdersByUser,
  checkoutFromCart,
  getOrderById,
  cancelOrder,
  getAllOrdersAdmin,
  updateOrderStatusAdmin 
} = require('../controllers/orderController');
const{ requireAdmin } = require('../middleware/adminAuth')

router.post('/', createOrder);                   // POST  /api/orders
router.post('/checkout', checkoutFromCart);      // POST  /api/orders/checkout
router.get('/user/:userId', getOrdersByUser);    // GET   /api/orders/user/:userId
router.get('/:orderId', getOrderById);           // GET   /api/orders/:orderId
router.patch('/:orderId/cancel', cancelOrder);   // PATCH /api/orders/:orderId/cancel
router.get('/admin/all', requireAdmin, getAllOrdersAdmin);
router.patch('/admin/:orderId/status', requireAdmin, updateOrderStatusAdmin);

module.exports = router;