import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Recap — GitHub AI Summaries",
  description: "Know what your repos did this week. Gemini-powered activity summaries.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
