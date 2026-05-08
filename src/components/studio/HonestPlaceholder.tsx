export function HonestPlaceholder({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="mx-auto max-w-3xl px-8 py-14">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-warning">
        Honest placeholder
      </p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-4 text-sm leading-relaxed text-ink-muted">{body}</p>
    </div>
  );
}
