import mongoose from 'mongoose';
const schema=new mongoose.Schema({owner:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true,index:true},recipientAccount:{type:mongoose.Schema.Types.ObjectId,ref:'Account',required:true}},{timestamps:true});
schema.index({owner:1,recipientAccount:1},{unique:true});
export default mongoose.model('SavedRecipient',schema);
