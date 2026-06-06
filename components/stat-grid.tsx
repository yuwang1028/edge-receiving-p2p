import { BigNumber } from "@/components/big-number";

type Stat = {
  value: string;
  label: string;
  note?: string;
};

/**
 * The "numbers" section. Editorial: each stat has its own cell with an
 * optional footnote. Top-tier enterprise sites cite sources — we do too,
 * even if the source is "pilot deployments, Q1 2026."
 */
export function StatGrid({
  items,
  eyebrow = "NUMBERS",
  title,
  footnote,
}: {
  items: Stat[];
  eyebrow?: string;
  title?: React.ReactNode;
  footnote?: string;
}) {
  return (
    <section className="section-light py-24 lg:py-28">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
        <div className="flex items-end justify-between gap-10 mb-14" data-reveal="up">
          <div>
            <div className="text-mono text-muted mb-3">{eyebrow}</div>
            {title && (
              <h2 className="text-display-m lg:text-display-l text-ink leading-[1.02] tracking-[-0.02em] max-w-[18ch]">
                {title}
              </h2>
            )}
          </div>
          {footnote && (
            <p className="text-body-s text-muted max-w-[28ch] hidden md:block">
              {footnote}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-divider rounded-2xl overflow-hidden border border-divider">
          {items.map((s, i) => (
            <div
              key={i}
              className="bg-white p-8 lg:p-10 flex flex-col gap-4 min-w-0 overflow-hidden"
              data-reveal="up"
              style={{ ["--reveal-delay" as string]: `${i * 80}ms` }}
            >
              <BigNumber value={s.value} label={s.label} />
              {s.note && (
                <div className="text-mono text-muted mt-auto pt-4 border-t border-divider">
                  {s.note}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
