const express = require('express');
const router = express.Router();
const User = require('../models/User');

// POST /api/auth/register - Đăng ký tài khoản mới
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ họ tên, email và mật khẩu.'
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanPhone = (phone || '').trim();

    // Kiểm tra trùng Email hoặc Số điện thoại khi đăng ký
    const queryConditions = [{ email: cleanEmail }];
    if (cleanPhone) queryConditions.push({ phone: cleanPhone });

    const existingUser = await User.findOne({ $or: queryConditions });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email hoặc số điện thoại này đã được đăng ký.'
      });
    }

    const newUser = await User.create({
      fullName: fullName.trim(),
      email: cleanEmail || null,
      phone: cleanPhone || null,
      passwordHash: password,
      role: 'customer'
    });

    res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công!',
      data: {
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        phone: newUser.phone
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi đăng ký: ' + err.message
    });
  }
});

// POST /api/auth/login - Kiểm tra tài khoản tồn tại trước, sau đó mới kiểm tra mật khẩu
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const identifier = (email || '').trim();

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập email/số điện thoại và mật khẩu.'
      });
    }

    // Bước 1: Tìm tài khoản trong MongoDB theo Email hoặc Số điện thoại
    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { phone: identifier }
      ]
    });

    // Nếu không tìm thấy -> Báo rõ tài khoản không tồn tại
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Tài khoản không tồn tại. Vui lòng kiểm tra lại hoặc chuyển sang tab Đăng ký!'
      });
    }

    // Bước 2: Đã tìm thấy tài khoản -> Kiểm tra mật khẩu
    const savedPassword = user.passwordHash || user.password;
    if (savedPassword !== password) {
      return res.status(401).json({
        success: false,
        message: 'Mật khẩu không chính xác. Vui lòng thử lại.'
      });
    }

    res.json({
      success: true,
      message: 'Đăng nhập thành công!',
      data: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi đăng nhập: ' + err.message
    });
  }
});

module.exports = router;