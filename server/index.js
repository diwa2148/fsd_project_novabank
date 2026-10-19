import 'dotenv/config';
import mongoose from 'mongoose';
import app from './app.js';

if(!process.env.JWT_SECRET||process.env.JWT_SECRET.length<32){
  console.error('Set JWT_SECRET to a random value of at least 32 characters in .env.');
  process.exit(1);
}

const port=process.env.PORT||4000;
mongoose.connect(process.env.MONGODB_URI||'mongodb://127.0.0.1:27017/novabank')
  .then(()=>app.listen(port,()=>console.log('NovaBank API listening on '+port)))
  .catch(error=>{console.error('MongoDB connection failed:',error.message);process.exit(1);});
