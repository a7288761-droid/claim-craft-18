import { supabaseAdmin } from "@/integrations/supabase/client.server";

const BUCKET = "documents";

/** Removes every stored file under the user's own storage prefix. */
async function removeUserFiles(userId: string) {
  const prefixes = [userId];
  const paths: string[] = [];

  while (prefixes.length > 0) {
    const prefix = prefixes.pop()!;
    const { data, error } = await supabaseAdmin.storage.from(BUCKET).list(prefix, { limit: 1000 });
    if (error) throw error;
    for (const entry of data ?? []) {
      const full = `${prefix}/${entry.name}`;
      // Folders come back without metadata.
      if (entry.id === null || entry.metadata === null) prefixes.push(full);
      else paths.push(full);
    }
  }

  for (let i = 0; i < paths.length; i += 100) {
    const { error } = await supabaseAdmin.storage.from(BUCKET).remove(paths.slice(i, i + 100));
    if (error) throw error;
  }
  return paths.length;
}

/**
 * Deletes all personal data owned by a single user, then the auth account itself.
 * Every statement is scoped to that user id only.
 */
export async function deleteUserAccount(userId: string) {
  // Storage first: the DB rows hold the paths we need.
  const filesRemoved = await removeUserFiles(userId);

  // Children before parents so foreign keys to claims stay satisfied.
  const orderedTables = [
    "document_questions",
    "analysis_results",
    "generated_letters",
    "notifications",
    "documents",
    "claims",
    "usage_counters",
    "subscriptions",
    "user_roles",
  ] as const;

  for (const table of orderedTables) {
    const { error } = await supabaseAdmin.from(table).delete().eq("user_id", userId);
    if (error) throw new Error(`Failed to delete ${table}: ${error.message}`);
  }

  const { error: profileError } = await supabaseAdmin.from("profiles").delete().eq("id", userId);
  if (profileError) throw new Error(`Failed to delete profile: ${profileError.message}`);

  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (authError) throw new Error(`Failed to delete auth user: ${authError.message}`);

  return { ok: true as const, filesRemoved };
}
