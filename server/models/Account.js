import mongoose from 'mongoose';
const schema=new mongoose.Schema({user:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true,unique:true},number:{type:String,required:true,unique:true},accountType:{type:String,enum:['checking','savings'],default:'checking'},status:{type:String,enum:['active','suspended','closed'],default:'active'},balanceCents:{type:Number,default:0,min:0,validate:Number.isSafeInteger},currency:{type:String,default:'INR'}},{timestamps:true});
schema.set('toJSON',{transform:(_doc,ret)=>{ret.balance=ret.balanceCents/100;ret.currency='INR';delete ret.balanceCents;return ret;}});
export default mongoose.model('Account',schema);
