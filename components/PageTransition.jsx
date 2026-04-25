"use client";

import { useLayoutEffect, useRef } from "react";
import { animatePageTransition } from "@/utils/animations";

export default function PageTransition({ children, pathname }) {
  const overlayRef = useRef(null);
  const contentRef = useRef(null);

  useLayoutEffect(() => {
    const cleanup = animatePageTransition(contentRef.current, overlayRef.current);

    return cleanup;
  }, [pathname]);

  return (
    <>
      <div
        ref={overlayRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-50 origin-bottom bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.02))]"
      />
      <div ref={contentRef}>{children}</div>
    </>
  );
}
