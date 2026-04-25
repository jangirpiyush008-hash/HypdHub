import AnimatedSection from "@/components/AnimatedSection";
import MagneticButton from "@/components/MagneticButton";
import SplitTextReveal from "@/components/SplitTextReveal";
import { contactDetails } from "@/data/site-content";

export default function CTA() {
  return (
    <AnimatedSection className="section-space relative border-t border-white/10">
      <div className="container-shell relative" data-parallax-parent>
        <div
          data-parallax
          data-speed="0.18"
          aria-hidden="true"
          className="motion-orb absolute left-[12%] top-6 h-40 w-40 rounded-full bg-white/10 blur-[120px]"
        />
        <div className="surface-panel overflow-hidden p-8 sm:p-10 lg:p-12">
          <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <span data-reveal className="eyebrow">Ready When You Are</span>
              <SplitTextReveal
                as="h2"
                text="Send the goal. We will return with the plan, the scope, and the next move."
                className="mt-6 max-w-3xl text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl"
              />
              <p data-reveal data-delay="0.1" className="mt-6 max-w-2xl text-base leading-8 text-zinc-400">
                NUVEXA is built for teams that want a sharper digital system without overcomplicating
                the path to launch.
              </p>
            </div>

            <div className="space-y-4" data-stagger="0.12">
              <div data-reveal>
                <MagneticButton href="/contact" className="w-full">
                  Contact NUVEXA
                </MagneticButton>
              </div>
              <div data-reveal>
                <MagneticButton href={`mailto:${contactDetails.email}`} variant="secondary" className="w-full">
                  {contactDetails.email}
                </MagneticButton>
              </div>
              <div data-reveal>
                <MagneticButton href={`tel:${contactDetails.phone}`} variant="secondary" className="w-full">
                  {contactDetails.phone}
                </MagneticButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}
