import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function NotFound() {
  return (
    <main className="grid min-h-[100dvh] place-items-center bg-bg px-4 text-center text-ink">
      <div className="flex max-w-[480px] flex-col items-center gap-4">
        <Logo className="h-6 w-auto" />
        <h1 className="hero-text heading-3">This page does not exist</h1>
        <p className="body-3 text-muted">The link may be old, or the address may have a typo. Your plan is still where you left it.</p>
        <Link href="/" className="btn btn-primary">Go to today&apos;s plan</Link>
      </div>
    </main>
  );
}
