const mongoose = require("mongoose");
require("dotenv").config();

const conn = async(req,res)=>{
    try{
        await mongoose.connect(process.env.MONGOURI);
       console.log("DB CONNECTED SUCCESSFULLY");
    }catch(err){
        console.log("FAILED TO CONNECT DB");
        process.exit(1)
    }
    
}


module.exports = conn;