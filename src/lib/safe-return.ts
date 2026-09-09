export function safeReturnTo(value:unknown,fallback="/dashboard"){
 return typeof value==="string"&&/^\/(?!\/)[a-z0-9/_-]*(?:\?reference=[-A-Za-z0-9_.]{6,100})?$/i.test(value)?value:fallback;
}
