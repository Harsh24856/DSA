import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Instrument_Sans } from "next/font/google";
import "./globals.css";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const body = Instrument_Sans({ subsets: ["latin"], variable: "--font-body", display: "swap" });

export const metadata: Metadata = {
  title: "DSA Daily · Placement practice tracker",
  description: "Daily LeetCode, SQL and Codeforces practice for placements, with an auto-shifting schedule and spaced revisits.",
  manifest: "/manifest.webmanifest",
  icons: { icon: { url: "/favicon.svg", type: "image/svg+xml" } },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

// Applies the saved theme before first paint so there is no flash of the default palette.
const themeScript = `try{var p=localStorage.getItem("dsa-daily-palette"),m=localStorage.getItem("dsa-daily-theme");if(p&&p!=="midnight")document.documentElement.dataset.palette=p;if(m==="light"||m==="dark")document.documentElement.dataset.theme=m;}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
