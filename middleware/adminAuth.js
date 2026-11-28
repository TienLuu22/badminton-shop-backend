const User = require('../models/User');

const requireAdmin = async (req, res, next) => {
  try {
    const adminId = req.headers['x-user-id'] || req.body?.adminId;
    if (!adminId) {
      return res.status(401).json({ success: false, message: 'Thiếu thông tin xác thực quản trị viên.' });
    }

    const user = await User.findById(adminId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền thực hiện thao tác quản trị!' });
    }

    req.adminUser = user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Lỗi xác thực quyền Admin: ' + error.message });
  }
};

module.exports = { requireAdmin };