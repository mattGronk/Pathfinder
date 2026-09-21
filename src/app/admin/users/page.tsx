import { adminUsers, pageNumber } from "@/lib/admin-server";
import { UserTable, Pagination } from "../components";
export default async function Users({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const params = await searchParams; const q = (params.q ?? "").slice(0, 100); const page = pageNumber(params.page);
  const { users, total } = await adminUsers(q, page);
  return <><header className="admin-heading"><p className="eyebrow">ACCOUNT MANAGEMENT</p><h1>Users</h1><p>Find a person, review their pathway and manage their products.</p></header><section className="admin-panel"><form className="admin-search" action="/admin/users"><label htmlFor="user-search">Search by name or email</label><div><input id="user-search" name="q" defaultValue={q} placeholder="Name or email address" maxLength={100} type="search" /><button className="admin-button">Search</button></div></form><UserTable users={users} /><Pagination page={page} total={total} base="/admin/users" search={q} /></section></>;
}
