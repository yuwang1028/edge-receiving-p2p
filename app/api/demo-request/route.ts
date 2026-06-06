import { NextResponse } from "next/server";
import { Resend } from "resend";
import { demoSchema, type DemoFormValues } from "@/lib/demo-schema";

export const runtime = "nodejs";

const SKILL_LABELS: Record<string, string> = {
  kyc: "KYC",
  finance: "Finance",
  hr: "HR",
  erp: "ERP",
  other: "Other",
};

const SITE_URL = "https://www.bacumen.ai";
const CONFETTI_URL = `${SITE_URL}/email/confetti.gif`;
const REPLY_TO = "kylelu@bacumen.ai";

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function firstName(full: string) {
  return full.trim().split(/\s+/)[0] ?? full;
}

function buildUserConfirmationEmail(data: DemoFormValues, skillsLabeled: string) {
  const fname = escapeHtml(firstName(data.name));
  const skillsLine = escapeHtml(skillsLabeled);

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>You're in.</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Helvetica,Arial,sans-serif;color:#0f1115;-webkit-font-smoothing:antialiased">
  <span style="display:none!important;visibility:hidden;mso-hide:all;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">You're in, ${fname}. Your Bacumen working session is locked in — we'll reach out within 1 business day.</span>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 2px rgba(15,17,21,0.04),0 8px 24px rgba(15,17,21,0.06)">

        <!-- HERO -->
        <tr>
          <td align="center" style="background:linear-gradient(135deg,#0f1115 0%,#1f2436 60%,#3a3168 100%);padding:48px 32px 40px 32px;text-align:center">
            <img src="${CONFETTI_URL}" width="160" height="160" alt="🎉" style="display:block;margin:0 auto 8px auto;border:0;outline:none;text-decoration:none;max-width:160px;height:auto">
            <div style="font-size:13px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.55);margin-bottom:14px;font-weight:600">You're in</div>
            <div style="font-size:34px;line-height:1.1;color:#ffffff;font-weight:700;letter-spacing:-0.5px">Welcome aboard, ${fname}.</div>
            <div style="font-size:16px;line-height:1.5;color:rgba(255,255,255,0.78);margin-top:14px;max-width:420px;margin-left:auto;margin-right:auto">Your working session is locked in. No queue, no slideware — just real cases.</div>
          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td style="padding:40px 40px 8px 40px;font-size:16px;line-height:1.6;color:#0f1115">
            <p style="margin:0 0 20px 0">Real talk: most demo requests sit in someone's queue for two weeks. Yours doesn't.</p>
            <p style="margin:0 0 8px 0;font-weight:600;color:#0f1115">Here's what happens next:</p>
          </td>
        </tr>

        <!-- TIMELINE -->
        <tr>
          <td style="padding:0 40px 8px 40px">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td width="36" valign="top" style="padding:8px 0">
                  <div style="width:28px;height:28px;border-radius:14px;background:#0f1115;color:#fff;font-weight:700;font-size:13px;line-height:28px;text-align:center">1</div>
                </td>
                <td valign="top" style="padding:8px 0 8px 12px;font-size:15px;line-height:1.55;color:#0f1115">
                  <b>Within 1 business day</b> — Kyle or Jerry from our team emails you to lock in a 20-minute slot.
                </td>
              </tr>
              <tr>
                <td width="36" valign="top" style="padding:8px 0">
                  <div style="width:28px;height:28px;border-radius:14px;background:#0f1115;color:#fff;font-weight:700;font-size:13px;line-height:28px;text-align:center">2</div>
                </td>
                <td valign="top" style="padding:8px 0 8px 12px;font-size:15px;line-height:1.55;color:#0f1115">
                  <b>The session</b> — we run ${skillsLine} live against <i>your</i> data. No fake data, no sales pitch.
                </td>
              </tr>
              <tr>
                <td width="36" valign="top" style="padding:8px 0">
                  <div style="width:28px;height:28px;border-radius:14px;background:#0f1115;color:#fff;font-weight:700;font-size:13px;line-height:28px;text-align:center">3</div>
                </td>
                <td valign="top" style="padding:8px 0 8px 12px;font-size:15px;line-height:1.55;color:#0f1115">
                  <b>You decide</b> — if it's not a fit, no follow-up. If it is, we scope a working pilot in days, not quarters.
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- CTA / REPLY -->
        <tr>
          <td style="padding:24px 40px 8px 40px;font-size:16px;line-height:1.6;color:#0f1115">
            <p style="margin:0 0 24px 0">Got something specific you want us to prep for the session? <b>Just reply to this email</b> — it goes straight to Kyle.</p>
          </td>
        </tr>

        <!-- DIVIDER -->
        <tr><td style="padding:0 40px"><div style="height:1px;background:#e9e7e0;line-height:1px;font-size:1px">&nbsp;</div></td></tr>

        <!-- SIGN-OFF -->
        <tr>
          <td style="padding:24px 40px 32px 40px;font-size:15px;line-height:1.6;color:#0f1115">
            <div style="font-weight:600">— The Bacumen team</div>
            <div style="color:#6a6e7a;margin-top:4px">Priced like a platform. Built like an operator.</div>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background:#f1f5f9;padding:20px 40px;text-align:center;font-size:12px;line-height:1.5;color:#8a8e98">
            Bacumen · <a href="mailto:demo@bacumen.ai" style="color:#8a8e98;text-decoration:underline">demo@bacumen.ai</a> · <a href="${SITE_URL}" style="color:#8a8e98;text-decoration:underline">bacumen.ai</a>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = [
    `You're in, ${firstName(data.name)}.`,
    ``,
    `Welcome aboard. Your Bacumen working session is locked in.`,
    ``,
    `Here's what happens next:`,
    `  1. Within 1 business day — Kyle or Jerry from our team emails you to lock in a 20-minute slot.`,
    `  2. The session — we run ${skillsLabeled} live against YOUR data. No fake data, no sales pitch.`,
    `  3. You decide — if it's not a fit, no follow-up. If it is, we scope a working pilot in days, not quarters.`,
    ``,
    `Got something specific you want us to prep? Just reply to this email — it goes straight to Kyle.`,
    ``,
    `— The Bacumen team`,
    `Priced like a platform. Built like an operator.`,
    ``,
    `Bacumen · demo@bacumen.ai · ${SITE_URL}`,
  ].join("\n");

  return {
    subject: `You're in, ${firstName(data.name)} — your Bacumen session is locked in 🎉`,
    html,
    text,
  };
}

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  const payloadWithSource = json as Record<string, unknown>;
  const result = demoSchema.safeParse(payloadWithSource);
  if (!result.success) {
    return NextResponse.json(
      { ok: false, error: "validation", issues: result.error.issues },
      { status: 400 }
    );
  }

  const source =
    typeof payloadWithSource.source === "string"
      ? payloadWithSource.source
      : "unknown";

  const data = result.data;
  const receivedAt = new Date().toISOString();
  const skillsLabeled = data.skills.map((s) => SKILL_LABELS[s] ?? s).join(", ");
  const roleLabeled =
    data.role === "Other" && data.roleOther?.trim()
      ? `Other — ${data.roleOther.trim()}`
      : data.role;

  // eslint-disable-next-line no-console
  console.log("[demo-request]", JSON.stringify({ ...data, source, receivedAt }));

  const apiKey = process.env.RESEND_API_KEY;
  // DEMO_TO_EMAIL accepts a single address or a comma-separated list.
  const toEmail = (process.env.DEMO_TO_EMAIL || "kylelu@bacumen.ai")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const fromEmail =
    process.env.DEMO_FROM_EMAIL || "Bacumen Demo <onboarding@resend.dev>";

  if (apiKey) {
    try {
      const resend = new Resend(apiKey);
      const subject = `New demo request — ${data.company} (${data.name})`;
      const html = `
        <div style="font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;max-width:560px;color:#111">
          <h2 style="margin:0 0 12px 0;font-size:18px">New demo request</h2>
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <tr><td style="padding:6px 8px;color:#666">Name</td><td style="padding:6px 8px">${escapeHtml(data.name)}</td></tr>
            <tr><td style="padding:6px 8px;color:#666">Email</td><td style="padding:6px 8px"><a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></td></tr>
            <tr><td style="padding:6px 8px;color:#666">Company</td><td style="padding:6px 8px">${escapeHtml(data.company)}</td></tr>
            <tr><td style="padding:6px 8px;color:#666">Role</td><td style="padding:6px 8px">${escapeHtml(roleLabeled)}</td></tr>
            <tr><td style="padding:6px 8px;color:#666">Size</td><td style="padding:6px 8px">${escapeHtml(data.companySize)}</td></tr>
            <tr><td style="padding:6px 8px;color:#666">Skills</td><td style="padding:6px 8px">${escapeHtml(skillsLabeled)}</td></tr>
            ${data.notes ? `<tr><td style="padding:6px 8px;color:#666;vertical-align:top">Notes</td><td style="padding:6px 8px;white-space:pre-wrap">${escapeHtml(data.notes)}</td></tr>` : ""}
            <tr><td style="padding:6px 8px;color:#666">Source</td><td style="padding:6px 8px">${escapeHtml(source)}</td></tr>
            <tr><td style="padding:6px 8px;color:#666">Received</td><td style="padding:6px 8px">${escapeHtml(receivedAt)}</td></tr>
          </table>
          <p style="margin-top:16px;font-size:12px;color:#888">Reply directly to this email to respond to ${escapeHtml(data.name)}.</p>
        </div>`;

      const text = [
        `New demo request`,
        ``,
        `Name:    ${data.name}`,
        `Email:   ${data.email}`,
        `Company: ${data.company}`,
        `Role:    ${roleLabeled}`,
        `Size:    ${data.companySize}`,
        `Skills:  ${skillsLabeled}`,
        data.notes ? `Notes:   ${data.notes}` : "",
        `Source:  ${source}`,
        `Received:${receivedAt}`,
      ]
        .filter(Boolean)
        .join("\n");

      const { error } = await resend.emails.send({
        from: fromEmail,
        to: toEmail,
        replyTo: data.email,
        subject,
        html,
        text,
      });
      if (error) {
        // eslint-disable-next-line no-console
        console.error("[demo-request] resend error (team)", error);
      }

      // User confirmation email (auto-reply to the lead).
      try {
        const userMail = buildUserConfirmationEmail(data, skillsLabeled);
        const { error: userErr } = await resend.emails.send({
          from: fromEmail,
          to: data.email,
          replyTo: REPLY_TO,
          subject: userMail.subject,
          html: userMail.html,
          text: userMail.text,
        });
        if (userErr) {
          // eslint-disable-next-line no-console
          console.error("[demo-request] resend error (user confirmation)", userErr);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("[demo-request] user confirmation exception", err);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[demo-request] resend exception", err);
    }
  } else {
    // eslint-disable-next-line no-console
    console.warn("[demo-request] RESEND_API_KEY not set — email not sent");
  }

  // Optional secondary webhook (Slack / HubSpot)
  const webhook = process.env.DEMO_WEBHOOK_URL;
  if (webhook) {
    try {
      await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, source, receivedAt }),
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[demo-request] webhook failed", err);
    }
  }

  return NextResponse.json({ ok: true });
}
