"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { refreshScrollTriggers } from "@/utils/animations";
import { ScrollTrigger, setupGsap } from "@/utils/gsap";
import { createLenis } from "@/utils/lenis";

export default function SmoothScrollProvider({ children }) {
  const lenisRef = useRef(null);
  const frameRef = useRef(0);
  const pathname = usePathname();

  useEffect(() => {
    setupGsap();

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return undefined;
    }

    const lenis = createLenis();
    lenisRef.current = lenis;
    lenis.on("scroll", ScrollTrigger.update);

    const raf = (time) => {
      lenis.raf(time);
      frameRef.current = window.requestAnimationFrame(raf);
    };

    frameRef.current = window.requestAnimationFrame(raf);

    const handleResize = () => {
      refreshScrollTriggers();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", handleResize);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (lenisRef.current) {
        lenisRef.current.scrollTo(0, { immediate: true });
      }

      refreshScrollTriggers();
    }, 120);

    return () => {
      window.clearTimeout(timer);
    };
  }, [pathname]);

  return children;
}
