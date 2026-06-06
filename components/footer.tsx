import Link from "next/link";
import { Linkedin } from "lucide-react";
import { BacumenWordmark } from "@/components/bacumen-wordmark";

/**
 * Footer — template 4-col layout with Bacumen content.
 *
 * Captured shape (template footer):
 *   - 4 link columns
 *   - sr-only h2
 *   - Subscribe inline in link list (not a CTA pill)
 *   - subtle ink/15 dividers
 *   - light surface (cool off-white) for footer
 *
 * Bacumen-specific kept:
 *   - 4 column groupings (Platform / Skills / Company / Resources)
 *   - "Backed by Google + Microsoft" lockup as a separate inline strip
 *   - © 2026 Bacumen.ai · SOC 2 Type II in progress · Audit-logged · Policy-versioned
 *   - LinkedIn social icon
 *
 * Dropped: jewel-toned premium bloom gradient, large-wordmark hero block.
 */

const columns = [
  {
    title: "Platform",
    links: [
      { label: "Runtime", href: "/platform" },
      { label: "Integrations", href: "/integrations" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    title: "Skills",
    links: [
      { label: "KYC", href: "/skills/kyc" },
      { label: "Finance", href: "/skills/finance" },
      { label: "HR", href: "/skills/hr" },
      { label: "ERP", href: "/skills/erp" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Customers", href: "/customers" },
      { label: "About", href: "/about" },
      { label: "Careers", href: "/about#careers" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Request a demo", href: "/demo" },
      { label: "Contact sales", href: "mailto:hello@bacumen.ai" },
      { label: "Security", href: "/platform#trust" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="w-full bg-surface-cool text-ink pt-20 pb-10">
      <h2 className="absolute h-px w-px overflow-hidden border-0 p-0 [clip:rect(0,0,0,0)] [clip-path:inset(50%)]">
        Site footer
      </h2>

      <div className="mx-auto w-full max-w-[1280px] px-6 lg:px-10">
        {/* Brand mark + 4 columns */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8 pb-12 border-b border-ink/15">
          <div className="lg:col-span-4">
            <Link href="/" aria-label="Bacumen home" className="inline-flex">
              <BacumenWordmark
                tone="ink"
                className="h-[clamp(2rem,4vw,2.5rem)] w-auto"
              />
            </Link>
            <p className="mt-6 max-w-[40ch] font-sans text-[15px] leading-[24px] text-mute">
              The runtime every Skill runs on — plus the library of Skills your
              stack can activate today.
            </p>
          </div>

          <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-8">
            {columns.map((col) => (
              <div key={col.title}>
                <h3 className="font-sans text-[12px] font-semibold uppercase tracking-[2px] text-ink">
                  {col.title}
                </h3>
                <ul className="mt-5 space-y-3">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="font-sans text-[15px] text-mute no-underline transition-opacity duration-300 ease hover:opacity-70 hover:text-ink"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Backed-by lockup — preserved as separate inline strip */}
        <div className="py-8 border-b border-ink/15">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
            <span className="font-sans text-[13px] text-mute italic">
              Backed by
            </span>
            <GoogleLogo />
            <span aria-hidden className="hidden sm:block h-4 w-px bg-ink/15" />
            <MicrosoftLogo />
          </div>
        </div>

        {/* Meta row — copyright + trust signals + social */}
        <div className="pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-x-6 gap-y-1 font-sans text-[13px] text-mute">
            <span>© 2026 Bacumen.ai, Inc.</span>
            <span className="hidden sm:inline text-ink/20">·</span>
            <span>SOC 2 Type II in progress</span>
            <span className="hidden sm:inline text-ink/20">·</span>
            <span>Audit-logged</span>
            <span className="hidden sm:inline text-ink/20">·</span>
            <span>Policy-versioned</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://www.linkedin.com/company/bacumen-ai"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="h-8 w-8 rounded-full border border-ink/15 grid place-items-center text-mute hover:border-ink hover:text-ink transition-colors duration-300 ease"
            >
              <Linkedin className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function GoogleLogo({ className }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-2 text-ink ${className ?? ""}`}
      aria-label="Google"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M21.6 12.23c0-.7-.06-1.36-.18-2H12v3.78h5.42a4.64 4.64 0 0 1-2.01 3.04v2.52h3.25c1.9-1.75 3-4.33 3-7.34z"
          fill="#4285F4"
        />
        <path
          d="M12 22c2.7 0 4.97-.9 6.62-2.43l-3.25-2.52c-.9.6-2.05.96-3.37.96-2.6 0-4.8-1.75-5.58-4.1H3.06v2.58A10 10 0 0 0 12 22z"
          fill="#34A853"
        />
        <path
          d="M6.42 13.91A6 6 0 0 1 6.1 12c0-.66.12-1.3.32-1.9V7.52H3.06A10 10 0 0 0 2 12c0 1.61.38 3.14 1.06 4.48l3.36-2.57z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.88c1.47 0 2.78.51 3.82 1.5l2.87-2.87C16.95 2.92 14.68 2 12 2 8.1 2 4.73 4.22 3.06 7.52l3.36 2.58C7.2 7.63 9.4 5.88 12 5.88z"
          fill="#EA4335"
        />
      </svg>
      <span className="font-sans text-[15px] font-medium tracking-[-0.01em]">
        Google
      </span>
    </span>
  );
}

function MicrosoftLogo({ className }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-2 text-ink ${className ?? ""}`}
      aria-label="Microsoft"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-[18px] w-[18px]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="1" y="1" width="10" height="10" fill="#F25022" />
        <rect x="13" y="1" width="10" height="10" fill="#7FBA00" />
        <rect x="1" y="13" width="10" height="10" fill="#00A4EF" />
        <rect x="13" y="13" width="10" height="10" fill="#FFB900" />
      </svg>
      <span className="font-sans text-[15px] font-medium tracking-[-0.01em]">
        Microsoft
      </span>
    </span>
  );
}
