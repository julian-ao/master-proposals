import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import { Footer } from "../components/Footer";
import { Toaster } from "@/components/ui/toaster";

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
        <html lang="en">
            <body>
                <Analytics />
                {children}
                <Footer />
                <Toaster />
            </body>
        </html>
    );
}
