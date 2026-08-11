import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type AdminStats = {
  totalUsers: number;
  totalClaims: number;
  totalAnalyses: number;
  totalLetters: number;
  needsAction: number;
  planCounts: Record<string, number>;
  statusCounts: Record<string, number>;
  monthlyUsage: { analyses: number; letters: number };
};

export type AdminUserRow = {
  id: string;
  fullName: string | null;
  email: string | null;
  plan: string;
  accountStatus: "active" | "pending" | "banned";
  createdAt: string | null;
  lastActivity: string | null;
  used: { analyses: number; letters: number };
  limits: { analyses: number; letters: number };
  claims: number;
};

export type AdminPlanRow = {
  id: string;
  sortOrder: number;
  monthlyAnalyses: number;
  monthlyLetters: number;
  advancedAnalysis: boolean;
  exports: boolean;
  users: number;
};

/** Throws unless the caller (acting through their own RLS client) has the admin role. */
export async function assertAdmin(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  userId: string,
): Promise<void> {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error) throw new Error("FORBIDDEN");
  if (!data) throw new Error("FORBIDDEN");
}

function periodStart(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);
}

async function count(table: "claims" | "analysis_results" | "generated_letters" | "profiles") {
  const { count: value } = await supabaseAdmin
    .from(table)
    .select("id", { count: "exact", head: true });
  return value ?? 0;
}

async function listAuthUsers() {
  const map = new Map<string, { email: string | null; lastActivity: string | null; status: AdminUserRow["accountStatus"] }>();
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
    if (error || !data?.users?.length) break;
    for (const user of data.users) {
      const banned = (user as { banned_until?: string | null }).banned_until;
      map.set(user.id, {
        email: user.email ?? null,
        lastActivity: user.last_sign_in_at ?? null,
        status: banned && new Date(banned) > new Date()
          ? "banned"
          : user.email_confirmed_at || user.confirmed_at
            ? "active"
            : "pending",
      });
    }
    if (data.users.length < 200) break;
  }
  return map;
}

export async function getAdminStats(): Promise<AdminStats> {
  const period = periodStart();
  const [totalUsers, totalClaims, totalAnalyses, totalLetters] = await Promise.all([
    count("profiles"),
    count("claims"),
    count("analysis_results"),
    count("generated_letters"),
  ]);

  const [{ data: subs }, { data: claims }, { data: usage }] = await Promise.all([
    supabaseAdmin.from("subscriptions").select("user_id, plan"),
    supabaseAdmin.from("claims").select("status"),
    supabaseAdmin
      .from("usage_counters")
      .select("analyses_used, letters_used")
      .eq("period_start", period),
  ]);

  const planCounts: Record<string, number> = { free: 0, basic: 0, pro: 0 };
  for (const row of subs ?? []) planCounts[row.plan] = (planCounts[row.plan] ?? 0) + 1;
  // Users with no subscription row are on the implicit free plan.
  planCounts["free"] = (planCounts["free"] ?? 0) + Math.max(0, totalUsers - (subs?.length ?? 0));

  const statusCounts: Record<string, number> = {};
  for (const row of claims ?? []) {
    const status = row.status ?? "draft";
    statusCounts[status] = (statusCounts[status] ?? 0) + 1;
  }

  const monthlyUsage = (usage ?? []).reduce(
    (acc, row) => ({
      analyses: acc.analyses + (row.analyses_used ?? 0),
      letters: acc.letters + (row.letters_used ?? 0),
    }),
    { analyses: 0, letters: 0 },
  );

  return {
    totalUsers,
    totalClaims,
    totalAnalyses,
    totalLetters,
    needsAction: (statusCounts["draft"] ?? 0) + (statusCounts["needs_info"] ?? 0),
    planCounts,
    statusCounts,
    monthlyUsage,
  };
}

export async function listAdminUsers(): Promise<AdminUserRow[]> {
  const period = periodStart();
  const [{ data: profiles }, { data: subs }, { data: usage }, { data: claims }, authUsers, { data: plans }] =
    await Promise.all([
      supabaseAdmin.from("profiles").select("id, full_name, created_at"),
      supabaseAdmin.from("subscriptions").select("user_id, plan"),
      supabaseAdmin
        .from("usage_counters")
        .select("user_id, analyses_used, letters_used")
        .eq("period_start", period),
      supabaseAdmin.from("claims").select("user_id"),
      listAuthUsers(),
      supabaseAdmin.from("plans").select("id, monthly_analyses, monthly_letters"),
    ]);

  const planById = new Map((plans ?? []).map((p) => [p.id, p]));
  const planByUser = new Map((subs ?? []).map((s) => [s.user_id, s.plan]));
  const usageByUser = new Map((usage ?? []).map((u) => [u.user_id, u]));
  const claimsByUser = new Map<string, number>();
  for (const claim of claims ?? [])
    claimsByUser.set(claim.user_id, (claimsByUser.get(claim.user_id) ?? 0) + 1);

  return (profiles ?? [])
    .map((profile) => {
      const auth = authUsers.get(profile.id);
      const plan = planByUser.get(profile.id) ?? "free";
      const limits = planById.get(plan);
      const used = usageByUser.get(profile.id);
      return {
        id: profile.id,
        fullName: profile.full_name,
        email: auth?.email ?? null,
        plan,
        accountStatus: auth?.status ?? "active",
        createdAt: profile.created_at,
        lastActivity: auth?.lastActivity ?? null,
        used: { analyses: used?.analyses_used ?? 0, letters: used?.letters_used ?? 0 },
        limits: {
          analyses: limits?.monthly_analyses ?? 0,
          letters: limits?.monthly_letters ?? 0,
        },
        claims: claimsByUser.get(profile.id) ?? 0,
      } satisfies AdminUserRow;
    })
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
}

export async function getAdminUserDetail(userId: string) {
  const users = await listAdminUsers();
  const user = users.find((candidate) => candidate.id === userId) ?? null;
  if (!user) return null;

  const [{ data: claims }, { count: analyses }, { count: letters }] = await Promise.all([
    supabaseAdmin
      .from("claims")
      .select("id, title, category, status, created_at, deadline_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabaseAdmin
      .from("analysis_results")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabaseAdmin
      .from("generated_letters")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  const statusCounts: Record<string, number> = {};
  for (const claim of claims ?? []) {
    const status = claim.status ?? "draft";
    statusCounts[status] = (statusCounts[status] ?? 0) + 1;
  }

  // Document contents and extracted text are intentionally never returned here.
  return {
    user,
    claims: claims ?? [],
    statusCounts,
    analyses: analyses ?? 0,
    letters: letters ?? 0,
  };
}

export async function listAdminPlans(): Promise<AdminPlanRow[]> {
  const [{ data: plans }, { data: subs }, { count: totalUsers }] = await Promise.all([
    supabaseAdmin.from("plans").select("*").order("sort_order"),
    supabaseAdmin.from("subscriptions").select("plan"),
    supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
  ]);

  const counts: Record<string, number> = {};
  for (const sub of subs ?? []) counts[sub.plan] = (counts[sub.plan] ?? 0) + 1;
  counts["free"] = (counts["free"] ?? 0) + Math.max(0, (totalUsers ?? 0) - (subs?.length ?? 0));

  return (plans ?? []).map((plan) => ({
    id: plan.id,
    sortOrder: plan.sort_order,
    monthlyAnalyses: plan.monthly_analyses,
    monthlyLetters: plan.monthly_letters,
    advancedAnalysis: plan.advanced_analysis,
    exports: plan.exports,
    users: counts[plan.id] ?? 0,
  }));
}