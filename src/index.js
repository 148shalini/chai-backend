// require('dotenv').config({path: './env'})
import dotenv from"dotenv";

import connectDB from "./db/index.js";

dotenv.config({
    path:'./env'
})

connectDB()












/*
//ifii fun  imeediate execute  
import  express from "express";
const app =express()
(async()=>{
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("errror",(error)=>{
            console.log("ERR:",error);
            throw err
        }) //listner when database connect
        app.listen(process.env.PORT,()=>{
            console.log(`App is listening on port $ {process.env.PORT}`);
        })
    } catch (error) {
        console.error("ERROR:",error)
        throw err
    }
})()

*/