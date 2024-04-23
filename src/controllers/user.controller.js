import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser=asyncHandler(async(req,res)=>{
   
   //get user detail from frontend
   //validation- not empty
   //chk if user alredy exit:chk userName ,email
   //chk for img avatar
   //upload to cloudinary,avtar
   //create user obj-create entry in db
   //remove pass and refers token field from response
   //chk user creation
   //return res
   const { fullName, email, userName, password } = req.body
   // console.log("email: ", email);
   if (
      [fullName, email, userName, password].some((field) => field?.trim() === "")
   ) {
      throw new ApiError(400, "All fields are required")
   }

   const existedUser = await User.findOne({
      $or: [{ userName }, { email }]
   })
   if (existedUser) {
      throw new ApiError(409, "user with email and userName exists")

   }
   // console.log(req.files);
   // console.log("existed user",existedUser)
   const avatarLocalPath = req.files?.avatar[0]?.path;
   // const coverImageLocalPath = req.files?.coverImage[0]?.path;

   let coverImageLocalPath;
   if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
       coverImageLocalPath = req.files.coverImage[0].path
   }
   

   if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar file is required")

   }

   const avatar = await uploadOnCloudinary(avatarLocalPath)
   const coverImage = await uploadOnCloudinary
      (coverImageLocalPath)
   if (!avatar) {
      throw new ApiError(400, "Avatar file is required")
   }
   const user = await User.create({
      fullName,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      email,
      password,
      userName: userName.toLowerCase()

   })

   const createdUser = await User.findById(user._id).select(
      "-password -refereshToken "
   )
   if (!createdUser) {
      throw new ApiError(500, "Something went wrong while registering the user")

   }

   return res.status(201).json(
      new ApiResponse(200, createdUser, "User register successfully")
   )











})

export {registerUser}