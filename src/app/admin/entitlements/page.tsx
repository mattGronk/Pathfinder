import { adminEntitlements, pageNumber } from "@/lib/admin-server";
import { EntitlementTable, Pagination } from "../components";
export default async function Entitlements({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const page = pageNumber((await searchParams).page); const { items, total } = await adminEntitlements(page);
  return <><header className="admin-heading"><p className="eyebrow">PRODUCT ACCESS</p><h1>Purchases & entitlements</h1><p>Manual grants, existing access and verified purchases. Open a user to manage access.</p></header><section className="admin-panel"><EntitlementTable items={items} /><Pagination page={page} total={total} base="/admin/entitlements" /></section></>;
}
