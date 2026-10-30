import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Séance Studio — Victorian Horror Mystery & Occult Deduction",
  description:
    "An offline-first interactive paranormal deduction mystery game. Interrogate the dead, piece together forensic clues, and deduce the truth in an air-gapped séance chamber.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-[#060507] text-[#ece3cd] antialiased">
      <body className="min-h-full flex flex-col selection:bg-[#c5a059]/30 selection:text-[#dfc282]">
        {children}
      </body>
    </html>
  );
}
