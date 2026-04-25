"use client";

import { useLayoutEffect, useRef } from "react";
import AnimatedSection from "@/components/AnimatedSection";
import MagneticButton from "@/components/MagneticButton";
import SplitTextReveal from "@/components/SplitTextReveal";
import TiltCard from "@/components/TiltCard";
import {
  contactDetails,
  heroBadges,
  heroStats,
  homeHighlights,
  marqueeItems
} from "@/data/site-content";
import { initPointerParallax } from "@/utils/animations";
import { gsap, setupGsap } from "@/utils/gsap";

export default function Hero() {
  const heroRef = useRef(null);

  useLayoutEffect(() => {
    const root = heroRef.current;

    if (!root) {
      return undefined;
    }

    setupGsap();
    const cleanupPointer = initPointerParallax(root, { movement: 42 });
    const context = gsap.context(() => {
      gsap.fromTo(
        "[data-hero-chip]",
        {
          autoAlpha: 0,
          y: 32,
          scale: 0.92
        },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.9,
          ease: "power4.out",
          stagger: 0.08,
          delay: 0.08
        }
      );

      gsap.fromTo(
        "[data-hero-stat]",
        {
          autoAlpha: 0,
          y: 42
        },
        {
          autoAlpha: 1,
          y: 0,
          duration: 1,
          ease: "power4.out",
          stagger: 0.1,
          delay: 0.32
        }
      );

      gsap.fromTo(
        "[data-hero-panel]",
        {
          autoAlpha: 0,
          x: 70,
          rotateY: -10,
          scale: 0.96
        },
        {
          autoAlpha: 1,
          x: 0,
          rotateY: 0,
          scale: 1,
          duration: 1.2,
          ease: "power4.out",
          delay: 0.18
        }
      );

      gsap.fromTo(
        "[data-floating-card]",
        {
          autoAlpha: 0,
          y: 60,
          scale: 0.9
        },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 1.05,
          ease: "power4.out",
          stagger: 0.1,
          delay: 0.35
        }
      );
    }, root);

    return () => {
      cleanupPointer();
      context.revert();
    };
  }, []);

  const marqueeLoop = [...marqueeItems, ...marqueeItems];

  return (
    <AnimatedSection className="section-space relative overflow-hidden pt-10 sm:pt-14 lg:pt-16">
      <div ref={heroRef} className="container-shell relative" data-parallax-parent>
        <div
          data-parallax
          data-speed="0.08"
          data-depth="0.18"
          aria-hidden="true"
          className="hero-mesh absolute inset-x-[8%] top-10 h-[34rem] rounded-[3rem] opacity-80"
        />
        <div
          data-parallax
          data-speed="0.16"
          data-float="lg"
          data-depth="0.38"
          aria-hidden="true"
          className="motion-orb absolute left-[-8%] top-24 h-64 w-64 rounded-full bg-white/12 blur-[120px]"
        />
        <div
          data-parallax
          data-speed="0.12"
          data-float="md"
          data-depth="0.32"
          aria-hidden="true"
          className="motion-orb absolute right-[4%] top-[8%] h-72 w-72 rounded-full bg-zinc-400/10 blur-[150px]"
        />
        <div
          data-float="sm"
          data-depth="0.25"
          data-spin
          aria-hidden="true"
          className="absolute left-[46%] top-6 hidden h-28 w-28 rounded-full border border-white/10 md:block"
        />

        <div className="relative z-10 grid gap-14 xl:grid-cols-[1.02fr_0.98fr] xl:items-center">
          <div className="max-w-4xl">
            <div className="flex flex-wrap gap-3" data-stagger="0.08">
              {heroBadges.map((badge) => (
                <span
                  key={badge}
                  data-hero-chip
                  className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] font-medium uppercase tracking-[0.28em] text-zinc-300"
                >
                  {badge}
                </span>
              ))}
            </div>

            <span data-reveal className="eyebrow mt-8">
              NUVEXA • Motion-First Studio
            </span>

            <div className="mt-7 max-w-[56rem]">
              <SplitTextReveal
                as="div"
                text="We build what"
                mode="hero"
                stagger={0.07}
                className="text-balance text-[clamp(4rem,9vw,8rem)] font-semibold leading-[0.9] tracking-[-0.05em] text-white"
              />
              <SplitTextReveal
                as="div"
                mode="hero"
                delay={0.14}
                stagger={0.07}
                className="mt-1 text-balance text-[clamp(4rem,9vw,8rem)] font-semibold leading-[0.9] tracking-[-0.05em] text-white"
                segments={[
                  {
                    text: "moves",
                    className: "hypd-gradient-text"
                  },
                  {
                    text: "your"
                  }
                ]}
              />
              <SplitTextReveal
                as="div"
                text="business."
                mode="hero"
                delay={0.28}
                stagger={0.07}
                className="mt-1 text-balance text-[clamp(4rem,9vw,8rem)] font-semibold leading-[0.9] tracking-[-0.05em] text-white"
              />
            </div>

            <p
              data-reveal
              data-delay="0.28"
              className="mt-8 max-w-2xl text-lg leading-8 text-zinc-400"
            >
              NUVEXA builds premium websites, apps, automation systems, and creative
              infrastructure for brands that want speed, polish, and a system that still feels
              alive months after launch.
            </p>

            <p
              data-reveal
              data-delay="0.36"
              className="mt-5 text-sm uppercase tracking-[0.28em] text-zinc-500"
            >
              Send the goal. We ship the system.
            </p>

            <div className="mt-9 flex flex-wrap gap-4" data-stagger="0.12">
              <div data-reveal>
                <MagneticButton href="/contact" className="px-7 py-4 text-base">
                  Start a Project
                </MagneticButton>
              </div>
              <div data-reveal>
                <MagneticButton href="/services" variant="secondary" className="px-7 py-4 text-base">
                  Explore Services
                </MagneticButton>
              </div>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3" data-stagger="0.1">
              {heroStats.map((item) => (
                <div
                  key={item.label}
                  data-hero-stat
                  className="rounded-[1.7rem] border border-white/10 bg-white/[0.03] px-5 py-5 backdrop-blur"
                >
                  <p className="text-3xl font-semibold tracking-tight text-white">{item.value}</p>
                  <p className="mt-2 text-sm text-zinc-500">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-h-[38rem] lg:min-h-[42rem]">
            <div
              data-floating-card
              data-float="sm"
              data-depth="0.38"
              className="hero-stat-card absolute left-0 top-4 z-20 max-w-[15rem] rounded-[1.8rem] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl"
            >
              <p className="text-[11px] uppercase tracking-[0.3em] text-zinc-500">Start point</p>
              <p className="mt-4 text-2xl font-semibold text-white">Goal to execution in one system.</p>
              <p className="mt-3 text-sm leading-7 text-zinc-400">
                Strategy, design, build, and rollout scoped around the same core outcome.
              </p>
            </div>

            <div
              data-hero-panel
              data-depth="0.24"
              className="hero-panel absolute right-0 top-10 w-full max-w-[34rem] rounded-[2.6rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-6 shadow-[0_40px_140px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:p-8"
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-[0.34em] text-zinc-500">Launch Rhythm</p>
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <span className="inline-flex h-2 w-2 rounded-full bg-white" />
                  Live build system
                </div>
              </div>

              <div className="mt-7 space-y-5">
                {homeHighlights.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-[1.6rem] border border-white/10 bg-black/10 px-5 py-5"
                  >
                    <div className="flex items-start justify-between gap-5">
                      <div>
                        <p className="text-xl font-medium text-white">{item.title}</p>
                        <p className="mt-3 text-sm leading-7 text-zinc-400">{item.body}</p>
                      </div>
                      <span className="text-xs uppercase tracking-[0.28em] text-zinc-500">
                        {item.meta}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-7 rounded-[1.8rem] border border-white/10 bg-white/[0.05] p-5">
                <p className="text-[11px] uppercase tracking-[0.3em] text-zinc-500">Direct contact</p>
                <a
                  href={`mailto:${contactDetails.email}`}
                  data-cursor="interactive"
                  className="mt-4 block text-xl font-medium text-white"
                >
                  {contactDetails.email}
                </a>
              </div>
            </div>

            <TiltCard
              data-floating-card
              data-depth="0.4"
              data-float="md"
              className="hero-stat-card absolute left-8 bottom-12 z-20 w-[16rem] rounded-[1.8rem] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl"
              strength={7}
              scale={1.03}
            >
              <p className="text-[11px] uppercase tracking-[0.3em] text-zinc-500">Build model</p>
              <p className="mt-4 text-2xl font-semibold text-white">Fixed price. Clear scope.</p>
              <div className="mt-5 h-px w-full bg-gradient-to-r from-white/30 via-white/10 to-transparent" />
            </TiltCard>

            <div
              data-floating-card
              data-depth="0.34"
              data-float="sm"
              className="hero-stat-card absolute bottom-0 right-6 z-20 w-[14rem] rounded-[1.8rem] border border-white/10 bg-zinc-950/85 p-5 backdrop-blur-xl"
            >
              <p className="text-[11px] uppercase tracking-[0.3em] text-zinc-500">Outcome</p>
              <p className="mt-4 text-xl font-semibold text-white">Motion-led systems that stay usable.</p>
            </div>
          </div>
        </div>

        <div
          data-reveal
          className="mt-16 overflow-hidden rounded-full border border-white/10 bg-white/[0.03] py-4"
        >
          <div className="marquee-track">
            {marqueeLoop.map((item, index) => (
              <div key={`${item}-${index}`} className="marquee-item">
                <span className="text-sm uppercase tracking-[0.32em] text-zinc-400">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}
