import { notFound } from "next/navigation";
import { RevisionView } from "@/components/other/Revision";
import { SHEET_IDS, buildSheet, countItems, type SheetId } from "@/lib/revise";

export const dynamicParams = false;
export function generateStaticParams() { return SHEET_IDS.map((sheet) => ({ sheet })); }

// One sheet per page, built at build time; only this sheet's text reaches the browser.
export default async function SheetPage({ params }: { params: Promise<{ sheet: string }> }) {
  const { sheet } = await params;
  const i = (SHEET_IDS as readonly string[]).indexOf(sheet);
  if (i < 0) notFound();
  const near = async (k: number) => { const id = SHEET_IDS[k]; if (!id) return undefined; const s = await buildSheet(id); return { id, title: s.title, blurb: s.blurb, items: countItems(s) }; };
  return <RevisionView sheet={await buildSheet(sheet as SheetId)} prev={await near(i - 1)} next={await near(i + 1)} />;
}
