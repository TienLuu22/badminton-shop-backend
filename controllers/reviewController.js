const { countDocuments } = require('../models/Brand');
const Review = require('../models/Review');
require('../models/User');
require('../models/Product');

const createReview = async(req, res) => {
    try{
        const newReview = await Review.create(req.body);
        res.status(201).json({
            success: true,
            data: newReview
        });

    }catch(error){
        res.status(400).json({
            success: false,
            message: 'khong the tao danh gia',
            error: error.message
        });
    }
};

const getReviewByProduct = async(req, res) => {
    try{
        const reviews = await Review.find({productId: req.params.productId})
        .populate('userId', 'fullName')
        .sort({ createdAt: -1 });
    res.status(200).json({
        success: true,
        count: reviews.length,
        data: reviews
    });  
    }catch(error){
        res.status(500).json({
            success: false,
            message: 'loi may chu khi lay danh gia',
            error: error.message
            
        });
    }
};

module.exports = {
    createReview,
    getReviewByProduct
};
