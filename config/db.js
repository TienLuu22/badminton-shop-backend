const mongoose = require('mongoose');
const connectDB = async () =>{
    try{
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`kET NOI THANH CONG TOI MONGODB : ${conn.connection.name}`);
    }catch(error){
        console.error(`Loi ket noi Mongodb:`, error.message);
        process.exit(1);
    }
    
};

module.exports = connectDB;