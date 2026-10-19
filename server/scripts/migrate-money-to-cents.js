import 'dotenv/config';
import mongoose from 'mongoose';

const uri=process.env.MONGODB_URI;
if(!uri)throw new Error('MONGODB_URI is required.');
await mongoose.connect(uri);
const session=await mongoose.startSession();
try{
  await session.withTransaction(async()=>{
    const accounts=await mongoose.connection.collection('accounts').updateMany(
      {balanceCents:{$exists:false}},
      [{$set:{balanceCents:{$round:[{$multiply:[{$ifNull:['$balance',0]},100]},0]}}},{$unset:'balance'}],
      {session}
    );
    const transactions=await mongoose.connection.collection('transactions').updateMany(
      {amountCents:{$exists:false}},
      [{$set:{amountCents:{$round:[{$multiply:[{$ifNull:['$amount',0]},100]},0]},balanceAfterCents:{$round:[{$multiply:[{$ifNull:['$balanceAfter',0]},100]},0]}}},{$unset:['amount','balanceAfter']}],
      {session}
    );
    console.log('Migrated legacy monetary values to cents:',JSON.stringify({accounts:accounts.modifiedCount,transactions:transactions.modifiedCount}));
  });
}finally{await session.endSession();await mongoose.disconnect();}
