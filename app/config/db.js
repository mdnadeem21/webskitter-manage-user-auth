const mongoose = require('mongoose');


const connectDB=async()=>{
    try{

        const conn=await mongoose.connect(process.env.MONGODB_URL);
        console.log('mongodb connected');
    }catch(err){
        console.log(err);
       
    }

}

module.exports=connectDB;