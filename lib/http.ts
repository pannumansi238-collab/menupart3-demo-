import "server-only";
import { hasSupabaseConfig } from "@/lib/supabase";
import type { ZodType } from "zod";

export function databaseUnavailable() {
  if (hasSupabaseConfig()) return null;
  return Response.json(
    { error: "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY." },
    { status: 503 }
  );
}

export async function readJson<T>(request: Request, schema: ZodType<T>): Promise<
  { success: true; data: T } | { success: false; response: Response }
> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { success: false, response: Response.json({ error: "Request body must be valid JSON." }, { status: 400 }) };
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      success: false,
      response: Response.json({ error: "Please check the submitted details.", details: parsed.error.flatten().fieldErrors }, { status: 400 })
    };
  }
  return { success: true, data: parsed.data };
}

export function errorResponse(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : fallback;
  console.error(fallback, error);
  return Response.json({ error: message }, { status: 500 });
}
