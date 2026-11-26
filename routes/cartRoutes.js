const express = require('express');
const router = express.Router();
const { getCartByUser, addToCart, removeCartItem, updateCartItemQuantity } = require('../controllers/cartController');

router.get('/:userId', getCartByUser);                       // GET    /api/carts/:userId
router.post('/add', addToCart);                              // POST   /api/carts/add
router.delete('/:userId/items/:itemId', removeCartItem);     // DELETE /api/carts/:userId/items/:itemId
router.patch('/:userId/items/:itemId', updateCartItemQuantity); // PATCH /api/carts/:userId/items/:itemId
module.exports = router;