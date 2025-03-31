import { AISummaryProvider } from "@/components/AISummaryProvider";
import { ImprovedTitlesProvider } from "@/components/ImprovedTitlesProvider";
import { ProjectDataProvider } from "@/components/ProjectDataProvider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { Analytics } from "@vercel/analytics/react";
import { Provider } from "jotai";
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
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <Provider>
                        <ProjectDataProvider>
                            <AISummaryProvider>
                                <ImprovedTitlesProvider>
                                    <Analytics />
                                    {children}
                                    <Footer />
                                    <Toaster />
                                </ImprovedTitlesProvider>
                            </AISummaryProvider>
                        </ProjectDataProvider>
                    </Provider>
                </ThemeProvider>
            </body>
        </html>
    );
}
