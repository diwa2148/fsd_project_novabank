import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';
const email=process.argv[2]?.toLowerCase();
if(!email){console.error('Usage: npm run admin:promote -- user@example.com');process.exit(1);}
try{await mongoose.connect(process.env.MONGODB_URI||'mongodb://127.0.0.1:27017/novabank');const user=await User.findOneAndUpdate({email},{role:'admin'},{new:true});if(!user){console.error('No registered user found for '+email);process.exitCode=1;}else console.log('Administrator access granted to '+user.email);}catch(e){console.error(e.message);process.exitCode=1;}finally{await mongoose.disconnect();}
