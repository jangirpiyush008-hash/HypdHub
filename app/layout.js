import { Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import RouteShell from "@/components/RouteShell";

const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap"
});

const headingFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-headline",
  display: "swap"
});

export const metadata = {
  title: {
    default: "NUVEXA — Motion-First Studio",
    template: "%s | NUVEXA"
  },
  description:
    "NUVEXA by Threebros Media Pvt Ltd builds websites, apps, creative systems, automation, marketing systems, and AI Academy programs.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg"
  }
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${bodyFont.variable} ${headingFont.variable}`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning className="bg-surface font-body text-text antialiased">
        <AuthProvider>
          <RouteShell>{children}</RouteShell>
        </AuthProvider>
      </body>
    </html>
  );
}
