import Link from "next/link";
import { createAccountClient } from "@/lib/supabase/server";
import { readEntitlements } from "@/lib/entitlements-server";
import { entitlementStatus, formatDate, tierName } from "@/lib/entitlements";

export default async function AccountProducts() {
  const client = await createAccountClient();
  if (!client) return null;
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return null;
  const [access, role] = await Promise.all([readEntitlements(client, data.user.id), client.rpc("pathfinder_is_admin")]);
  return <section className="profile-form"><h2>Your products</h2><p>Current access: <strong>{tierName(access.tier)}</strong></p>{access.entitlements.length ? <ul>{access.entitlements.map(item => <li key={item.id}><strong>{item.pathfinder_products.name}</strong> · {entitlementStatus(item)}{item.expires_at ? ` · expires ${formatDate(item.expires_at)} SAST` : ""}</li>)}</ul> : <p>No products yet. You can continue with the free sample or explore our plans.</p>}<Link className="profile-link" href="/upgrade">Explore products →</Link>{role.data === true && <Link className="profile-link" href="/admin">Open administration →</Link>}</section>;
}
