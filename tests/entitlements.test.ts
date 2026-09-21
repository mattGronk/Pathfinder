import { test } from "node:test";
import assert from "node:assert/strict";
import { tierFromEntitlements, entitlementStatus, type Entitlement } from "../src/lib/entitlements.ts";
const now = Date.parse("2026-09-20T12:00:00Z");
const item = (tier: "start" | "full", extra = {}) => ({ status: "active", expires_at: null, pathfinder_products: { access_tier: tier }, ...extra }) as Entitlement;
test("highest active product wins; revoking one product preserves another", () => {
  assert.equal(tierFromEntitlements([], now), "free");
  assert.equal(tierFromEntitlements([item("start"), item("full")], now), "full");
  assert.equal(tierFromEntitlements([item("start"), item("full", { status: "revoked" })], now), "start");
  assert.equal(tierFromEntitlements([item("full", { status: "revoked" })], now), "free");
});
test("expiry applies at the boundary without relying on stored status", () => {
  assert.equal(entitlementStatus(item("full", { expires_at: new Date(now).toISOString() }), now), "expired");
  assert.equal(tierFromEntitlements([item("full", { expires_at: new Date(now).toISOString() })], now), "free");
  assert.equal(tierFromEntitlements([item("full", { expires_at: new Date(now + 1).toISOString() })], now), "full");
});
test("retiring a product stops new grants without stripping purchased benefits", () => {
  assert.equal(tierFromEntitlements([item("full", { pathfinder_products: { access_tier: "full", active: false } })], now), "full");
});
