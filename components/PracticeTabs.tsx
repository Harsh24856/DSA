"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [["/drill", "Pattern drill"], ["/mock", "Mock OA"], ["/other/revise/dsa", "DSA cheat sheet"]] as const;

/** Switches between the pages under Practice; the cheat sheet lives with the other revision sheets in CS core. */
export function PracticeTabs() {
  const path = usePathname();
  return (
    <nav aria-label="Practice" className="mb-6 flex gap-2">
      {TABS.map(([href, label]) => <Link key={href} href={href} aria-current={path === href ? "page" : undefined} className="chip">{label}</Link>)}
    </nav>
  );
}
