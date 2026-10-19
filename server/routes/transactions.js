import {Router} from 'express';
import {auth} from '../middleware/auth.js';
import {wrap} from '../utils/async.js';
import Transaction from '../models/Transaction.js';
import Account from '../models/Account.js';
import {move} from '../services/banking.js';
const r=Router();r.use(auth);

r.get('/',wrap(async(req,res)=>{
  const page=Math.max(1,Number(req.query.page)||1),limit=Math.min(100,Math.max(1,Number(req.query.limit)||20)),sort=req.query.sort==='oldest'?1:-1,q={owner:req.user._id};
  if(['deposit','withdrawal','transfer_in','transfer_out'].includes(req.query.type))q.type=req.query.type;
  if(req.query.from||req.query.to)q.createdAt={...(req.query.from?{$gte:new Date(req.query.from)}:{}),...(req.query.to?{$lte:new Date(new Date(req.query.to).getTime()+86400000)}:{})};
  if(req.query.search){const safe=String(req.query.search).slice(0,60).replace(/[.*+?^$()|[\]\\]/g,'\\$&');q.$or=[{description:new RegExp(safe,'i')},{reference:new RegExp(safe,'i')},{counterparty:new RegExp(safe,'i')}]}
  const[items,total]=await Promise.all([Transaction.find(q).sort({createdAt:sort}).skip((page-1)*limit).limit(limit),Transaction.countDocuments(q)]);
  res.json({items,total,page,limit});
}));

r.get('/summary',wrap(async(req,res)=>{
  const now=new Date(),year=Number(req.query.year)||now.getFullYear(),month=Number(req.query.month)||now.getMonth()+1,start=new Date(year,month-1,1),end=new Date(year,month,1),previousStart=new Date(year,month-2,1);
  if(month<1||month>12||year<2000||year>2100)return res.status(400).json({message:'Choose a valid month and year.'});
  const grouped=await Transaction.aggregate([{$match:{owner:req.user._id,createdAt:{$gte:previousStart,$lt:end}}},{$group:{_id:{y:{$year:'$createdAt'},m:{$month:'$createdAt'},type:'$type'},totalCents:{$sum:'$amountCents'}}}]);
  const current={},previous={};for(const row of grouped){const into=row._id.y===year&&row._id.m===month?current:previous;into[row._id.type]=(into[row._id.type]||0)+row.totalCents/100;}
  res.json({year,month,current,previous,start,end});
}));

r.get('/statement.csv',wrap(async(req,res)=>{
  const q={owner:req.user._id},items=await Transaction.find(q).sort({createdAt:-1}).limit(10000);
  const escape=value=>'"'+String(value??'').replaceAll('"','""')+'"';
  const rows=[['Transaction ID','Date','Type','Amount','Status','Reference','Balance after'],...items.map(t=>[t._id,t.createdAt.toISOString(),t.type,t.amountCents/100,t.status,t.reference,t.balanceAfterCents/100])];
  res.type('text/csv').attachment('novabank-account-statement.csv').send(rows.map(row=>row.map(escape).join(',')).join('\r\n'));
}));

r.get('/:id',wrap(async(req,res)=>{const item=await Transaction.findOne({_id:req.params.id,owner:req.user._id}).populate('senderAccount','number').populate('recipientAccount','number');if(!item)return res.status(404).json({message:'Transaction not found.'});res.json({transaction:item});}));
r.post('/deposit',wrap(async(req,res)=>res.status(201).json({transaction:await move({userId:req.user._id,type:'deposit',amount:Number(req.body.amount),description:req.body.description,key:req.headers['idempotency-key']})})));
r.post('/withdraw',wrap(async(req,res)=>res.status(201).json({transaction:await move({userId:req.user._id,type:'withdrawal',amount:Number(req.body.amount),description:req.body.description,key:req.headers['idempotency-key']})})));
r.post('/transfer',wrap(async(req,res)=>{
  const number=typeof req.body.accountNumber==='string'?req.body.accountNumber.trim().toUpperCase():'';
  if(!number)return res.status(400).json({message:'Enter the recipient’s NovaBank account number.'});
  const recipientAccount=await Account.findOne({number});
  if(!recipientAccount)return res.status(404).json({message:'No NovaBank account found with that account number.'});
  res.status(201).json({transaction:await move({userId:req.user._id,type:'transfer_out',amount:Number(req.body.amount),recipientId:recipientAccount.user,description:req.body.description,key:req.headers['idempotency-key']})});
}));
export default r;
