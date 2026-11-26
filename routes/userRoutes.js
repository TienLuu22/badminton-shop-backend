const express = require('express');
const router = express.Router();
const { registerUser, loginUser, addAddress } = require('../controllers/userController');

router.post('/register', registerUser);        // POST /api/users/register
router.post('/login', loginUser);              // POST /api/users/login
router.post('/:id/addresses', addAddress);     // POST /api/users/:id/addresses

module.exports = router;