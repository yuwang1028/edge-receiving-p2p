import * as React from "react";

/** Typewriter — reveals text progressively so AI-authored copy streams in
 * (agent summaries, drafted emails, recommendations). Reveals 2 chars per tick. */
export function useTypewriter(text: string, speed = 16): { shown: string; done: boolean } {
  const [n, setN] = React.useState(0);
  React.useEffect(() => {
    setN(0);
    if (!text) return;
    const t = setInterval(() => setN((c) => (c >= text.length ? (clearInterval(t), c) : c + 2)), speed);
    return () => clearInterval(t);
  }, [text, speed]);
  return { shown: text.slice(0, n), done: n >= text.length };
}
