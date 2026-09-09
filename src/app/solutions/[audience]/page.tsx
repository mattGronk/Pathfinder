import {notFound} from "next/navigation";
import {AudiencePage, audiences, type Audience} from "@/components/audience";
export const dynamicParams=false;
function key(value:string){return value.replace(/^for-/,"") as Audience;}
export function generateStaticParams(){return Object.keys(audiences).map(a=>({audience:`for-${a}`}));}
export async function generateMetadata({params}:{params:Promise<{audience:string}>}){const a=key((await params).audience);return {title:`${audiences[a]?.label??"Guidance"} | Pathfinder SA`};}
export default async function Page({params}:{params:Promise<{audience:string}>}){const value=(await params).audience;const a=key(value);if(!Object.hasOwn(audiences,a)||value!==`for-${a}`)notFound();return <AudiencePage audience={a}/>;}
