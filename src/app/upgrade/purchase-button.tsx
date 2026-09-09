"use client";
import {useState} from "react";
import Link from "next/link";
export default function CheckoutButton({tier,signedIn,available}:{tier:"start"|"full";signedIn:boolean;available:boolean}){
 const [busy,setBusy]=useState(false);const [error,setError]=useState("");
 async function checkout(){setBusy(true);setError("");try{const response=await fetch("/api/paystack/initialize",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({tier})});const result=await response.json() as {error?:string;url?:string};if(!response.ok||!result.url)throw new Error(result.error);window.location.assign(result.url);}catch(e){setError(e instanceof Error?e.message:"Checkout could not start.");setBusy(false);}}
 if(!signedIn)return <Link className="workspace-button" href="/account?next=/upgrade">Sign in to choose this package →</Link>;
 return <><button className="workspace-button" disabled={busy||!available} onClick={checkout}>{busy?"Opening secure checkout…":available?"Continue to Paystack →":"Payments opening soon"}</button>{!available&&<p className="workspace-note">Checkout activation is in progress. Your account and free samples remain available.</p>}<p role="alert">{error}</p></>;
}
