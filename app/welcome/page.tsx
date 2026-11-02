import type { Metadata } from "next";
import { Landing } from "@/components/landing/Landing";

export const metadata: Metadata = {
  title: "DSA Daily: a daily placement plan with a visualiser for every question",
  description: "A free daily plan for LeetCode, SQL and Codeforces, with step by step visualisers, live code in the browser, and CS core subjects taught through real outages.",
  alternates: { canonical: "/welcome" },
};

export default function Welcome() { return <Landing />; }
