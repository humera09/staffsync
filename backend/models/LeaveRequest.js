const mongoose=require('mongoose');
const schema=new mongoose.Schema({employee:{type:mongoose.Schema.Types.ObjectId,ref:'Employee',required:true},type:{type:String,enum:['Annual','Sick','Personal','Other'],default:'Annual'},startDate:{type:Date,required:true},endDate:{type:Date,required:true},days:Number,reason:{type:String,required:true},status:{type:String,enum:['Pending','Approved','Rejected'],default:'Pending'},reviewedBy:{type:mongoose.Schema.Types.ObjectId,ref:'User'},reviewNote:String},{timestamps:true});
module.exports=mongoose.model('LeaveRequest',schema);
