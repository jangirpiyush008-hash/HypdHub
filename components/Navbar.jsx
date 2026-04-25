"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import MagneticButton from "@/components/MagneticButton";
import { navLinks } from "@/data/site-content";
import { setupGsap } from "@/utils/gsap";

export default function Navbar() {
  const pathname = usePathname();
  const headerRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useLayoutEffect(() => {
    const gsap = setupGsap();
    const animation = gsap.fromTo(
      headerRef.current,
      {
        y: -32,
        autoAlpha: 0
      },
      {
        y: 0,
        autoAlpha: 1,
        duration: 0.9,
        ease: "power4.out"
      }
    );

    return () => animation.kill();
  }, [pathname]);

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-40 border-b border-white/10 bg-black/30 backdrop-blur-xl"
    >
      <div className="container-shell">
        <div className="flex min-h-[80px] items-center justify-between gap-6">
          <Link href="/" data-cursor="interactive" className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] font-headline text-sm font-semibold text-white">
              N
            </span>
            <div>
              <p className="font-headline text-sm font-semibold tracking-[0.28em] text-white">NUVEXA</p>
              <p className="text-xs text-zinc-500">Motion-First Studio</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  data-cursor="interactive"
                  className={`text-sm transition-colors ${
                    isActive ? "text-white" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden md:block">
            <MagneticButton href="/contact">
              Start a Project
            </MagneticButton>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen((open) => !open)}
            data-cursor="interactive"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white transition hover:bg-white/[0.08] md:hidden"
            aria-label="Toggle navigation"
            aria-expanded={isOpen}
          >
            <span className="space-y-1">
              <span className="block h-px w-5 bg-current" />
              <span className="block h-px w-5 bg-current" />
              <span className="block h-px w-5 bg-current" />
            </span>
          </button>
        </div>

        {isOpen ? (
          <div className="border-t border-white/10 py-5 md:hidden">
            <nav className="flex flex-col gap-3">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    data-cursor="interactive"
                    className={`rounded-2xl px-4 py-3 text-sm transition ${
                      isActive
                        ? "bg-white/[0.08] text-white"
                        : "bg-white/[0.03] text-zinc-300 hover:bg-white/[0.06]"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <MagneticButton href="/contact" className="mt-2">
                Start a Project
              </MagneticButton>
            </nav>
          </div>
        ) : null}
      </div>
    </header>
  );
}
