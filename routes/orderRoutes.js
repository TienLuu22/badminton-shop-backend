const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrdersByUser,
  checkoutFromCart,
  getOrderById,
  cancelOrder
} = require('../controllers/orderController');

router.post('/', createOrder);                   // POST  /api/orders
router.post('/checkout', checkoutFromCart);      // POST  /api/orders/checkout
router.get('/user/:userId', getOrdersByUser);    // GET   /api/orders/user/:userId
router.get('/:orderId', getOrderById);           // GET   /api/orders/:orderId
router.patch('/:orderId/cancel', cancelOrder);   // PATCH /api/orders/:orderId/cancel

module.exports = router;