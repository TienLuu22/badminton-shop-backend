const express = require('express');
const router = express.Router();

const{
    createReview,
    getReviewByProduct
}= require('../controllers/reviewController');
const { route } = require('./productRoutes');

router.post('/', createReview);
router.get('/product/:productId',getReviewByProduct);

module.exports = router;
