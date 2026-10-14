import type { Entitlement } from "@/lib/access";
import { UserGoneError, type PaymentsStore } from "@/lib/stripe/store";

/**
 * A stand-in for the database that follows the same rules as the SQL functions in
 * supabase/migrations/20261014170000_payments.sql (those are tested against a real
 * Postgres in supabase/tests/rls.sql).
 */
export class MemoryPaymentsStore implements PaymentsStore {
  users = new Set<string>();
  events = new Map<string, string>();
  customers = new Map<string, string>(); // user id -> customer id
  entitlements = new Map<string, { plan: string; status: string; expires_at: Date | null; stripe_ref: string | null }>();
  claims = new Set<string>();
  now = () => new Date("2026-11-01T12:00:00Z");

  constructor(users: string[] = []) {
    users.forEach((u) => this.users.add(u));
  }

  private ensure(userId: string) {
    if (!this.users.has(userId)) throw new UserGoneError("no such user");
    if (!this.entitlements.has(userId)) this.entitlements.set(userId, { plan: "free", status: "active", expires_at: null, stripe_ref: null });
    return this.entitlements.get(userId)!;
  }

  async hasEvent(id: string) {
    return this.events.has(id);
  }
  async recordEvent(id: string, type: string) {
    this.events.set(id, type);
  }
  async userIdForCustomer(customerId: string) {
    for (const [user, customer] of this.customers) if (customer === customerId) return user;
    return null;
  }
  async customerIdForUser(userId: string) {
    return this.customers.get(userId) ?? null;
  }
  async saveCustomer(userId: string, customerId: string) {
    if (!this.users.has(userId)) throw new UserGoneError("no such user");
    if (!this.customers.has(userId)) this.customers.set(userId, customerId);
  }

  async grantPass({ userId, checkoutSessionId, paymentRef, days }: { userId: string; checkoutSessionId: string; paymentRef: string; days: number }) {
    const key = `pass:${checkoutSessionId}`;
    if (!this.users.has(userId)) throw new UserGoneError("no such user");
    if (this.claims.has(key)) return false;
    this.claims.add(key);
    const e = this.ensure(userId);
    if (e.plan === "group" && e.status === "active") return true;
    let base = this.now();
    if (e.plan === "pass90" && e.status === "active" && e.expires_at && e.expires_at > base) base = e.expires_at;
    e.plan = "pass90";
    e.status = "active";
    e.expires_at = new Date(base.getTime() + days * 86_400_000);
    e.stripe_ref = paymentRef;
    return true;
  }

  async revokePass({ userId, chargeId, days }: { userId: string; chargeId: string; days: number }) {
    const key = `refund:${chargeId}`;
    if (this.claims.has(key)) return false;
    this.claims.add(key);
    const e = this.entitlements.get(userId);
    if (!e || e.plan !== "pass90") return true;
    const remaining = new Date((e.expires_at ?? this.now()).getTime() - days * 86_400_000);
    if (remaining <= this.now()) {
      e.status = "refunded";
      e.expires_at = this.now();
    } else e.expires_at = remaining;
    return true;
  }

  async setSubscriptionState({ userId, subscriptionId, status, expiresAt }: { userId: string; subscriptionId: string; status: string; expiresAt: Date | null }) {
    const e = this.ensure(userId);
    const live = ["active", "trialing"];
    if (e.plan === "group" && e.status === "active") return;
    if (e.plan === "pass90" && e.status === "active" && e.expires_at && e.expires_at > this.now() && !live.includes(status)) return;
    if (e.plan === "monthly" && live.includes(e.status) && e.stripe_ref !== subscriptionId && !live.includes(status)) return;
    e.plan = "monthly";
    e.status = status;
    e.expires_at = expiresAt;
    e.stripe_ref = subscriptionId;
  }

  async getEntitlement(userId: string): Promise<Entitlement> {
    const e = this.entitlements.get(userId);
    return e ? { plan: e.plan as never, status: e.status, expires_at: e.expires_at ? e.expires_at.toISOString() : null } : null;
  }
}
