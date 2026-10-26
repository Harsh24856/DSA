import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { StoreProvider } from "@/lib/store";
import { PatternProvider } from "@/lib/patternStore";
import { Shell } from "@/components/Shell";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

export const metadata: Metadata = {
  title: "DSA Daily",
  description: "Daily LeetCode, SQL and Codeforces practice for placements, with an auto-shifting schedule, spaced revisits and progress analytics.",
  icons: { icon: "/favicon.svg" },
  manifest: "/manifest.webmanifest",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

// sets the saved palette/mode before first paint so there is no theme flash
const themeScript = `try{var p=localStorage.getItem("dsa-daily-palette"),m=localStorage.getItem("dsa-daily-theme");if(p&&p!=="midnight")document.documentElement.dataset.palette=p;if(m==="light"||m==="dark")document.documentElement.dataset.theme=m;}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body>
        <StoreProvider>
          <PatternProvider>
            <Shell>{children}</Shell>
          </PatternProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
