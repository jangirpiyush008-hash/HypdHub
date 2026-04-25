import AnimatedSection from "@/components/AnimatedSection";
import MagneticButton from "@/components/MagneticButton";
import SplitTextReveal from "@/components/SplitTextReveal";
import TiltCard from "@/components/TiltCard";
import { serviceItems } from "@/data/site-content";

export default function Services() {
  return (
    <AnimatedSection className="section-space relative border-t border-white/10">
      <div className="container-shell relative" data-parallax-parent>
        <div
          data-parallax
          data-speed="0.12"
          aria-hidden="true"
          className="motion-orb absolute right-0 top-[-10%] h-60 w-60 rounded-full bg-white/8 blur-[120px]"
        />
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <span data-reveal className="eyebrow">Services</span>
            <SplitTextReveal
              as="h2"
              text="A premium digital foundation across build, growth, and automation."
              className="mt-5 text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl"
            />
          </div>
          <div data-reveal data-delay="0.12">
            <MagneticButton href="/services" variant="secondary">
              View All Services
            </MagneticButton>
          </div>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3" data-stagger="0.12">
          {serviceItems.map((service, index) => (
            <TiltCard
              key={service.title}
              data-reveal
              className="surface-panel card-hover p-8"
              strength={8}
            >
              <p className="text-sm uppercase tracking-[0.28em] text-zinc-500">0{index + 1}</p>
              <h3 className="text-2xl font-semibold text-white">{service.title}</h3>
              <p className="mt-4 text-sm leading-7 text-zinc-400">{service.description}</p>
              <div className="mt-8 h-px w-full bg-gradient-to-r from-white/25 via-white/5 to-transparent" />
            </TiltCard>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
}
