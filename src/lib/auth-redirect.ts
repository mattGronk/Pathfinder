import {safeReturnTo} from "./safe-return";
export const PASSWORD_RESET_PATH="/account/update-password";
export function recoveryCallbackUrl(origin:string){
 const url=new URL("/auth/callback",origin);
 url.searchParams.set("type","recovery");
 url.searchParams.set("next",PASSWORD_RESET_PATH);
 return url.toString();
}
export function authenticationDestination(type:string|null,next:string|null){
 return type==="recovery"?PASSWORD_RESET_PATH:safeReturnTo(next);
}
export function emailOtpType(type:string|null){
 return type&&(["signup","invite","magiclink","recovery","email_change","email"] as const).find(value=>value===type)||null;
}
