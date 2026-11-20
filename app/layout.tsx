import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AJZ 2026 — You Are Invited",
  description: "Saturday, 15th November 2026 · The Grand Ballroom, Eko Hotel, Lagos",
  metadataBase: new URL("https://gather.afara.tech"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-black text-white">
        {children}
      </body>
    </html>
  );
}