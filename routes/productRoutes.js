const express =  require('express');
const router = express.Router();
const {
    getAllProducts, 
    getProductBySlug,
    createProduct,
    updateProduct,
    decreaseVariantStock,
    deleteProduct
} = require('../controllers/productController');
 
router.get('/', getAllProducts);
router.get('/:slug', getProductBySlug);
router.post('/',createProduct);
router.patch('/:id', updateProduct);
router.patch('/:id/stock',decreaseVariantStock);
router.delete('/:id', deleteProduct);

module.exports = router;
