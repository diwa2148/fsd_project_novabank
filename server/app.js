import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import accountRoutes from './routes/accounts.js';
import transactionRoutes from './routes/transactions.js';
import adminRoutes from './routes/admin.js';
import recipientRoutes from './routes/recipients.js';
import analyticsRoutes from './routes/analytics.js';

const app=express();
app.use(helmet());
app.use(cors({origin:process.env.CLIENT_ORIGIN||'http://localhost:5173'}));
app.use(express.json({limit:'20kb'}));
app.use('/api/auth',rateLimit({windowMs:15*60*1000,max:80,standardHeaders:true,legacyHeaders:false}),authRoutes);
app.use('/api/accounts',accountRoutes);
app.use('/api/transactions',transactionRoutes);
app.use('/api/recipients',recipientRoutes);
app.use('/api/analytics',analyticsRoutes);
app.use('/api/admin',adminRoutes);
app.get('/api/health',(_req,res)=>res.json({status:'ok',service:'NovaBank simulation'}));
app.use((err,_req,res,_next)=>{
  console.error(err);
  res.status(err.status||500).json({message:err.status?err.message:'Something went wrong. Please try again.'});
});

export default app;
