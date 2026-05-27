import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ProofTicket — structured handoffs for human and AI coworkers",
  description:
    "Turn agent work into scoped tickets, human approvals, durable receipts, and exportable evidence.",
  openGraph: {
    title: "ProofTicket — structured handoffs for human and AI coworkers",
    description:
      "Turn agent work into scoped tickets, human approvals, durable receipts, and exportable evidence.",
    url: "https://proofticket.local",
    siteName: "ProofTicket",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ProofTicket — structured handoffs for human and AI coworkers",
    description:
      "Turn agent work into scoped tickets, human approvals, durable receipts, and exportable evidence.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
