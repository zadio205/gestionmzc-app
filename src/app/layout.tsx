import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { NotificationProvider } from "@/contexts/NotificationContextSimple";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Masyzarac - Gestion Comptable",
  description: "Application de gestion comptable et documentaire",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" data-scroll-behavior="smooth">
      <head>
        <script src="/extension-guard.js" defer></script>
        <script src="/clear-invalid-session.js" defer></script>
      </head>
      <body className={inter.className}>
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </body>
    </html>
  );
}
