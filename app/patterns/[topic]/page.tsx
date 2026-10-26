import { notFound } from "next/navigation";
import { TOPICS } from "@/lib/patterns";
import { TopicView } from "@/components/TopicView";

export const dynamicParams = false;
export function generateStaticParams() { return TOPICS.map((t) => ({ topic: t.id })); }

export default async function TopicPage({ params }: { params: Promise<{ topic: string }> }) {
  const { topic } = await params;
  if (!TOPICS.some((t) => t.id === topic)) notFound();
  return <TopicView id={topic} />;
}
