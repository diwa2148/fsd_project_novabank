import mongoose from 'mongoose';
const schema=new mongoose.Schema({administrator:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},action:{type:String,enum:['admin_deposit','admin_withdrawal'],required:true},account:{type:mongoose.Schema.Types.ObjectId,ref:'Account',required:true},transaction:{type:mongoose.Schema.Types.ObjectId,ref:'Transaction',required:true},amountCents:{type:Number,required:true,min:1,validate:Number.isSafeInteger},description:{type:String,default:''}},{timestamps:true});
export default mongoose.model('AuditLog',schema);
