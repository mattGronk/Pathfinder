import Link from "next/link";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/admin-server";
import AdminNav from "./nav";
import "./admin.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin | Pathfinder SA", robots: { index: false, follow: false } };
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <div className="admin-shell"><aside className="admin-sidebar"><Link href="/admin" className="admin-brand">Pathfinder <b>SA</b></Link><span className="admin-label"><ShieldCheck size={16} /> Administration</span><AdminNav /><Link className="admin-return" href="/account"><ArrowLeft size={16} /> Back to my account</Link><p className="admin-sidebar-note">Private account management.<br />Access changes are recorded.</p></aside><main className="admin-main">{children}</main></div>;
}
