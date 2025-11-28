// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { DebugBridge } from "../components/DebugBridge"; // <--- Import this

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kuro Trainer",
  description: "Node-based Training Interface",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <DebugBridge /> {/* <--- Add this here */}
        {children}
      </body>
    </html>
  );
}