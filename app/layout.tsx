import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import { BottomNav } from "@/components/bottom-nav";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "HYPD Hub — Creator Deal Platform",
  description: "Discover deals, convert HYPD affiliate links, and automate distribution across Telegram and WhatsApp."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark">
      <body suppressHydrationWarning className="bg-surface font-body text-text antialiased">
        <AuthProvider>
          <div className="relative min-h-screen overflow-x-hidden">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-hero-glow" />
            <SiteHeader />
            <main className="mx-auto min-h-screen w-full max-w-7xl px-4 pb-28 pt-20 sm:px-6 lg:px-8">
              {children}
            </main>
            <BottomNav />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
