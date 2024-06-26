import mongoose,{Schema} from "mongoose";
import jwt from"jsonwebtoken"
import bcrypt, { compare } from "bcrypt"
const userSchema =new Schema({ 
    userName:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true //serch field enable
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        
    },
    fullName:{
        type:String,
        required:true,
        index:true,
        trim:true
        
    },
    avatar:{
        type:String,//cloudnary url
        required:true,
       
        
    },
    coverImage:{
        type:String,//cloudnary url
        
    },
    watchHistory:[{
        type: Schema.Types.ObjectId,
        ref:"Video"
        
    }],
    password:{
        type:String,
        required:[true,'Password is required']

    },
    refreshToken:{
        type:String

    }



},
{
    timestamps:true
}
)
userSchema.pre("save",async function (next) {
    if(!this.isModified("password")) return next();

    this.password=await bcrypt.hash(this.password,10)   //this  know all field encrypt by bycrpt  has hash mthod 2 this round mean salt
    next()
})

userSchema.methods.isPasswordCorrect= async function(password){
    return await bcrypt.compare(password,this.password)
}
userSchema.methods.generateAccessToken= function(){
    return jwt.sign(
        {
            _id:this._id,
            email:this.email,
            userName:this.userName,
            fullName:this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
)
}
userSchema.methods.generateRefreshToken=function(){
    return jwt.sign(
        {
            _id: this._id,
           
        },
        process.env.REFERSH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFERSH_TOKEN_EXPIRY
        }
)
}
    
export const User =mongoose.model("User",userSchema)