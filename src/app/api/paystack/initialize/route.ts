import { NextResponse } from "next/server";
import { getPathfinderAccount } from "@/lib/supabase/server";
export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return NextResponse.json({error:"Please start checkout from Pathfinder."},{status:403});
  const account = await getPathfinderAccount();
  if (!account) return NextResponse.json({error:"Please sign in before checkout."},{status:401});
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret?.startsWith("sk_live_")) return NextResponse.json({error:"Payments are not open yet. Please contact pathfinderzar@gmail.com for an update."},{status:503});
  const body = await request.json().catch(()=>null) as {tier?:string}|null;
  if (!body || !["start","full"].includes(body.tier??"")) return NextResponse.json({error:"Choose a Pathfinder package."},{status:400});
  try {
    const response = await fetch("https://api.paystack.co/transaction/initialize",{method:"POST",headers:{Authorization:`Bearer ${secret}`,"Content-Type":"application/json"},body:JSON.stringify({email:account.email,amount:body.tier==="full"?69900:24900,currency:"ZAR",callback_url:"https://pathfinder-sa-zeta.vercel.app/payment/complete",metadata:{pathfinder_tier:body.tier,pathfinder_user:account.userId}}),signal:AbortSignal.timeout(15000)});
    const result=await response.json() as {status?:boolean;data?:{authorization_url?:string}};
    const url=new URL(result.data?.authorization_url??"https://invalid.local");
    if(!response.ok||!result.status||url.protocol!=="https:"||url.hostname!=="checkout.paystack.com") throw new Error();
    return NextResponse.json({url:url.href},{headers:{"Cache-Control":"no-store"}});
  } catch { return NextResponse.json({error:"Checkout could not start. Please try again shortly."},{status:502}); }
}
