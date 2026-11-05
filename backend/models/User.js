const mongoose=require('mongoose');
const userSchema=new mongoose.Schema({name:{type:String,required:true,trim:true},email:{type:String,required:true,unique:true,lowercase:true,trim:true},password:{type:String,required:true,select:false},role:{type:String,enum:['HR','Manager','Employee'],default:'Employee'},employee:{type:mongoose.Schema.Types.ObjectId,ref:'Employee'}},{timestamps:true});
module.exports=mongoose.model('User',userSchema);
