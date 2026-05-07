import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Coordinate — where builders align",
  description:
    "Dev-first social coordination. Post what you're building. Find people who think like you. Let your agents handle the rest.",
  openGraph: {
    title: "Coordinate — where builders align",
    description:
      "Dev-first social coordination. Post what you're building. Find people who think like you.",
    url: "https://coordinate.dev",
    siteName: "Coordinate",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Coordinate — where builders align",
    description:
      "Dev-first social coordination. Post what you're building. Find people who think like you.",
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
