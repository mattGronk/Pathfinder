import Link from "next/link";
import type { AdminUser } from "@/lib/admin-server";
import { entitlementStatus, formatDate, accountStatus, tierName, type Entitlement } from "@/lib/entitlements";

export function UserTable({ users }: { users: AdminUser[] }) {
  if (!users.length) return <p className="admin-empty">No users found. Try another name or email.</p>;
  return <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th scope="col">User</th><th scope="col">Date joined · SAST</th><th scope="col">Access</th><th scope="col">Account status</th></tr></thead><tbody>{users.map(u => <tr key={u.user_id}><td><Link className="admin-user-link" href={`/admin/users/${u.user_id}`}>{u.display_name || "Profile not completed"}</Link><span>{u.email || "No email"}</span><small className="admin-id">{u.user_id}</small></td><td>{formatDate(u.joined_at)}</td><td><span className="admin-badge">{tierName(u.access_tier)}</span></td><td>{accountStatus(u)}</td></tr>)}</tbody></table></div>;
}
export function EntitlementTable({ items }: { items: Entitlement[] }) {
  if (!items.length) return <p className="admin-empty">No entitlements yet. Open a user profile to grant access.</p>;
  return <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Product / User</th><th>Source</th><th>Granted · SAST</th><th>Expiry · SAST</th><th>Status</th></tr></thead><tbody>{items.map(e => <tr key={e.id}><td><strong>{e.pathfinder_products.name}</strong><Link className="admin-id" href={`/admin/users/${e.user_id}`}>{e.user_id}</Link></td><td>{e.source.replaceAll("_", " ")}</td><td>{formatDate(e.granted_at)}</td><td>{e.expires_at ? formatDate(e.expires_at) : "No expiry"}</td><td><span className={`admin-badge ${entitlementStatus(e)}`}>{entitlementStatus(e)}</span></td></tr>)}</tbody></table></div>;
}
export function Pagination({ page, total, base, search = "" }: { page: number; total: number; base: string; search?: string }) {
  const pages = Math.max(1, Math.ceil(total / 25));
  return <nav className="admin-pagination" aria-label="Pagination">{page > 1 ? <Link href={`${base}?page=${page - 1}&q=${encodeURIComponent(search)}`}>← Previous</Link> : <span />}<span>{total} records · Page {page} of {pages}</span>{page < pages ? <Link href={`${base}?page=${page + 1}&q=${encodeURIComponent(search)}`}>Next →</Link> : <span />}</nav>;
}
