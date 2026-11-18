// Grades a PyTorch lab step on the Modal grader (grader/genai_grader.py). The program, with the hidden tests and a random
// result token, is built here on the server, so the browser never sees or forges the result lines.
import { NextResponse } from "next/server";
import { serverSupabase } from "@/lib/supabase/server";
import { LABS } from "@/lib/genai2/labs";
import { buildProgram, MAX_CODE, parseResults } from "@/lib/genai2/labs/harness";

// ponytail: per-server-instance memory, so each Vercel instance keeps its own count; move to a Supabase table if abused
const WINDOW_MS = 10 * 60_000, PER_WINDOW = 30;
const recent = new Map<string, number[]>();
function allowed(user: string) {
  const now = Date.now(), list = (recent.get(user) ?? []).filter((t) => now - t < WINDOW_MS);
  if (list.length >= PER_WINDOW) { recent.set(user, list); return false; }
  recent.set(user, [...list, now]);
  return true;
}

const fail = (status: number, error: string) => NextResponse.json({ error }, { status });

export async function POST(req: Request) {
  const url = process.env.MODAL_GRADER_URL, secret = process.env.GRADER_SECRET;
  if (!url || !secret) return fail(503, "The PyTorch grader is not set up yet.");

  // the Playwright runs (NEXT_PUBLIC_E2E=1) have no Supabase session, like the rest of the app in that mode
  const user = process.env.NEXT_PUBLIC_E2E === "1" ? "e2e" : (await (await serverSupabase()).auth.getUser()).data.user?.id;
  if (!user) return fail(401, "Sign in to grade PyTorch code.");
  if (!allowed(user)) return fail(429, `That is ${PER_WINDOW} PyTorch runs in 10 minutes. Wait a few minutes and try again.`);

  const body = (await req.json().catch(() => null)) as { lab?: unknown; step?: unknown; code?: unknown } | null;
  const lab = typeof body?.lab === "string" ? LABS[body.lab] : undefined;
  const index = lab && typeof body?.step === "string" ? lab.steps.findIndex((s) => s.id === body.step) : -1;
  if (!lab || index < 0 || typeof body?.code !== "string") return fail(400, "Unknown lab step.");
  if (body.code.length > MAX_CODE) return fail(400, `Your code is over ${MAX_CODE / 1000} KB.`);

  const token = crypto.randomUUID().replace(/-/g, "");
  const program = buildProgram(lab.steps, index, "torch", body.code, token);
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${secret}` },
      body: JSON.stringify({ program }), signal: AbortSignal.timeout(90_000),
    });
  } catch {
    return fail(502, "The grader did not answer. Try again in a minute.");
  }
  if (!res.ok) return fail(502, "The grader could not run this. Try again in a minute.");
  const out = (await res.json()) as { stdout: string; stderr: string; timedOut: boolean };
  const mark = `@@${token} `;
  return NextResponse.json({
    results: parseResults(out.stdout, token),
    output: [...out.stdout.split("\n").filter((l) => !l.startsWith(mark)), out.stderr].join("\n").trim(),
    timedOut: out.timedOut,
  });
}
