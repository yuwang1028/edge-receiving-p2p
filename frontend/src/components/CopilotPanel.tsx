import * as React from "react";
import { cn } from "@/lib/utils";
import { edgeApi } from "@/lib/edgeApi";
import { AIDot } from "@/components/ai/AIDot";
import { Spinner } from "@/components/ai/Spinner";
import { PillButton } from "@/components/blocks/PillButton";

/* Shared per-console copilot — agent loop + tools on the backend; this is just the
 * thread UI. Reused across consoles by passing a different `agent` persona +
 * `chips`. `onRelease` is called when the user confirms a proposed payment release. */

type ChatMsg = { role: "user" | "assistant"; content: string };

export function CopilotPanel({
  caseId,
  agent = "receiving",
  chips = [],
  onRelease,
}: {
  caseId: string;
  agent?: string;
  chips?: string[];
  onRelease?: () => void | Promise<void>;
}) {
  const [msgs, setMsgs] = React.useState<ChatMsg[]>([]);
  const [input, setInput] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [proposed, setProposed] = React.useState<{ action: string; label: string } | null>(null);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    const next: ChatMsg[] = [...msgs, { role: "user", content: q }];
    setMsgs(next);
    setInput("");
    setBusy(true);
    setProposed(null);
    try {
      const r = await edgeApi.chat(caseId, next, agent);
      setMsgs([...next, { role: "assistant", content: r.reply }]);
      setProposed(r.proposedAction);
    } catch (e) {
      setMsgs([...next, { role: "assistant", content: "Copilot unavailable: " + String(e) }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="bg-white border border-divider rounded-md p-5 space-y-3">
      <header className="flex items-center gap-2">
        <AIDot size={6} tone="deep" pulse />
        <span className="text-[11px] tracking-[0.08em] uppercase text-surface-deep font-medium">
          {agent === "invoice" ? "Invoice copilot" : "Receiving copilot"}
        </span>
        <span className="ml-auto text-[11px] text-mute">grounded · agent loop</span>
      </header>

      {msgs.length === 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {chips.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => void send(c)}
              className="ui-pill text-[11.5px] rounded-full border border-divider bg-white px-2.5 py-1 hover:bg-surface-fog"
            >
              {c}
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {msgs.map((m, i) => (
            <div
              key={i}
              className={cn(
                "text-[12.5px] leading-snug rounded-md px-3 py-2",
                m.role === "user" ? "bg-surface-deep text-ink-inverse ml-10" : "bg-surface-fog text-ink mr-10",
              )}
            >
              {m.content}
            </div>
          ))}
          {busy && (
            <div className="text-[12px] text-mute flex items-center gap-1.5">
              <Spinner size={13} /> thinking…
            </div>
          )}
        </div>
      )}

      {proposed && onRelease && (
        <div className="flex items-center gap-2 rounded-md bg-surface-mint/40 border border-surface-deep/20 px-3 py-2">
          <span className="text-[12px] text-ink flex-1">
            Copilot proposes: <span className="font-bold">{proposed.label}</span>
          </span>
          <PillButton
            variant="deep"
            size="sm"
            onClick={async () => {
              await onRelease();
              setProposed(null);
              setMsgs((m) => [...m, { role: "assistant", content: "✓ Payment released per the match." }]);
            }}
          >
            Confirm
          </PillButton>
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void send(input);
          }}
          placeholder="Ask about this case…"
          className="flex-1 text-[12.5px] rounded-md border border-divider px-3 py-2 outline-none focus:border-surface-deep"
        />
        <PillButton variant="deep" size="sm" onClick={() => void send(input)} disabled={busy}>
          Send
        </PillButton>
      </div>
    </article>
  );
}
