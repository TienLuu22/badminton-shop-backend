const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Hàm phụ tạo chuỗi JWT Token có hạn 7 ngày
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'badminton_shop_secret_2026',
    { expiresIn: '7d' }
  );
};

// 1. ĐĂNG KÝ TÀI KHOẢN (POST /api/users/register)
const registerUser = async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body;

    // Kiểm tra email đã tồn tại chưa
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email này đã được sử dụng' });
    }

    // Mã hóa mật khẩu trước khi lưu vào MongoDB
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      fullName,
      email: email.toLowerCase(),
      passwordHash,
      phone
    });

    res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công',
      token: generateToken(newUser),
      data: {
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Lỗi đăng ký', error: error.message });
  }
};

// 2. ĐĂNG NHẬP (POST /api/users/login)
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Sai email hoặc mật khẩu' });
    }

    // So sánh mật khẩu nhập vào với chuỗi passwordHash trong DB
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Sai email hoặc mật khẩu' });
    }

    res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công',
      token: generateToken(user),
      data: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        addresses: user.addresses
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi máy chủ', error: error.message });
  }
};

// 3. THÊM ĐỊA CHỈ GIAO HÀNG NHÚNG VỚI $push (POST /api/users/:id/addresses)
const addAddress = async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $push: { addresses: req.body } }, // Nhúng trực tiếp object địa chỉ vào mảng
      { new: true, runValidators: true }
    ).select('-passwordHash'); // Ẩn mật khẩu khi trả về

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    res.status(200).json({
      success: true,
      message: 'Đã thêm địa chỉ giao hàng',
      data: updatedUser.addresses
    });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Không thể thêm địa chỉ', error: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  addAddress
};