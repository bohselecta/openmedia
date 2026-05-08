import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/shell/AppShell";
import { OmfStoresHydrator } from "@/components/providers/OmfStoresHydrator";
import { QueryProvider } from "@/components/providers/query-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "OpenMediaForge",
  description:
    "Local-first, provider-neutral AI media command desk for serious creators.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} min-h-screen bg-bg font-sans text-ink antialiased`}
      >
        <QueryProvider>
          <TooltipProvider delayDuration={200}>
            <OmfStoresHydrator>
              <AppShell>{children}</AppShell>
            </OmfStoresHydrator>
          </TooltipProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
