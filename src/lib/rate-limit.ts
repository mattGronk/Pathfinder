import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";

type Entry={count:number;resetAt:number};
const buckets:Map<string,Entry>=(globalThis as typeof globalThis & {__pathfinderLimits?:Map<string,Entry>}).__pathfinderLimits ?? new Map();
(globalThis as typeof globalThis & {__pathfinderLimits?:Map<string,Entry>}).__pathfinderLimits=buckets;

export async function checkAuthRateLimit(email:string,mode:string){
  const h=await headers(); const ip=h.get("x-forwarded-for")?.split(",")[0]?.trim()??"unknown";
  const key=createHash("sha256").update(`${ip}:${email.toLowerCase()}:${mode}`).digest("hex");
  const now=Date.now(); const recovery=mode==="recover"||mode==="otp"; const windowMs=recovery?30*60_000:15*60_000; const maximum=recovery?3:5;
  const current=buckets.get(key); if(!current||current.resetAt<=now){buckets.set(key,{count:1,resetAt:now+windowMs});return {allowed:true};}
  if(current.count>=maximum)return {allowed:false,retryMinutes:Math.max(1,Math.ceil((current.resetAt-now)/60_000))};
  current.count+=1; return {allowed:true};
}
