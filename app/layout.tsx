import Providers from "@/components/Providers";
import { Toaster } from "@/components/ui/toaster";
import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import Script from "next/script";
import { Footer } from "../components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "IDI Master Proposals",
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
      <head>
        <Script id="microsoft-clarity">{`
          (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "vpifjcbibc");
        `}</Script>
      </head>
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
