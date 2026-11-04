"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [["/drill", "Pattern drill"], ["/mock", "Mock OA"]] as const;

/** Switches between the two pages under Practice. */
export function PracticeTabs() {
  const path = usePathname();
  return (
    <nav aria-label="Practice" className="mb-6 flex gap-2">
      {TABS.map(([href, label]) => <Link key={href} href={href} aria-current={path === href ? "page" : undefined} className="chip">{label}</Link>)}
    </nav>
  );
}
