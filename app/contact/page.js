import AnimatedSection from "@/components/AnimatedSection";
import MagneticButton from "@/components/MagneticButton";
import SplitTextReveal from "@/components/SplitTextReveal";
import { contactDetails } from "@/data/site-content";

export const metadata = {
  title: "Contact",
  description: "Contact NUVEXA to start a new website, app, automation, or AI Academy engagement."
};

export default function ContactPage() {
  return (
    <AnimatedSection className="section-space relative">
      <div className="container-shell relative" data-parallax-parent>
        <div
          data-parallax
          data-speed="0.12"
          aria-hidden="true"
          className="motion-orb absolute left-[-5%] top-[8%] h-56 w-56 rounded-full bg-white/10 blur-[130px]"
        />
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="surface-panel p-8 sm:p-10" data-stagger="0.12">
            <span data-reveal className="eyebrow">Contact</span>
            <SplitTextReveal
              as="h1"
              text="Share the goal and we will shape the right system around it."
              className="mt-6 text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl"
              mode="hero"
              stagger={0.06}
            />
            <p data-reveal className="mt-6 max-w-xl text-base leading-8 text-zinc-400">
              We usually respond with direction, scope, and the best next step first. The delivery
              plan comes after the goal is clear.
            </p>

            <div className="mt-10 space-y-5 text-sm text-zinc-300">
              <div data-reveal>
                <p className="uppercase tracking-[0.28em] text-zinc-500">Email</p>
                <a
                  href={`mailto:${contactDetails.email}`}
                  data-cursor="interactive"
                  className="mt-2 inline-block text-base text-white"
                >
                  {contactDetails.email}
                </a>
              </div>
              <div data-reveal>
                <p className="uppercase tracking-[0.28em] text-zinc-500">Phone</p>
                <a
                  href={`tel:${contactDetails.phone}`}
                  data-cursor="interactive"
                  className="mt-2 inline-block text-base text-white"
                >
                  {contactDetails.phone}
                </a>
              </div>
            </div>
          </div>

          <div className="surface-panel p-8 sm:p-10" data-stagger="0.1">
            <form className="space-y-5">
              <div data-reveal className="grid gap-5 md:grid-cols-2">
                <label className="block" data-cursor="interactive">
                  <span className="mb-2 block text-sm text-zinc-400">Name</span>
                  <input type="text" name="name" placeholder="Your name" className="input-shell" />
                </label>
                <label className="block" data-cursor="interactive">
                  <span className="mb-2 block text-sm text-zinc-400">Email</span>
                  <input type="email" name="email" placeholder="you@company.com" className="input-shell" />
                </label>
              </div>

              <label data-reveal className="block" data-cursor="interactive">
                <span className="mb-2 block text-sm text-zinc-400">Company</span>
                <input type="text" name="company" placeholder="Company or brand" className="input-shell" />
              </label>

              <label data-reveal className="block" data-cursor="interactive">
                <span className="mb-2 block text-sm text-zinc-400">Project Type</span>
                <select name="projectType" className="input-shell appearance-none">
                  <option>Website</option>
                  <option>App</option>
                  <option>Creative Systems</option>
                  <option>Automation</option>
                  <option>Marketing Systems</option>
                  <option>AI Academy</option>
                </select>
              </label>

              <label data-reveal className="block" data-cursor="interactive">
                <span className="mb-2 block text-sm text-zinc-400">Project Goal</span>
                <textarea
                  name="goal"
                  rows="6"
                  placeholder="Tell us what you want to build, improve, or automate."
                  className="input-shell resize-none"
                />
              </label>

              <div
                data-reveal
                className="flex flex-col gap-4 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <p className="text-sm text-zinc-500">Form UI only for now. Backend can be added later.</p>
                <MagneticButton type="button">
                  Send Inquiry
                </MagneticButton>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}
