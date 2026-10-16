import type { Metadata } from "next";
import Link from "next/link";
import { Shield } from "lucide-react";
import {
  OPERATOR_NAME,
  OPERATOR_URL,
  PLATFORM_NAME,
  PRIVACY_CONTACT_EMAIL,
  PRIVACY_EFFECTIVE_DATE,
  PRIVACY_LAST_UPDATED,
  PRIVACY_SECTIONS,
} from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy & Policy",
  description: `How ${PLATFORM_NAME} collects, stores, uses, and protects account and ID card data, including optional Google Drive photo storage, account deletion, and security practices.`,
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <header className="space-y-4 text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Shield className="h-3.5 w-3.5" aria-hidden />
          Privacy &amp; Policy
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Privacy &amp; Policy
        </h1>
        <p className="text-sm text-muted">
          {PLATFORM_NAME} · Effective {PRIVACY_EFFECTIVE_DATE} · Last updated {PRIVACY_LAST_UPDATED}
        </p>
      </header>

      <nav
        aria-label="Policy sections"
        className="mt-8 overflow-x-auto rounded-2xl border border-card-border bg-card-bg/40 p-4"
      >
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted">On this page</p>
        <ul className="flex flex-wrap gap-2 text-xs sm:text-sm">
          {PRIVACY_SECTIONS.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className="inline-flex rounded-full border border-card-border bg-background px-3 py-1.5 font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                {section.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <article className="mt-8 space-y-8 rounded-2xl border border-card-border bg-card-bg/30 p-6 text-sm leading-relaxed text-muted sm:p-10">
        {PRIVACY_SECTIONS.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-28 space-y-3">
            <h2 className="text-lg font-bold text-foreground">{section.title}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 48)}>{paragraph}</p>
            ))}
            {section.bullets && section.bullets.length > 0 ? (
              <ul className="list-disc space-y-2 pl-5">
                {section.bullets.map((item) => (
                  <li key={item.slice(0, 48)}>{item}</li>
                ))}
              </ul>
            ) : null}
            {section.id === "data-security" ? (
              <blockquote className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-foreground">
                <p>
                  <strong>{OPERATOR_NAME}</strong> (
                  <a
                    href={OPERATOR_URL}
                    className="font-semibold text-primary underline-offset-2 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    www.cubixmet.com
                  </a>
                  ) certifies that this application follows industry-recommended security practices
                  and uses appropriate security measures designed to protect user data and ensure
                  data safety.
                </p>
                <p className="mt-2 text-xs text-muted">
                  This is {OPERATOR_NAME}&apos;s statement of how the application is built and
                  operated. It is not an independent audit, ISO, SOC, or other legally recognised
                  certification.
                </p>
              </blockquote>
            ) : null}
          </section>
        ))}

        <p className="border-t border-card-border pt-6 text-xs">
          Questions:{" "}
          <a className="font-medium text-primary hover:underline" href={`mailto:${PRIVACY_CONTACT_EMAIL}`}>
            {PRIVACY_CONTACT_EMAIL}
          </a>
          . Related:{" "}
          <Link href="/terms" className="font-medium text-primary hover:underline">
            Terms of Service
          </Link>
          .
        </p>
      </article>
    </div>
  );
}
