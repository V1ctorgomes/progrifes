import type { Metadata } from "next";
import { Inter, Oswald } from "next/font/google";
import "@/styles/globals.css";
import { HomePage } from "@/features/home/HomePage";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Grifres — Moda Urbana",
  description: "Loja virtual de moda urbana com peças exclusivas e entrega para todo o Brasil.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} ${oswald.variable} font-sans`}>{children}</body>
    </html>
  );
}
