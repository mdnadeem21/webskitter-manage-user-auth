const jwt=require('jsonwebtoken');

const AdminAuthCheck=(req,res,next)=>{

    if(req.cookies && req.cookies.admintoken){

        const token=req.cookies.admintoken
        const decoded=jwt.verify(token,process.env.ADMIN_JWT_SECRET)
        req.admin=decoded
       return next()
    }else{
        console.log('not logged in please login first');
    }

}



module.exports=AdminAuthCheck