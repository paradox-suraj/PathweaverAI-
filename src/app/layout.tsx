import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

export const viewport: Viewport = {
  themeColor: "#000000",
};

export const metadata: Metadata = {
  title: "PathWeaver AI - AI Academy",
  description: "An AI-powered adaptive learning platform that generates complete courses from YouTube playlists.",
  manifest: "/manifest.json",
  keywords: ["AI", "Learning", "Courses", "YouTube", "Adaptive Learning", "Education"],
  authors: [{ name: "PathWeaver AI Team" }],
  openGraph: {
    title: "PathWeaver AI - AI Academy",
    description: "An AI-powered adaptive learning platform that generates complete courses from YouTube playlists.",
    type: "website",
    siteName: "PathWeaver AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "PathWeaver AI - AI Academy",
    description: "An AI-powered adaptive learning platform that generates complete courses from YouTube playlists.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={cn(jakarta.variable, inter.variable, jetbrains.variable)}>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body-base text-body-base bg-bg-base overflow-x-hidden min-h-screen flex antialiased">
        <Providers>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div className="relative min-h-screen w-full">
              <main className="relative z-10 w-full h-full flex flex-col">
                {children}
              </main>
            </div>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
