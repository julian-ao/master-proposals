import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import { Footer } from "../components/Footer";
import { Toaster } from "@/components/ui/toaster";
import { ProjectDataProvider } from "@/components/ProjectDataProvider";
import { AISummaryProvider } from "@/components/AISummaryProvider";
import { ImprovedTitlesProvider } from "@/components/ImprovedTitlesProvider";
import { Provider } from "jotai";
import {DarkModeToggle} from '@/components/DarkModeToggle';

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
                <Provider>
                    <ProjectDataProvider>
                        <AISummaryProvider>
                            <ImprovedTitlesProvider>
                                <Analytics />
                                <DarkModeToggle />
                                {children}
                                <Footer />
                                <Toaster />
                            </ImprovedTitlesProvider>
                        </AISummaryProvider>
                    </ProjectDataProvider>
                </Provider>
            </body>
        </html>
    );
}
