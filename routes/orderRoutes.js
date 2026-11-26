const express = require('express');
const router = express.Router();
const { createOrder, getOrdersByUser, checkoutFromCart } = require('../controllers/orderController');

router.post('/', createOrder);                   // POST /api/orders
router.get('/user/:userId', getOrdersByUser);    // GET  /api/orders/user/:userId
router.post('/checkout', checkoutFromCart); // POST /api/orders/checkout

module.exports = router;