import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { Logo } from "../Logo";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-bg text-ink">
      <main className="mx-auto flex max-w-[680px] flex-col gap-6 px-4 py-16 sm:px-6">
        <Link href="/" aria-label="DSA Daily, home"><Logo className="h-6 w-auto" /></Link>
        <Link href="/" className="inline-flex w-fit items-center gap-2 body-6 text-muted transition-colors duration-300 hover:text-ink"><ArrowLeft size={14} aria-hidden />Back to DSA Daily</Link>
        <div><h1 className="heading-4">{title}</h1><p className="mt-2 caption-5 text-muted">Last updated {updated}</p></div>
        <div className="legal flex flex-col gap-4 body-3 text-muted">{children}</div>
      </main>
    </div>
  );
}
