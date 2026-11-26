const { json } = require('express');
const Product =  require('../models/Product');
require('../models/Brand');
require('../models/Category');

const getAllProducts = async(req, res) => {
    try{
        const products = await Product.find({status: 'active'})
            .populate('brandId', 'name slug country')
            .populate('categoryId', 'name slug')
            .sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: products.length,
            data: products
        });
    }catch(error){
        res.status(500).json({
            success: false,
            message: 'Loi may chu khi lay san pham',
            error: error.message
        });
    }
}; 

const getProductBySlug = async (req, res) =>{
    try{
        const product = await Product.findOne({ slug: req.params.slug })
            .populate('brandId', 'name slug country')
            .populate('categoryId', 'name slug');
        if(!product){
            return res.status(404).json({
                success: false,
                message: 'khong tim thay san pham'
            });
        }

        res.status(200).json({
            success: true,
            data: product
        });
    }catch(error){
    res.status(500).json({
        success:false,
        message: 'Loi may chu',
        error: error.message
    });
    }
};

const  createProduct = async(req, res) => {
    try{
        const newProduct = await Product.create(req.body);
        res.status(201).json({
            success: true,
            data: newProduct
        });
    }catch(error){
        res.status(400).json({
            success: false,
            message: 'du lieu khong dung',
            error : error.message
        });
    }
};

const updateProduct =  async(req, res) => {
    try{
        const updatedProduct = await Product.findByIdAndUpdate(req.params.id, 
            {$set: req.body},
            {$new: true, runValidators: true}
        );
        if(!updatedProduct){
            return res.status(404).json({
                success: false,
                message: 'khong tim thay san pham cap nhat'
            });
        }
        res.status(200).json({
            success: true,
            data: updatedProduct
        });
    }catch(error){
        res.status(400).json({
            success: false,
            message: 'loi khi cap nhat',
            error : error.message
        });
    }
};

const decreaseVariantStock = async (req, res) =>
{
    try{
        const { sku, quantity } = req.body;
        const updatedProduct = await Product.findOneAndUpdate(
            {
                _id: req.params.id,
                variants:{
                    $elemMatch: {sku: sku.toUpperCase(), stock: { $gte: quantity}} 
                }
            },
            {
                $inc: { 'variants.$.stock': -quantity}
            },
            {new: true}
        );
        if(!updatedProduct) {
            return res.status(400).json({
                success: false,
                message: 'Khong tim thay ton kho, hay SKU'
            });
        }
        res.status(200),json({
            success: true,
            data: updatedProduct
        });
    }catch(error){
        res.status(400).json({
            success: false,
            message: 'Loi tru ton kho',
            error : error.message
        });
    
    }
};

const deleteProduct = async (req, res) =>{
    try{
        const deleteProduct = await Product.findByIdAndDelete(req.params.id);
        
        if(!deleteProduct){
            return res.status(404).json({
                success: false,
                message: 'Khong thay san pham can xoa'
            });
        }
        res.status(200).json({
            success: true,
            message: "da xoa san pham thanh cong"
        });
    } catch(error){
        res.status(400).json({
            success: false,
            message: "Loi khi xoa san pham",
            error : error.message
        });
    }
};

module.exports = {
    getAllProducts, 
    getProductBySlug,
    createProduct,
    updateProduct,
    decreaseVariantStock,
    deleteProduct

};
