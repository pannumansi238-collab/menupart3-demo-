import "server-only";
import { getSupabase, hasSupabaseConfig } from "@/lib/supabase";

const developmentWindows = new Map<string, { startedAt: number; count: number }>();

export async function enforceRateLimit(request: Request, bucket: string, limit: number, windowSeconds: number) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim();
  const address = request.headers.get("x-real-ip") || forwarded || "unknown";
  const key = `${bucket}:${address}`;

  if (hasSupabaseConfig()) {
    const { data, error } = await getSupabase().rpc("check_public_rate_limit", {
      p_key: key,
      p_limit: limit,
      p_window_seconds: windowSeconds
    });
    if (error) throw new Error(`Rate-limit check failed: ${error.message}`);
    if (data !== true) return false;
    return true;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Persistent rate limiting requires the configured Supabase project.");
  }
  const now = Date.now();
  const current = developmentWindows.get(key);
  if (!current || now - current.startedAt >= windowSeconds * 1000) {
    developmentWindows.set(key, { startedAt: now, count: 1 });
    return true;
  }
  current.count += 1;
  return current.count <= limit;
}
