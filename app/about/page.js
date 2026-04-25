import AnimatedSection from "@/components/AnimatedSection";
import MagneticButton from "@/components/MagneticButton";
import SplitTextReveal from "@/components/SplitTextReveal";

export const metadata = {
  title: "About",
  description: "Learn about NUVEXA, the motion-first studio by Threebros Media Pvt Ltd."
};

const principles = [
  "Clarity before complexity.",
  "Systems before noise.",
  "Premium execution without drag."
];

export default function AboutPage() {
  return (
    <AnimatedSection className="section-space relative">
      <div className="container-shell relative" data-parallax-parent>
        <div
          data-parallax
          data-speed="0.12"
          aria-hidden="true"
          className="motion-orb absolute right-[-4%] top-[4%] h-52 w-52 rounded-full bg-white/8 blur-[120px]"
        />
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="surface-panel p-8 sm:p-10" data-stagger="0.12">
            <span data-reveal className="eyebrow">About NUVEXA</span>
            <SplitTextReveal
              as="h1"
              text="NUVEXA is a motion-first studio built to turn business intent into digital systems."
              className="mt-6 text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl"
              mode="hero"
              stagger={0.06}
            />
            <p data-reveal className="mt-6 max-w-2xl text-base leading-8 text-zinc-400">
              Built by Threebros Media Pvt Ltd, NUVEXA partners with teams that want cleaner
              execution, sharper positioning, and faster delivery. We build websites, apps,
              automation flows, and brand systems that feel premium from first click to launch.
            </p>
            <p data-reveal className="mt-6 max-w-2xl text-base leading-8 text-zinc-400">
              Our approach is simple: understand the goal, define the system, and ship with focus.
              No bloated process. No vague scope. Just clear thinking and strong output.
            </p>
          </div>

          <div className="space-y-5" data-stagger="0.12">
            <div data-reveal className="surface-panel p-8">
              <p className="text-sm uppercase tracking-[0.28em] text-zinc-500">Taglines</p>
              <div className="mt-5 space-y-4">
                <p className="text-xl font-medium text-white">We build what moves your business.</p>
                <p className="text-xl font-medium text-zinc-300">Send the goal. We ship the system.</p>
              </div>
            </div>

            <div data-reveal className="surface-panel p-8">
              <p className="text-sm uppercase tracking-[0.28em] text-zinc-500">Principles</p>
              <ul className="mt-5 space-y-4 text-sm leading-7 text-zinc-400">
                {principles.map((principle) => (
                  <li key={principle}>{principle}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-4" data-stagger="0.12">
          <div data-reveal>
            <MagneticButton href="/services" variant="secondary">
              View Services
            </MagneticButton>
          </div>
          <div data-reveal>
            <MagneticButton href="/contact">Contact Studio</MagneticButton>
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}
