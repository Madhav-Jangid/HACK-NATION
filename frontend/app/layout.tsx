import type { Metadata } from "next";
import { ThemeProvider } from "@/components/layout/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "VC Brain",
  description:
    "Autonomous AI investment committee — sourcing, research, and evidence-backed founder scoring.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" forcedTheme="light">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
