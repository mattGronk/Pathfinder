"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, KeyRound } from "lucide-react";
export default function AdminNav() {
  const path = usePathname();
  return <nav className="admin-nav" aria-label="Admin navigation">{[{ href: "/admin", label: "Overview", Icon: LayoutDashboard }, { href: "/admin/users", label: "Users", Icon: Users }, { href: "/admin/entitlements", label: "Purchases / Entitlements", Icon: KeyRound }].map(({ href, label, Icon }) => <Link key={href} href={href} aria-current={(href === "/admin" ? path === href : path.startsWith(href)) ? "page" : undefined}><Icon size={18} />{label}</Link>)}</nav>;
}
