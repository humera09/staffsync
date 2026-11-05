const mongoose=require('mongoose');
const schema=new mongoose.Schema({user:{type:mongoose.Schema.Types.ObjectId,ref:'User'},employeeId:{type:String,unique:true},name:{type:String,required:true},email:{type:String,required:true},department:{type:String,default:'General'},position:{type:String,default:'Employee'},phone:String,hireDate:{type:Date,default:Date.now},status:{type:String,enum:['Active','On Leave','Inactive'],default:'Active'},manager:{type:mongoose.Schema.Types.ObjectId,ref:'Employee'}},{timestamps:true});
module.exports=mongoose.model('Employee',schema);
