import { Suspense } from "react";
import PaymentStatus from "./payment-status";
export const metadata={title:"Confirming payment | Pathfinder SA"};
export default function PaymentComplete(){return <main className="legal-page"><Suspense fallback={<div className="page-skeleton"><i/><i/><i/></div>}><PaymentStatus/></Suspense></main>}
