import {Router} from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Account from '../models/Account.js';
import {wrap} from '../utils/async.js';
import {auth} from '../middleware/auth.js';

const r=Router();
const issue=user=>({token:jwt.sign({id:user._id,version:user.tokenVersion||0},process.env.JWT_SECRET,{expiresIn:'7d'}),user:{id:user._id,name:user.name,email:user.email,role:user.role}});

r.post('/register',wrap(async(req,res)=>{
  const{name,email,password}=req.body;
  const accountType=['checking','savings'].includes(req.body.accountType)?req.body.accountType:'checking';
  if(typeof name!=='string'||!name.trim()||typeof email!=='string'||!/^\S+@\S+\.\S+$/.test(email)||typeof password!=='string'||password.length<8)
    return res.status(400).json({message:'Enter your name, a valid email, and a password of at least 8 characters.'});
  const normalizedEmail=email.trim().toLowerCase();
  const allowedEmails=(process.env.ALLOWED_REGISTRATION_EMAIL||'').split(',').map(value=>value.trim().toLowerCase()).filter(Boolean);
  if(allowedEmails.length&&!allowedEmails.includes(normalizedEmail))return res.status(403).json({message:'Registration is currently limited to approved email addresses.'});
  if(await User.exists({email:normalizedEmail}))return res.status(409).json({message:'An account with that email already exists.'});
  const session=await mongoose.startSession();
  let result;
  try{
    await session.withTransaction(async()=>{
      const[user]=await User.create([{name:name.trim(),email:normalizedEmail,password:await bcrypt.hash(password,12),role:'user'}],{session});
      const[account]=await Account.create([{user:user._id,number:'NB'+crypto.randomUUID().replaceAll('-','').slice(0,12).toUpperCase(),accountType,balanceCents:0}],{session});
      user.account=account._id;
      await user.save({session});
      result=issue(user);
    });
  }catch(error){if(error.code===11000)return res.status(409).json({message:'An account with that email already exists.'});throw error;}finally{await session.endSession();}
  res.status(201).json(result);
}));

r.post('/login',wrap(async(req,res)=>{
  const email=typeof req.body.email==='string'?req.body.email.trim().toLowerCase():'';
  const user=await User.findOne({email}).select('+password +tokenVersion');
  if(!user||typeof req.body.password!=='string'||!await bcrypt.compare(req.body.password,user.password))
    return res.status(401).json({message:'Email or password is incorrect.'});
  const account=await Account.findOne({user:user._id}).select('status');
  if(account?.status==='closed')return res.status(403).json({message:'This NovaBank account is closed.'});
  res.json(issue(user));
}));

r.get('/me',auth,wrap(async(req,res)=>res.json({user:{id:req.user._id,name:req.user.name,email:req.user.email,role:req.user.role}})));
r.post('/logout',auth,wrap(async(req,res)=>{await User.updateOne({_id:req.user._id},{$inc:{tokenVersion:1}});res.json({success:true});}));

r.patch('/profile',auth,wrap(async(req,res)=>{
  const{name,currentPassword,newPassword}=req.body;
  if(name!==undefined&&(typeof name!=='string'||name.trim().length<2))return res.status(400).json({message:'Name must be at least 2 characters.'});
  if(name)req.user.name=name.trim();
  if(newPassword){
    if(typeof newPassword!=='string'||newPassword.length<8)return res.status(400).json({message:'New password must be at least 8 characters.'});
    const user=await User.findById(req.user._id).select('+password');
    if(!await bcrypt.compare(currentPassword||'',user.password))return res.status(400).json({message:'Current password is incorrect.'});
    user.password=await bcrypt.hash(newPassword,12);
    if(name)user.name=name.trim();
    await user.save();
    return res.json({user:{id:user._id,name:user.name,email:user.email,role:user.role}});
  }
  await req.user.save();
  res.json({user:{id:req.user._id,name:req.user.name,email:req.user.email,role:req.user.role}});
}));

export default r;
