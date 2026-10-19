import mongoose from 'mongoose';
import Account from '../models/Account.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import {validAmount} from '../utils/async.js';

export async function move({userId,type,amount,recipientId,description,key,initiatedBy}){
  if(!validAmount(amount))throw Object.assign(new Error('Enter a valid amount with no more than two decimal places.'),{status:400});
  if(!key||key.length>100)throw Object.assign(new Error('A valid transaction request key is required.'),{status:400});
  const amountCents=Math.round(amount*100);
  const exists=await Transaction.findOne({owner:userId,idempotencyKey:key});
  if(exists)return exists;
  const session=await mongoose.startSession();let created;
  try{
    await session.withTransaction(async()=>{
      const owner=await User.findById(userId).session(session);
      const source=await Account.findOne({user:userId}).session(session);
      if(!source)throw Object.assign(new Error('Bank account not found.'),{status:404});
      if(source.status!=='active')throw Object.assign(new Error('This account is not active.'),{status:403});
      if(type==='deposit'){
        source.balanceCents+=amountCents;await source.save({session});
        [created]=await Transaction.create([{owner:userId,account:source._id,recipientAccount:source._id,initiatedBy,type,amountCents,description:description||'Account deposit',category:'Income',reference:'NB-'+crypto.randomUUID(),idempotencyKey:key,balanceAfterCents:source.balanceCents}],{session});
        if(initiatedBy)await AuditLog.create([{administrator:initiatedBy,action:'admin_deposit',account:source._id,transaction:created._id,amountCents,description:description||'Administrator deposit'}],{session});
        return;
      }
      if(type==='withdrawal'){
        if(source.balanceCents<amountCents)throw Object.assign(new Error('Insufficient balance for this withdrawal.'),{status:400});
        source.balanceCents-=amountCents;await source.save({session});
        [created]=await Transaction.create([{owner:userId,account:source._id,senderAccount:source._id,initiatedBy,type,amountCents,description:description||'Cash withdrawal',category:'Other',reference:'NB-'+crypto.randomUUID(),idempotencyKey:key,balanceAfterCents:source.balanceCents}],{session});
        if(initiatedBy)await AuditLog.create([{administrator:initiatedBy,action:'admin_withdrawal',account:source._id,transaction:created._id,amountCents,description:description||'Administrator withdrawal'}],{session});
        return;
      }
      const targetUser=await User.findById(recipientId).session(session);
      if(!targetUser||String(targetUser._id)===String(userId))throw Object.assign(new Error('Choose a valid recipient account number.'),{status:400});
      const target=await Account.findOne({user:targetUser._id}).session(session);
      if(!target)throw Object.assign(new Error('Recipient account is unavailable.'),{status:400});
      if(target.status!=='active')throw Object.assign(new Error('Recipient account is not active.'),{status:400});
      if(source.balanceCents<amountCents)throw Object.assign(new Error('Insufficient balance for this transfer.'),{status:400});
      source.balanceCents-=amountCents;target.balanceCents+=amountCents;
      await source.save({session});await target.save({session});
      const ref='NB-'+crypto.randomUUID();
      const txs=await Transaction.create([
        {owner:userId,account:source._id,senderAccount:source._id,recipientAccount:target._id,type:'transfer_out',amountCents,description:description||'Transfer',category:'Transfer',counterparty:targetUser.name,reference:ref,idempotencyKey:key,balanceAfterCents:source.balanceCents},
        {owner:targetUser._id,account:target._id,senderAccount:source._id,recipientAccount:target._id,type:'transfer_in',amountCents,description:description||'Transfer received',category:'Transfer',counterparty:owner.name,reference:ref,idempotencyKey:key+'-in',balanceAfterCents:target.balanceCents}
      ],{session,ordered:true});
      created=txs[0];
    });
  }finally{await session.endSession();}
  return created;
}
