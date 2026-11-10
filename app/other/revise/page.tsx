import { RevisionHub } from "@/components/other/Revision";
import { SHEET_IDS, buildSheet, countItems } from "@/lib/revise";

export default async function RevisePage() {
  const sheets = await Promise.all(SHEET_IDS.map(async (id) => { const s = await buildSheet(id); return { id, title: s.title, blurb: s.blurb, items: countItems(s) }; }));
  return <RevisionHub sheets={sheets} />;
}
