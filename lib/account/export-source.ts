import type { SupabaseClient } from "@supabase/supabase-js";
import type { ExportSource } from "./export";

/** Reads export rows with the admin client. Callers must already have checked who the user is. */
export function supabaseExportSource(admin: SupabaseClient): ExportSource {
  return {
    async rowsFor(table, column, values) {
      const { data, error } = await admin.from(table).select("*").in(column, values);
      if (error) throw new Error(`Export failed reading ${table}: ${error.message}`);
      return (data ?? []) as Record<string, unknown>[];
    },
  };
}
