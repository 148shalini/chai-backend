const asyncHandler=(requstHandler)=>{
    return (req,res,next)=>{
        Promise.resolve(requstHandler(req,res,next)).catch
        ((err) => next(err))
    }
}

export {asyncHandler}










//wrapper fun use production m use kiy ah

// const asyncHandler=(fn)=>async (req,res,next)=>{
//     try {
//         await fn(req,res,next)
//     } catch (error) {
//         res.status(err.code || 500).json({
//             success:false,
//             message:err.message

//         })
//     }
// }
