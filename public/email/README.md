# Email assets

Files here are referenced from transactional emails (e.g. `app/api/demo-request/route.ts`).

## confetti.gif

Used as the hero image at the top of the demo-request user confirmation email.

- **Path referenced**: `https://www.bacumen.ai/email/confetti.gif`
- **Recommended specs**: square, ~320×320px source, < 500KB
- **Fallback**: if the file is missing, email clients render the `alt="🎉"` emoji instead — the email still looks fine, just static.

To swap, drop a new `confetti.gif` here and redeploy. No code change needed.
