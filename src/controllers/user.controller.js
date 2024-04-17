 import { asyncHandler } from "../utils/asyncHandler.js";
 import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { upload } from "../middlewares/multer.middleware.js";
import { ApiResponse } from "../utils/ApiResponse.js";

 const registerUser =asyncHandler(async (req,res) =>{
    //get user detail from frontend
    //validation- not empty
    //chk if user alredy exit:chk username ,email
    //chk for img avatar
    //upload to cloudinary,avtar
    //create user obj-create entry in db
    //remove pass and refers token field from response
    //chk user creation
    //return res

    const {fullName,email,username,password}=req.body
    console.log("email: " ,email);
    if (
        [fullName,email,username,password].some((field)=> field?.trim()==="")
    ) {
        throw new ApiError(400, "All fields are required")
    }
     //exist user
 const existedUser=User.findOne({ 
    $or:[{username},{email}]
 })
 if (existedUser){
    throw new ApiError(409, "user with email and username exists")

 }
 const avatarLocalPath= req.files?.avatar[0]?.path;
 const coverImageLoaclPath=req.file?.coverImage[0]?.path;
 if (!avatarLocalPath) {
    throw new ApiError(400,"Avatar file is required")
    
 }
 const avatar=await uploadOnCloudinary (avatarLocalPath)
 const coverImage=await uploadOnCloudinary(coverImageLoaclPath)
 if (!avatar) {
    throw new ApiError(400,"Avatar file is required")
 }
 const user=await User.create({
    fullName,
    avatar:avatar.url,
    coverImage:coverImage?.url||"",
    email,
    password,
    username:username.toLowerCase()

 })
 const createdUser=await User.findById(user._id).select(
    "-password -refereshToken "
 )
 if (!createdUser) {
    throw new ApiError(500,"Something went wrong while registering the user")

 }

 return res.status(201).json(
    new ApiResponse(200,createdUser,"User register successfully")
 )

 })


 export {
    registerUser,
}