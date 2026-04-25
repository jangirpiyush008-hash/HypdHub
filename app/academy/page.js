import AnimatedSection from "@/components/AnimatedSection";
import MagneticButton from "@/components/MagneticButton";
import SplitTextReveal from "@/components/SplitTextReveal";
import TiltCard from "@/components/TiltCard";
import { academyCourses } from "@/data/site-content";

export const metadata = {
  title: "Academy",
  description: "Explore NUVEXA Academy programs designed to help teams use AI with real systems."
};

export default function AcademyPage() {
  return (
    <AnimatedSection className="section-space relative">
      <div className="container-shell relative" data-parallax-parent>
        <div
          data-parallax
          data-speed="0.16"
          aria-hidden="true"
          className="motion-orb absolute right-[-2%] top-6 h-56 w-56 rounded-full bg-white/8 blur-[130px]"
        />
        <div className="max-w-3xl">
          <span data-reveal className="eyebrow">AI Academy</span>
          <SplitTextReveal
            as="h1"
            text="Practical AI learning for teams that want systems, not just prompts."
            className="mt-6 text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl"
            mode="hero"
            stagger={0.06}
          />
          <p data-reveal data-delay="0.2" className="mt-6 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
            The academy is designed as a premium learning layer inside NUVEXA. Courses are focused
            on execution, workflows, and real adoption across teams.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3" data-stagger="0.12">
          {academyCourses.map((course) => (
            <TiltCard key={course.title} data-reveal className="surface-panel card-hover p-8" strength={7}>
              <p className="text-sm uppercase tracking-[0.28em] text-zinc-500">{course.level}</p>
              <h2 className="mt-5 text-2xl font-semibold text-white">{course.title}</h2>
              <p className="mt-4 text-sm leading-7 text-zinc-400">{course.description}</p>
              <div className="mt-6 flex items-center justify-between text-sm text-zinc-500">
                <span>{course.duration}</span>
                <span>{course.format}</span>
              </div>
            </TiltCard>
          ))}
        </div>

        <div data-reveal className="mt-12">
          <MagneticButton href="/contact">Ask About Academy Access</MagneticButton>
        </div>
      </div>
    </AnimatedSection>
  );
}
