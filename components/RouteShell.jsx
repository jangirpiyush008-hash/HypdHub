"use client";

import CustomCursor from "@/components/CustomCursor";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PageTransition from "@/components/PageTransition";
import SmoothScrollProvider from "@/components/SmoothScrollProvider";
import { usePathname } from "next/navigation";

const marketingRoutes = new Set(["/", "/services", "/about", "/contact", "/academy"]);

export default function RouteShell({ children }) {
  const pathname = usePathname();

  if (!marketingRoutes.has(pathname)) {
    return children;
  }

  return (
    <SmoothScrollProvider>
      <div className="relative min-h-screen overflow-x-hidden">
        <CustomCursor />
        <div className="pointer-events-none fixed inset-0 -z-30 bg-[#080808]" />
        <div className="page-grid pointer-events-none fixed inset-0 -z-20 opacity-50" />
        <div className="page-noise pointer-events-none fixed inset-0 -z-10 opacity-60" />
        <Navbar />
        <PageTransition pathname={pathname}>
          <main className="relative z-10">{children}</main>
          <Footer />
        </PageTransition>
      </div>
    </SmoothScrollProvider>
  );
}
