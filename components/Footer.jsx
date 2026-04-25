import Link from "next/link";
import AnimatedSection from "@/components/AnimatedSection";
import MagneticButton from "@/components/MagneticButton";
import SplitTextReveal from "@/components/SplitTextReveal";
import { contactDetails, navLinks } from "@/data/site-content";

export default function Footer() {
  return (
    <AnimatedSection as="footer" className="border-t border-white/10 py-10">
      <div className="container-shell">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
          <div data-stagger="0.12">
            <p data-reveal className="font-headline text-sm font-semibold tracking-[0.28em] text-white">
              NUVEXA
            </p>
            <SplitTextReveal
              as="h2"
              text="We build what moves your business."
              className="mt-4 max-w-md text-2xl font-semibold tracking-tight text-white"
            />
            <p data-reveal className="mt-4 max-w-md text-sm leading-7 text-zinc-400">
              NUVEXA by Threebros Media Pvt Ltd builds digital systems with premium structure,
              clear process, and motion-first thinking.
            </p>
            <div data-reveal className="mt-6">
              <MagneticButton href="/contact" variant="secondary">
                Start a Project
              </MagneticButton>
            </div>
          </div>

          <div data-stagger="0.1">
            <p data-reveal className="text-sm uppercase tracking-[0.28em] text-zinc-500">
              Pages
            </p>
            <div className="mt-4 flex flex-col gap-3 text-sm">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  data-cursor="interactive"
                  data-reveal
                  className="text-zinc-400 transition hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div data-stagger="0.1">
            <p data-reveal className="text-sm uppercase tracking-[0.28em] text-zinc-500">
              Contact
            </p>
            <div className="mt-4 flex flex-col gap-3 text-sm">
              <a
                href={`mailto:${contactDetails.email}`}
                data-cursor="interactive"
                data-reveal
                className="text-zinc-400 transition hover:text-white"
              >
                {contactDetails.email}
              </a>
              <a
                href={`tel:${contactDetails.phone}`}
                data-cursor="interactive"
                data-reveal
                className="text-zinc-400 transition hover:text-white"
              >
                {contactDetails.phone}
              </a>
            </div>
          </div>
        </div>

        <div
          data-reveal
          className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between"
        >
          <p>© {new Date().getFullYear()} NUVEXA. All rights reserved.</p>
          <p>We build what moves your business.</p>
        </div>
      </div>
    </AnimatedSection>
  );
}
