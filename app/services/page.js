import AnimatedSection from "@/components/AnimatedSection";
import MagneticButton from "@/components/MagneticButton";
import SplitTextReveal from "@/components/SplitTextReveal";
import TiltCard from "@/components/TiltCard";
import { serviceItems } from "@/data/site-content";

export const metadata = {
  title: "Services",
  description:
    "Explore NUVEXA services across websites, apps, creative systems, automation, marketing systems, and AI Academy programs."
};

export default function ServicesPage() {
  return (
    <AnimatedSection className="section-space relative">
      <div className="container-shell relative" data-parallax-parent>
        <div
          data-parallax
          data-speed="0.14"
          aria-hidden="true"
          className="motion-orb absolute left-[-6%] top-0 h-52 w-52 rounded-full bg-white/10 blur-[120px]"
        />
        <div className="max-w-3xl">
          <span data-reveal className="eyebrow">Services</span>
          <SplitTextReveal
            as="h1"
            text="Systems built to move faster, ship cleaner, and scale with intent."
            className="mt-6 text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl"
            mode="hero"
            stagger={0.06}
          />
          <p data-reveal data-delay="0.22" className="mt-6 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
            NUVEXA designs and delivers digital systems for ambitious brands. Every service is
            scoped for clarity, priced upfront, and built for real business outcomes.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3" data-stagger="0.12">
          {serviceItems.map((service, index) => (
            <TiltCard
              key={service.title}
              data-reveal
              className="surface-panel card-hover p-8"
              strength={8}
            >
              <p className="text-sm text-zinc-500">0{index + 1}</p>
              <h2 className="mt-6 text-2xl font-semibold text-white">{service.title}</h2>
              <p className="mt-4 text-sm leading-7 text-zinc-400">{service.description}</p>
              <div className="mt-8 h-px w-full bg-gradient-to-r from-white/25 via-white/5 to-transparent" />
            </TiltCard>
          ))}
        </div>

        <div data-reveal className="mt-12 surface-panel flex flex-col gap-6 p-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-zinc-500">Next step</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Send the goal. We ship the system.</h2>
          </div>
          <MagneticButton href="/contact">Start a Project</MagneticButton>
        </div>
      </div>
    </AnimatedSection>
  );
}
