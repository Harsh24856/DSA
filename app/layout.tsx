import type { Metadata, Viewport } from "next";
import { Archivo, Geist, Geist_Mono } from "next/font/google";
import { StoreProvider } from "@/lib/store";
import { PatternProvider } from "@/lib/patternStore";
import { Shell } from "@/components/Shell";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });
const archivo = Archivo({ subsets: ["latin"], weight: "900", variable: "--font-archivo", display: "swap" }); // logo letters only

export const metadata: Metadata = {
  metadataBase: new URL("https://dsa-visualizer-ashy-omega.vercel.app"),
  title: "DSA Daily",
  description: "A free daily plan for LeetCode, SQL and Codeforces, with step by step visualisers, live code in the browser, and CS core subjects taught through real outages.",
  icons: { icon: "/favicon.svg" },
  manifest: "/manifest.webmanifest",
  openGraph: { title: "DSA Daily", description: "Know what to solve today, and see exactly why it works. A free daily placement plan with a visualiser for every LeetCode question.", type: "website", url: "/welcome" },
  twitter: { card: "summary_large_image" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

// sets the saved palette/mode/look (dark unless chosen otherwise) before first paint so there is no theme flash
const themeScript = `try{var p=localStorage.getItem("dsa-daily-palette"),m=localStorage.getItem("dsa-daily-theme");if(p&&p!=="midnight")document.documentElement.dataset.palette=p;if(m==="light"||m==="dark")document.documentElement.dataset.theme=m;else if(!m)document.documentElement.dataset.theme="dark";var l=localStorage.getItem("dsa-daily-look");if(l&&l!=="classic"){document.documentElement.dataset.look=l;document.documentElement.dataset.kind=["paper","blueprint","terminal"].indexOf(l)<0?"photo":"drawn";if(["frieren","maple","keyblade","spidey","pinksky"].indexOf(l)>=0)document.documentElement.dataset.light="";}}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} ${archivo.variable}`} suppressHydrationWarning>
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
