import mongoose from 'mongoose';
import app from '../server/app.js';

let connectionPromise;

async function connectDatabase(){
  if(mongoose.connection.readyState===1)return;
  if(!process.env.MONGODB_URI)throw new Error('MONGODB_URI is not configured.');
  if(!connectionPromise){
    connectionPromise=mongoose.connect(process.env.MONGODB_URI)
      .catch(error=>{connectionPromise=null;throw error;});
  }
  await connectionPromise;
}

export default async function handler(req,res){
  try{
    if(!process.env.JWT_SECRET||process.env.JWT_SECRET.length<32){
      return res.status(500).json({message:'JWT_SECRET must contain at least 32 characters.'});
    }
    await connectDatabase();
    const incomingUrl=new URL(req.url,'http://vercel.local');
    const route=String(req.query?.route||'health').replace(/^\/+/, '');
    incomingUrl.searchParams.delete('route');
    const queryString=incomingUrl.searchParams.toString();
    req.url=`/api/${route}${queryString?'?'+queryString:''}`;
    return app(req,res);
  }catch(error){
    console.error('NovaBank API initialization failed:',error.message);
    return res.status(503).json({message:'NovaBank API is temporarily unavailable.'});
  }
}
