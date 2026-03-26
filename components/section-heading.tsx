export function SectionHeading({
  eyebrow,
  title,
  description
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="max-w-2xl space-y-3">
      {eyebrow ? (
        <p className="font-headline text-xs font-bold uppercase tracking-[0.32em] text-primary">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="font-headline text-3xl font-extrabold tracking-[-0.04em] text-text sm:text-4xl md:text-5xl">
        {title}
      </h2>
      {description ? <p className="text-base leading-7 text-muted">{description}</p> : null}
    </div>
  );
}
