/** A page "screen" of the game: world/stage tag, pixel heading and content. */
export function Screen({
  id,
  stage,
  title,
  intro,
  tone = "night",
  children,
}: {
  id: string;
  stage: string;
  title: string;
  intro?: React.ReactNode;
  tone?: "night" | "ink" | "paper" | "sky";
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-t`} className={`lq-screen lq-screen--${tone}`}>
      <div className="lq-screen__inner">
        <header className="lq-screen__head">
          <p className="lq-screen__stage">
            <span className="lq-screen__stage-k">Mundo</span> {stage}
          </p>
          <h2 id={`${id}-t`} className="lq-screen__title" tabIndex={-1} data-lq-focus>
            {title}
          </h2>
          {intro && <p className="lq-screen__intro">{intro}</p>}
        </header>
        {children}
      </div>
    </section>
  );
}
