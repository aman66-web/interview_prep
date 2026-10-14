import type { SupabaseClient } from "@supabase/supabase-js";
import { allCases } from "@/lib/content/cases";
import type { Deps } from "./interview";
import { createAnthropicLlm } from "./llm-anthropic";
import { createSupabaseStore } from "./store-supabase";

// Wires the interviewer to the real database and the real model. The caller
// passes in the admin client, so only server actions and route handlers (the
// only places allowed to create one) can build this.

export function createInterviewDeps(admin: SupabaseClient): Deps {
  return {
    store: createSupabaseStore(admin),
    llm: createAnthropicLlm(),
    findCase: (id) => allCases.find((c) => c.id === id),
  };
}

/** The store alone, for actions that do not talk to the model (such as starting an interview). */
export function createInterviewStore(admin: SupabaseClient) {
  return createSupabaseStore(admin);
}
