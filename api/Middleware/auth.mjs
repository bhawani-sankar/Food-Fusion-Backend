import jwt from 'jsonwebtoken';
import 'dotenv/config'

export const authToken=(req,res,next)=>{
    const token = req.header('Authorization').split(' ')[1]
    if(!token){
        return res.status(401).json({ message: 'Unauthorized: Missing token' });
    }
    else{
        jwt.verify(token,process.env.jwtsecret,(err,result)=>{
            if(err){
                return res.status(403).json({ message: 'Forbidden: Invalid token' });
            }
            else{
                req.user=result
                next();
            }
        })
    }
}