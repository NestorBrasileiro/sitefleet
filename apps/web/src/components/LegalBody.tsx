type Page = { title: string; blocks: { h?: string; p: string[] }[] };

export function LegalBody({ page }: { page: Page }) {
  return (
    <div className="prose prose-lg mx-auto max-w-3xl dark:prose-invert prose-a:text-[var(--accent)]">
      <h1>{page.title}</h1>
      {page.blocks.map((b, i) => (
        <section key={b.h ?? i}>
          {b.h && <h2>{b.h}</h2>}
          {b.p.map((text) => (
            <p key={text}>{text}</p>
          ))}
        </section>
      ))}
    </div>
  );
}
