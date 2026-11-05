const jwt=require('jsonwebtoken');const User=require('../models/User');
async function protect(req,res,next){try{const h=req.headers.authorization;if(!h?.startsWith('Bearer '))return res.status(401).json({message:'Authentication required'});const decoded=jwt.verify(h.slice(7),process.env.JWT_SECRET);req.user=await User.findById(decoded.id);if(!req.user)return res.status(401).json({message:'User no longer exists'});next();}catch(e){res.status(401).json({message:'Invalid or expired token'});}}
function authorize(...roles){return(req,res,next)=>roles.includes(req.user.role)?next():res.status(403).json({message:'You do not have permission to perform this action'});}
module.exports={protect,authorize};
