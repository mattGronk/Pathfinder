import Link from "next/link";
import { adminOverview } from "@/lib/admin-server";
import { UserTable, EntitlementTable } from "./components";
export default async function Overview() {
  const data = await adminOverview();
  return <><header className="admin-heading"><p className="eyebrow">PATHFINDER SA · ADMIN</p><h1>A clear view of your community.</h1><p>Manage accounts and access, with a record of every change.</p></header><div className="admin-stats">{[["Registered users", data.total], ["New in the last 30 days", data.recent], ["Users with premium access", data.paid]].map(([label, value]) => <section key={label}><span>{label}</span><strong>{value}</strong></section>)}</div><section className="admin-panel"><div className="admin-section-heading"><h2>Recent registrations</h2><Link href="/admin/users">View all users →</Link></div><UserTable users={data.users} /></section><section className="admin-panel"><div className="admin-section-heading"><h2>Recent manual grants</h2><Link href="/admin/entitlements">View entitlements →</Link></div><EntitlementTable items={data.grants} /></section></>;
}
