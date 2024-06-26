import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from"jsonwebtoken";
import mongoose from "mongoose";


const generateAccessAndRefreshTokens=async(userId)=>{
   try {
      const user=await User.findById(userId)
      const accessToken=user.generateAccessToken()
      const refreshToken=user.generateRefreshToken()

      user.refreshToken= refreshToken
      await user.save({validateBeforeSave: false})

      return {accessToken,refreshToken}



   } catch (error) {
      throw new ApiError(500,"somethong went wrong while generating refresh and access token")
   }

}



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

const loginUser =asyncHandler(async(req,res)=>{

   //req body-> daata
   // username or email
   // find user
   //password check
   //access and refresh token
   //send cookie
   const {email,userName,password}=req.body
   console.log(email);
   if(!(userName && email)){
      throw new ApiError(400,"username or email is required")

   }

   const user= await User.findOne({
      $or: [{userName},{email}]
   })

   if (!user) {
      throw new ApiError(400,"User does not exist")
   }

   const isPasswordValid=await user.isPasswordCorrect(password)
   if (!isPasswordValid) {
      throw new ApiError(401,"Invalid user credientials")
   }
   const {accessToken,refreshToken}=await generateAccessAndRefreshTokens(user._id)
    
   const loggedInUser=await User.findById(user._id).select("-password -refreshToken")
   const options={
      httpOnly:true,
      secure:true
   }
   return res
   .status(200)
   .cookie("accessToken",accessToken,options)
   .cookie("refreshToken",refreshToken,options)
   .json(
      new ApiResponse(
         200, 
         {
            user:loggedInUser,accessToken,
            refreshToken
         },
         "User Logged in successfully"
      )
   )

})

const logoutUser=asyncHandler(async(req,res)=>{
   User.findByIdAndUpdate(
      req.user._id,
      {
         $set: {
            refreshToken: undefined
         }
      },
      {
         new: true
      }
   )
   const options={
      httpOnly:true,
      secure:true
   }
   return res
   .status(200)
   .clearCookie("accessToken")
   .clearCookie("refreshToken")
   .json(new ApiResponse(200,{}, "User loogged out"))

})

const refreshAccessToken=asyncHandler(async(req,res)=>{
   const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken

   if (!incomingRefreshToken) {
      throw new ApiError(401,"unauthorized request")
   }

   try {
      const decodedToken=jwt.verify(
         incomingRefreshToken,
         process.env.REFERSH_TOKEN_SECRET
   
      )
   
      const user=await User.findById(decodedToken?._id)
      if (!user) {
         throw new ApiError(401,"Invalid refresh token")
      }
      if (incomingRefreshToken !==user?.refreshToken) {
         throw new ApiError(401,"Refresh token is expired or used")
      }
   
      const options={
         httpOnly:true,
         secure: true
      }
      const {accessToken,newRefreshToken}=await generateAccessAndRefreshTokens(user._id)
      return res
      .status(200)
      .cookie("accessToken",accessToken,options)
      .cookie("refreshToken",newRefreshToken,options)
      .json(
         new ApiResponse(
            200,
            {accessToken,refreshToken:newRefreshToken},
            "Access Token  refreshed"
         )
      )
   } catch (error) {
      throw new ApiError(401,error?.message || "Invalid refresh token")
   }
})

const changeCurrentPassword=asyncHandler(async(req,res)=>{
   const {oldPassword,newPassword}=req.body
   const user=await User.findById(req.user?._id)
   const isPasswordCorrect =await user.isPasswordCorrect(oldPassword)
   if (!isPasswordCorrect) {
      throw new ApiError(400,"Invalid old password")
   }

   user.password=newPassword
   await user.save({validateBeforeSave:false})

   return res
   .status(200)
   .json(new ApiResponse(200,{},"Password chnaged successfully"))



})

const getCurrentUser=asyncHandler(async(req,res)=>{
   return res
   .status(200)
   .json(new ApiResponse(
      200,
      req.user,
      "current user fetched successfully"
   ))

})

const updateAccountDetails=asyncHandler(async(req,res)=>{
   const {fullName,email}=req.body

   if (!fullName || !email) {
      throw new ApiError(400,"All fields are required")
   }
   const user=await User.findByIdAndUpdate(
      req.user?._id,
      {
         $set:{
            fullName:fullName,
            email:email
         }
      },
      {new:true}

   ).select("-password")
   return res
   .status(200)
   .json(new ApiResponse(200,user,"Account details updated successfully"))
});

const updateUserAvatar = asyncHandler(async(req, res) => {
   const avatarLocalPath = req.file?.path

   if (!avatarLocalPath) {
       throw new ApiError(400, "Avatar file is missing")
   }



   const avatar = await uploadOnCloudinary(avatarLocalPath)

   if (!avatar.url) {
       throw new ApiError(400, "Error while uploading on avatar")
       
   }

   const user = await User.findByIdAndUpdate(
       req.user?._id,
       {
           $set:{
               avatar: avatar.url
           }
       },
       {new: true}
   ).select("-password")

   return res
   .status(200)
   .json(
       new ApiResponse(200, user, "Avatar image updated successfully")
   )
})


const updateUserCoverImage = asyncHandler(async(req, res) => {
   const coverImageLocalPath = req.file?.path

   if (!coverImageLocalPath) {
       throw new ApiError(400, "Cover image file is missing")
   }



   const coverImage = await uploadOnCloudinary(coverImageLocalPath)

   if (!coverImage.url) {
       throw new ApiError(400, "Error while uploading on avatar")
       
   }

   const user = await User.findByIdAndUpdate(
       req.user?._id,
       {
           $set:{
               coverImage: coverImage.url
           }
       },
       {new: true}
   ).select("-password")

   return res
   .status(200)
   .json(
       new ApiResponse(200, user, "Cover image updated successfully")
   )
})

const getUserChannelProfile=asyncHandler(async(req,res)=>{
   const {userName}=req.params 
   // parms mean url
   if (!userName?.trim()) {
      throw new ApiError(400,"username is missing")

   }
   // use pipeline aggregaete {}{} give arrays

   const channel=await User.aggregate([
      {
         $match: {
            userName:userName?.toLowerCase()
         }
         
      },
      {
         $lookup: {
            from: "subscriptions",
            localField: "_id",
            foreignField:"channel",
            as:"subscribers"
         }
      },
      {
         $lookup: {
            from: "subscriptions",
            localField: "_id",
            foreignField:"subscriber",  //idhar s ki dikkat hoskti
            as:"subscribedTo"
         }
      },
      {
         $addFields: {
            subscribersCount: {
               $size: "$subscribers"
            },
            channelsSubscribedToCount: {
               $size: "subscribedTo"
            },
            isSubscribed:{
               $cond:{
                  if: {$in: [req.user?._id,"$subscribers.subscriber"]},
                  then: true,
                  else:false
               }
            }
         }
      },
      // progection give on seleced thing
      {
         $project:{
            fullName:1,
            userName:1,
            subscribersCount:1,
            channelsSubscribedToCount:1,
            isSubscribed:1,
            avatar:1,
            coverImage:1,
            email:1


         }
      }
   ])
   if (!channel?.length) {
      throw new ApiError(404,"channel does not exists")
   }
   return res
   .status(200)
   .json(
      new ApiResponse(200,channel[0],"User Channel fetched successfully")
   )

})

const getWatchHistory = asyncHandler(async(req, res) => {
   const user = await User.aggregate([
       {
           $match: {
               _id: new mongoose.Types.ObjectId(req.user._id)
           }
       },
       {
           $lookup: {
               from: "Videos",
               localField: "watchHistory",
               foreignField: "_id",
               as: "watchHistory",
               pipeline: [
                   {
                       $lookup: {
                           from: "users",
                           localField: "owner",
                           foreignField: "_id",
                           as: "owner",
                           pipeline: [
                               {
                                   $project: {
                                       fullName: 1,
                                       userName: 1,
                                       avatar: 1
                                   }
                               }
                           ]
                       }
                   },
                   {
                       $addFields:{
                           owner:{
                               $first: "$owner"
                           }
                       }
                   }
               ]
           }
       }
   ])

   return res
   .status(200)
   .json(
       new ApiResponse(
           200,
           user[0].watchHistory,
           "Watch history fetched successfully"
       )
   )
})

export {
   registerUser,
   loginUser,
   logoutUser,
   refreshAccessToken,
   changeCurrentPassword,
   getCurrentUser,
   updateAccountDetails,
   updateUserAvatar,
   updateUserCoverImage,
   getUserChannelProfile,
   getWatchHistory

}