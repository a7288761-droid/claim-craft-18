import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const isAdminUser = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { isAdmin: !!data };
  });

export const adminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const admin = await import("./admin.server");
    await admin.assertAdmin(context.supabase, context.userId);
    return admin.getAdminStats();
  });

export const adminUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const admin = await import("./admin.server");
    await admin.assertAdmin(context.supabase, context.userId);
    return admin.listAdminUsers();
  });

export const adminUserDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) => input)
  .handler(async ({ data, context }) => {
    const admin = await import("./admin.server");
    await admin.assertAdmin(context.supabase, context.userId);
    return admin.getAdminUserDetail(data.userId);
  });

export const adminPlans = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const admin = await import("./admin.server");
    await admin.assertAdmin(context.supabase, context.userId);
    return admin.listAdminPlans();
  });