import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { readWorkspace } from "@/lib/workspace-server";
import { verifiedPaymentTier } from "@/lib/workspace-model";

export async function POST(request:Request){
  if(request.headers.get("origin")!==new URL(request.url).origin)return NextResponse.json({error:"Please verify from the Pathfinder website."},{status:403});
  const state=await readWorkspace();
  if(!state)return NextResponse.json({error:"Sign in with the account used for payment, then return to this page."},{status:401});
  const secret=process.env.PAYSTACK_SECRET_KEY; const adminKey=process.env.SUPABASE_SECRET_KEY??process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!secret?.startsWith("sk_live_")||!adminKey||!process.env.SUPABASE_URL)return NextResponse.json({error:"Payment verification is not configured yet. Contact pathfinderzar@gmail.com with your receipt."},{status:503});
  const body=await request.json().catch(()=>({})) as {reference?:string};
  if(!body.reference||!/^[-A-Za-z0-9_.]{6,100}$/.test(body.reference))return NextResponse.json({error:"The payment reference is missing or invalid."},{status:400});
  try {
    const response=await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(body.reference)}`,{headers:{Authorization:`Bearer ${secret}`},cache:"no-store",signal:AbortSignal.timeout(15000)});
    const result=await response.json() as {status?:boolean;data?:{status?:string;domain?:string;currency?:string;amount?:number;paid_at?:string;customer?:{email?:string};metadata?:{pathfinder_tier?:string;pathfinder_user?:string}}};
    const tier=verifiedPaymentTier(result.data??{},state.user.email??"");
    if(!response.ok||!result.status||tier==="free"||result.data?.metadata?.pathfinder_user!==state.user.id)return NextResponse.json({error:"We could not confirm a Pathfinder checkout for this account. For an older payment-page receipt, contact pathfinderzar@gmail.com."},{status:402});
    const grantedTier=state.tier==="full"?"full":tier;
    const admin=createClient(process.env.SUPABASE_URL,adminKey,{auth:{persistSession:false,autoRefreshToken:false}});
    const {error}=await admin.auth.admin.updateUserById(state.user.id,{app_metadata:{...state.user.app_metadata,pathfinder_access:{tier:grantedTier,reference:body.reference,paidAt:result.data?.paid_at}}});
    if(error)throw new Error();
    return NextResponse.json({message:`${grantedTier==="full"?"Trailblazer":"Hatchling"} access is active on your account.`,tier:grantedTier},{headers:{"Cache-Control":"no-store"}});
  }catch{return NextResponse.json({error:"Verification is temporarily unavailable. Your payment has not been retried. Please reload this page shortly."},{status:502});}
}
