import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Skyra Store — Top Up Game Termurah & Terpercaya",
  description: "Top up game favoritmu dengan harga paling murah. QRIS, PayPal, Wise. Proses instant, refund guaranteed.",
  icons: {
    icon: "https://lh3.googleusercontent.com/d/1HmBuyY8D5ccBUUAP-GsCuiTNxpxsaDsu",
  },
  openGraph: {
    title: "Skyra Store — Top Up Game Termurah",
    description: "Heart Service · Run Service · Top Up Game — cepat, aman, murah.",
    images: ["https://lh3.googleusercontent.com/d/1HmBuyY8D5ccBUUAP-GsCuiTNxpxsaDsu"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
