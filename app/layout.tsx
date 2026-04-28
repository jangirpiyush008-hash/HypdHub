import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import { BottomNav } from "@/components/bottom-nav";
import { InspectShield } from "@/components/inspect-shield";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "HYPD Hub — Creator Deal Platform",
  description: "Discover the best deals across Indian marketplaces, convert HYPD affiliate links, and automate distribution.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  verification: {
    google: "UEijPBrz56PQu15K5MonGNIXpUVtixpR9Vc9U3PEYoA"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light">
      <head>
        {/* Apply persisted theme before paint to avoid flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('hypd-theme');if(t==='dark'){document.documentElement.setAttribute('data-theme','dark')}else{document.documentElement.setAttribute('data-theme','light')}}catch(e){}`,
          }}
        />
      </head>
      <body suppressHydrationWarning className="bg-surface font-body text-text antialiased">
        <AuthProvider>
          <InspectShield />
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
