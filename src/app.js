import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
const app= express()
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))
app.use(express.json({limit:"16kb"}))//form fill k bad data ata tb h
app.use(expree.urlencoded({extended:true,limit:"16kb"}))//url se ata
app.use(express.static("public"))//file folder store in server
app.use(cookieParser())

export {app}