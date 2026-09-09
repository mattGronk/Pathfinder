import "server-only";
import {createClient} from "@supabase/supabase-js";
import {encryptWorkspace,decryptWorkspace} from "./workspace-crypto";
const BUCKET="pathfinder-private-workspaces";
export const recordKeys=["pathfinder_profile","pathfinder_draft","pathfinder_results","pathfinder_cv","pathfinder_tasks"] as const;
function storage(){const url=process.env.SUPABASE_URL;const key=process.env.SUPABASE_SECRET_KEY??process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)throw new Error("Workspace storage is not available.");return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}).storage;}
function path(userId:string,key:string){if(!/^[a-f0-9-]{36}$/i.test(userId)||!recordKeys.some(k=>k===key))throw new Error("Invalid workspace record.");return `${userId}/${key}.json`;}
function missing(error:{message:string;statusCode?:string|number}){return ["404"].includes(String(error.statusCode))||/not found|does not exist/i.test(error.message);}
// These helpers are only called after getUser validates the current account.
// No bucket URL, signed download link or service key is sent to the browser.
export async function loadPrivateRecords(userId:string,keys:readonly string[]=recordKeys){
 const client=storage();const entries=await Promise.all(keys.map(async key=>{const location=path(userId,key);const {data,error}=await client.from(BUCKET).download(location);if(error){if(missing(error))return [key,null];throw new Error("Saved workspace data could not be loaded.");}return [key,decryptWorkspace(await data.text(),location,process.env.PAYWALL_COOKIE_SECRET??"")];}));return Object.fromEntries(entries);
}
export async function savePrivateRecords(userId:string,values:Record<string,unknown>){
 const client=storage();let {data:bucket,error}=await client.getBucket(BUCKET);
 if(error){if(!missing(error))throw new Error("Workspace storage is not available.");const created=await client.createBucket(BUCKET,{public:false,allowedMimeTypes:["application/json"],fileSizeLimit:100000});if(created.error&&!/already exists|duplicate/i.test(created.error.message))throw new Error("Workspace storage could not be prepared.");const check=await client.getBucket(BUCKET);bucket=check.data;error=check.error;}
 if(error||!bucket||bucket.public)throw new Error("Private workspace storage is not available.");
 await Promise.all(Object.entries(values).map(async([key,value])=>{const location=path(userId,key);const body=encryptWorkspace(value,location,process.env.PAYWALL_COOKIE_SECRET??"");const {error:failure}=await client.from(BUCKET).upload(location,body,{upsert:true,contentType:"application/json",cacheControl:"0"});if(failure)throw new Error("Changes could not be saved.");}));
}
