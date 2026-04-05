import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My App",
  description: "A dummy Next.js app",
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
