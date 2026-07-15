import * as React from "react";
import { Reply, ReplyAll, Forward, Trash2, Minus, Square, X, Send } from "lucide-react";
import { cn } from "@/lib/utils";

export const initialsOf = (s: string) =>
  s.replace(/[·.].*/, "").trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

/** Enterprise Outlook-style email window. Used for the free-text intake email,
 * the supplier PO draft (compose variant), and the supplier reply. `caret` shows
 * a typing caret at the end of the body while an AI draft streams in. */
export function EmailMessage({
  subject, fromName, fromAddress, to = "Procurement intake", sentAt, body,
  variant = "inbox", caret = false, footer,
}: {
  subject: string;
  fromName: string;
  fromAddress: string;
  to?: string;
  sentAt?: string;
  body: string;
  variant?: "inbox" | "draft";
  caret?: boolean;
  footer?: React.ReactNode;
}) {
  const paras = body.split("\n\n");
  return (
    <div className="rounded-md border border-divider overflow-hidden shadow-sm bg-white">
      {/* title bar */}
      <div className="flex items-center gap-2 bg-surface-fog px-3 py-1.5 border-b border-divider text-[12px]">
        <span className="w-4 h-4 rounded-sm bg-[#0a66c2] text-white text-[9px] font-bold flex items-center justify-center">O</span>
        <span className="text-ink truncate">{subject} — Message (HTML)</span>
        <span className="ml-auto flex items-center gap-2 text-mute"><Minus size={12} /><Square size={10} /><X size={12} /></span>
      </div>
      {/* toolbar */}
      <div className="flex items-center gap-4 px-3 py-2 border-b border-divider text-[10.5px] text-[#0a66c2]">
        {variant === "inbox" ? (
          <>
            <span className="inline-flex flex-col items-center gap-0.5"><Reply size={15} />Reply</span>
            <span className="inline-flex flex-col items-center gap-0.5"><ReplyAll size={15} />Reply All</span>
            <span className="inline-flex flex-col items-center gap-0.5"><Forward size={15} />Forward</span>
            <span className="inline-flex flex-col items-center gap-0.5 text-mark-red ml-2"><Trash2 size={15} />Delete</span>
          </>
        ) : (
          <span className="inline-flex flex-col items-center gap-0.5"><Send size={15} />Send</span>
        )}
      </div>
      {/* header */}
      <div className="px-4 py-3 border-b border-divider">
        <div className="text-[15px] font-bold text-ink mb-2">{subject}</div>
        <div className="flex items-start gap-3">
          <span className="w-9 h-9 rounded-full bg-surface-deep text-ink-inverse text-[11px] font-bold flex items-center justify-center shrink-0">{initialsOf(fromName)}</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-ink text-[13px] truncate">{fromName}</span>
              {sentAt && <span className="ml-auto text-[11px] text-mute whitespace-nowrap">{sentAt}</span>}
            </div>
            <div className="text-[11.5px] text-mute">{fromAddress}</div>
            <div className="text-[11.5px] text-mute mt-0.5">To: {to}</div>
          </div>
        </div>
      </div>
      {/* body */}
      <div className="px-4 py-3 space-y-3 text-[12.5px] text-ink leading-relaxed">
        {paras.map((p, i) => (
          <p key={i} className={cn("whitespace-pre-wrap", i === paras.length - 1 && caret && "after:content-['▍'] after:ml-0.5 after:text-surface-deep after:animate-pulse")}>{p}</p>
        ))}
      </div>
      {footer && <div className="px-4 pb-3">{footer}</div>}
    </div>
  );
}
