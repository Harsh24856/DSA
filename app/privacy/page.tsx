import type { Metadata } from "next";
import { LegalPage } from "@/components/landing/LegalPage";

export const metadata: Metadata = { title: "Privacy: DSA Daily", description: "What DSA Daily stores about you, and why." };

export default function Privacy() {
  return (
    <LegalPage title="Privacy" updated="2 November 2026">
      <h2>What is stored</h2>
      <p>When you sign in with Google, the sign in service (Supabase) receives your email address and basic Google profile details. Your progress is stored against your email: which problems you ticked, how you solved them, your notes, your dates and your quotas.</p>
      <p>Your browser also keeps a local copy of your progress and your theme choices, and a sign in cookie.</p>
      <h2>What it is used for</h2>
      <p>Only to show you your own progress on every device. It is not sold or shown to other users, and no advertising trackers are used.</p>
      <h2>Code you write</h2>
      <p>Code in the playgrounds runs inside your own browser and is not sent to any server. Python and SQL runtimes are downloaded from a public CDN (jsDelivr). Drafts are kept in your browser.</p>
      <h2>Other services</h2>
      <p>The site runs on Vercel, and data is held by Supabase. Some picture themes load images from Unsplash if you choose them. Problem links take you to LeetCode and Codeforces, which have their own policies.</p>
      <h2>Deleting your data</h2>
      <p>Signing out clears the copy on that device. To delete what is stored in your account, open an issue on the <a href="https://github.com/Harsh24856/DSA/issues" className="text-accent underline" target="_blank" rel="noreferrer">GitHub repository</a> asking for it. Do not post your email there; you will be told how to confirm it privately.</p>
    </LegalPage>
  );
}
