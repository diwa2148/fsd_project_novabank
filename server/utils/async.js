export const wrap=fn=>(req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next);
export function validAmount(v){return Number.isFinite(v)&&v>0&&v<=1000000&&Number.isSafeInteger(Math.round(v*100))&&Math.abs(v*100-Math.round(v*100))<1e-8;}
