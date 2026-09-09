import {createCipheriv,createDecipheriv,createHash,randomBytes} from "node:crypto";
export function encryptWorkspace(value:unknown,context:string,secret:string){
 if(secret.length<32)throw new Error("Workspace encryption is unavailable.");
 const key=createHash("sha256").update(`pathfinder-storage-v1:${secret}`).digest();
 const iv=randomBytes(12);const cipher=createCipheriv("aes-256-gcm",key,iv);cipher.setAAD(Buffer.from(context));
 const plaintext=JSON.stringify(value);if(Buffer.byteLength(plaintext)>65536)throw new Error("Workspace record is too large.");
 const encrypted=Buffer.concat([cipher.update(plaintext,"utf8"),cipher.final()]);
 return JSON.stringify({v:1,iv:iv.toString("base64"),tag:cipher.getAuthTag().toString("base64"),data:encrypted.toString("base64")});
}
export function decryptWorkspace(raw:string,context:string,secret:string):unknown{
 if(secret.length<32||raw.length>100000)throw new Error("Invalid workspace record.");
 const envelope=JSON.parse(raw);if(envelope.v!==1)throw new Error("Unknown workspace format.");
 const key=createHash("sha256").update(`pathfinder-storage-v1:${secret}`).digest();
 const decipher=createDecipheriv("aes-256-gcm",key,Buffer.from(envelope.iv,"base64"));decipher.setAAD(Buffer.from(context));decipher.setAuthTag(Buffer.from(envelope.tag,"base64"));
 return JSON.parse(Buffer.concat([decipher.update(Buffer.from(envelope.data,"base64")),decipher.final()]).toString("utf8"));
}
