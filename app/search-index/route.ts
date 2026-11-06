import { SUBJECT_IDS, loadSubject } from "@/lib/other";

// Every CS core chapter's title and link, built once at build time and fetched by Search the first time it opens,
// so Search does not ship every subject's text.
export const dynamic = "force-static";

export async function GET() {
  const subjects = await Promise.all(SUBJECT_IDS.map(loadSubject));
  return Response.json(subjects.flatMap((s) => s.chapters.map((c) => ({ href: `/other/${s.id}/${c.id}`, label: c.title, tag: s.name }))));
}
