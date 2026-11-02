import type { Metadata } from "next";
import { LegalPage } from "@/components/landing/LegalPage";

export const metadata: Metadata = { title: "Terms: DSA Daily", description: "The terms for using DSA Daily." };

export default function Terms() {
  return (
    <LegalPage title="Terms" updated="2 November 2026">
      <p>DSA Daily is a free study tool, provided as it is, with no guarantee that it will always be available or free of mistakes. Using it does not guarantee any placement or job outcome.</p>
      <p>Please do not attack the service, try to reach other people&apos;s data, or use automated tools to overload it.</p>
      <p>DSA Daily is not affiliated with LeetCode, Codeforces, or any company named in its case studies. Problem names belong to their owners. Case studies summarise public write ups and link to them.</p>
      <p>Keep your own copy of anything important. Settings has a backup download for your progress.</p>
    </LegalPage>
  );
}
