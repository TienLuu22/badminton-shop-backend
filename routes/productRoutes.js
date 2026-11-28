const express =  require('express');
const router = express.Router();
const Brand = require('../models/Brand');
const Category = require('../models/Category')
const {
    getAllProducts, 
    getProductBySlug,
    createProduct,
    updateProduct,
    decreaseVariantStock,
    deleteProduct
} = require('../controllers/productController');
const{ requireAdmin } = require('../middleware/adminAuth');

// Lấy danh sách thương hiệu & danh mục cho dropdown Admin
router.get('/meta/options', async (req, res) => {
  try {
    const [brands, categories] = await Promise.all([
      Brand.find({}).sort({ name: 1 }),
      Category.find({}).sort({ name: 1 })
    ]);
    res.status(200).json({ success: true, data: { brands, categories } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/', getAllProducts);
router.get('/:slug', getProductBySlug);
router.post('/',createProduct);
router.patch('/:id', updateProduct);
router.patch('/:id/stock',decreaseVariantStock);
router.delete('/:id', deleteProduct);

module.exports = router;
