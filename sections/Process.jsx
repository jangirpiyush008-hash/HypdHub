import AnimatedSection from "@/components/AnimatedSection";
import SplitTextReveal from "@/components/SplitTextReveal";
import { processSteps } from "@/data/site-content";

export default function Process() {
  return (
    <AnimatedSection className="section-space border-t border-white/10">
      <div className="container-shell">
        <div className="max-w-2xl">
          <span data-reveal className="eyebrow">Process</span>
          <SplitTextReveal
            as="h2"
            text="A direct process designed for momentum, not meetings."
            className="mt-5 text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl"
          />
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-4" data-stagger="0.12">
          {processSteps.map((step) => (
            <article key={step.step} data-reveal className="surface-panel card-hover p-8">
              <p className="text-sm uppercase tracking-[0.28em] text-zinc-500">{step.step}</p>
              <h3 className="mt-6 text-2xl font-semibold text-white">{step.title}</h3>
              <p className="mt-4 text-sm leading-7 text-zinc-400">{step.description}</p>
            </article>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
}
