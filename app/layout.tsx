import Providers from "@/components/Providers";
import { Toaster } from "@/components/ui/toaster";
import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import { Footer } from "../components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "MSIT Master Proposals 2025",
  icons: {
    icon: "/ntnu.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <Analytics />
          {children}
          <Footer />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
