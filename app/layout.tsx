import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Skyra Marketplace",
  description: "Game top-up marketplace — cari harga termurah dari banyak provider",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="antialiased min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
