import {Router} from 'express';import bcrypt from 'bcryptjs';import mongoose from 'mongoose';import Account from '../models/Account.js';import Transaction from '../models/Transaction.js';import User from '../models/User.js';import {auth} from '../middleware/auth.js';import {wrap} from '../utils/async.js';
const r=Router();r.use(auth);
r.get('/me',wrap(async(req,res)=>{const account=await Account.findOne({user:req.user._id}).populate('user','name email createdAt');if(!account)return res.status(404).json({message:'Bank account not found.'});const recent=await Transaction.find({owner:req.user._id}).sort({createdAt:-1}).limit(5);res.json({account,recent});}));
r.get('/balance',wrap(async(req,res)=>{const account=await Account.findOne({user:req.user._id}).select('balanceCents currency status');if(!account)return res.status(404).json({message:'Bank account not found.'});res.json({balance:account.balanceCents/100,currency:'INR',status:account.status});}));
r.delete('/me',wrap(async(req,res)=>{
  const{password,confirmation}=req.body;
  if(confirmation!=='CLOSE')return res.status(400).json({message:'Type CLOSE to confirm account closure.'});
  const user=await User.findById(req.user._id).select('+password');
  if(!user||typeof password!=='string'||!await bcrypt.compare(password,user.password))return res.status(400).json({message:'Current password is incorrect.'});
  const session=await mongoose.startSession();
  try{
    await session.withTransaction(async()=>{
      const account=await Account.findOne({user:user._id}).session(session);
      if(!account)throw Object.assign(new Error('Bank account not found.'),{status:404});
      if(account.status==='closed')throw Object.assign(new Error('This bank account is already closed.'),{status:409});
      if(account.balanceCents!==0)throw Object.assign(new Error('Withdraw or transfer your full balance before closing this account.'),{status:400});
      account.status='closed';await account.save({session});
      await User.updateOne({_id:user._id},{$inc:{tokenVersion:1}},{session});
    });
  }finally{await session.endSession();}
  res.json({success:true,message:'Your bank account has been closed. Transaction history is retained.'});
}));
export default r;
