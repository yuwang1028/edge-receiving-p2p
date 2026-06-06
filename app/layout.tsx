import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { DemoModalProvider } from "@/components/demo-modal-provider";
import { Toaster } from "@/components/ui/toaster";
import { SkipLink } from "@/components/skip-link";
import { ScrollReveal } from "@/components/scroll-reveal";

/*
 * Font stack — template-styled.
 * Captured from the template source (h1.fontFamily + body.fontFamily):
 *   - Display tier:  Space Grotesk → Space Grotesk → Inter → system  (we ship Space Grotesk)
 *   - Body / CTA:    Inter Body → Inter → Arial → system  (we ship Inter)
 *   - Mono:          (kept JetBrains Mono — Bacumen LiveArtifactPanel
 *                     depends on monospace identity; the template source loads
 *                     JetBrains Mono internally)
 */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["500"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bacumen.ai";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Bacumen.ai — The agentic AI platform for enterprise",
    template: "%s · Bacumen.ai",
  },
  description:
    "Activate AI across your enterprise, one skill at a time. A runtime plus a growing library of skills — KYC, Finance, HR, ERP — that plug into the ~20 SaaS tools your teams already use.",
  openGraph: {
    type: "website",
    siteName: "Bacumen.ai",
    url: siteUrl,
    title: "Bacumen.ai — The agentic AI platform for enterprise",
    description:
      "Runtime plus skills — KYC, Finance, HR, ERP — on the tools your teams already use.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bacumen.ai — The agentic AI platform for enterprise",
    description:
      "Runtime plus skills — KYC, Finance, HR, ERP — on the tools your teams already use.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} antialiased`}
    >
      {/* Plausible placeholder — uncomment and set data-domain to enable. */}
      {/* <script defer data-domain="bacumen.ai" src="https://plausible.io/js/script.js" /> */}
      <body className="min-h-full flex flex-col bg-white text-ink">
        <Toaster>
          <DemoModalProvider>
            <SkipLink />
            <Navigation />
            <main id="main" className="flex-1">
              {children}
            </main>
            <Footer />
            <ScrollReveal />
          </DemoModalProvider>
        </Toaster>
        <Analytics />
      </body>
    </html>
  );
}
