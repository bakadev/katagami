import { ExplorationBar, useCreateDoc } from "../DesignIndex";

/**
 * Homepage option C — Enterprise buyer.
 *
 * Persona: an IT, ops or platform lead choosing one documentation tool for
 * many teams. They need to see, above the fold, who else uses it, how it's
 * secured, where it runs and what it costs. Centered layout, tight Geist
 * headings, one navy accent. Structure carries the page; there is no
 * decoration. Both paths (start free / request a demo) are always visible.
 */

const NAVY = "#1f3a8a";

const LOGOS = [
  "Northwind Health",
  "Meridian Bank",
  "Halcyon Energy",
  "Cobalt Logistics",
  "Verity Insurance",
  "Ardent Media",
];

export default function HomeEnterprise() {
  const { create, loading, error } = useCreateDoc();

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={{
        ["--navy" as string]: NAVY,
        ["--navy-soft" as string]: `color-mix(in oklch, ${NAVY} 8%, transparent)`,
      }}
    >
      <ExplorationBar round="home" current="enterprise" />

      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-base font-semibold tracking-tight">
            Katagami
          </span>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#security" className="hover:text-foreground">
              Security
            </a>
            <a href="#teams" className="hover:text-foreground">
              Teams
            </a>
            <a href="#deploy" className="hover:text-foreground">
              Deployment
            </a>
            <a href="#pricing" className="hover:text-foreground">
              Pricing
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <a
              href="#demo"
              className="hidden h-9 items-center rounded-md border border-border px-3 text-sm font-medium hover:bg-muted sm:inline-flex"
            >
              Request a demo
            </a>
            <button
              type="button"
              onClick={create}
              disabled={loading}
              className="h-9 rounded-md bg-[var(--navy)] px-3 text-sm font-medium text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
            >
              Start free
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-6 pb-16 pt-20 text-center">
          <h1 className="mx-auto max-w-[20ch] text-4xl font-semibold leading-[1.1] tracking-[-0.02em] sm:text-6xl">
            One place for every team's specs, runbooks and decisions
          </h1>
          <p className="mx-auto mt-6 max-w-[58ch] text-lg leading-relaxed text-muted-foreground">
            Real-time collaborative Markdown for product, engineering,
            operations and compliance. Single sign-on, audit history and
            self-hosting included, so it passes review the first time.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#demo"
              className="inline-flex h-11 items-center rounded-md bg-[var(--navy)] px-5 text-sm font-medium text-white hover:opacity-90"
            >
              Request a demo
            </a>
            <button
              type="button"
              onClick={create}
              disabled={loading}
              className="h-11 rounded-md border border-border px-5 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
            >
              {loading ? "Opening…" : "Try it now, no account"}
            </button>
          </div>
          {error && (
            <p role="alert" className="mt-3 text-sm text-destructive">
              Couldn't create the doc: {error}
            </p>
          )}

          {/* Logo strip */}
          <div className="mt-16">
            <p className="text-xs text-muted-foreground">
              Trusted by documentation-heavy organizations
            </p>
            <ul className="mt-5 grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3 md:grid-cols-6">
              {LOGOS.map((l) => (
                <li
                  key={l}
                  className="text-sm font-semibold tracking-tight text-muted-foreground/70"
                >
                  {l}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Stats */}
        <section className="border-y border-border bg-muted/30">
          <dl className="mx-auto grid max-w-6xl grid-cols-2 divide-border px-6 py-10 sm:grid-cols-4 sm:divide-x">
            <Stat value="99.95%" label="uptime, last 12 months" />
            <Stat value="< 80 ms" label="edit propagation, p95" />
            <Stat value="SOC 2" label="Type II report available" />
            <Stat value="EU / US" label="data residency options" />
          </dl>
        </section>

        {/* Security grid */}
        <section id="security" className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="max-w-[26ch] text-3xl font-semibold leading-tight tracking-[-0.02em] sm:text-4xl">
            Built to pass your security review
          </h2>
          <p className="mt-4 max-w-[60ch] text-muted-foreground">
            The controls your IT team asks for are part of the product, not
            an add-on tier.
          </p>
          <ul className="mt-10 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            <Control
              title="Single sign-on"
              body="SAML 2.0 and OIDC with Okta, Entra ID and Google Workspace. SCIM provisioning keeps access in step with HR."
            />
            <Control
              title="Role-based access"
              body="Workspace, project and document roles. View, comment and edit links can be rotated or revoked at any time."
            />
            <Control
              title="Audit history"
              body="Every edit is attributed and every version is retained. Export the log to your SIEM."
            />
            <Control
              title="Encryption"
              body="TLS in transit, AES-256 at rest, customer-managed keys on the self-hosted plan."
            />
            <Control
              title="Data retention"
              body="Configure snapshot retention per workspace. Legal hold freezes a document and its history."
            />
            <Control
              title="Compliance"
              body="SOC 2 Type II, GDPR data processing agreement, HIPAA BAA available on request."
            />
          </ul>
        </section>

        {/* Teams / use cases */}
        <section id="teams" className="border-t border-border bg-muted/30">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <h2 className="max-w-[26ch] text-3xl font-semibold leading-tight tracking-[-0.02em] sm:text-4xl">
              One tool, every department
            </h2>
            <div className="mt-10 grid gap-6 md:grid-cols-4">
              <Team
                name="Product"
                items={["PRDs and roadmaps", "Stakeholder sign-off", "Handoff to engineering"]}
              />
              <Team
                name="Engineering"
                items={["RFCs and ADRs", "Runbooks and post-mortems", "Specs for AI agents"]}
              />
              <Team
                name="Operations"
                items={["Standard procedures", "Vendor onboarding", "Change records"]}
              />
              <Team
                name="Compliance"
                items={["Policy drafting", "Evidence collection", "Versioned approvals"]}
              />
            </div>
          </div>
        </section>

        {/* Deployment */}
        <section id="deploy" className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="max-w-[26ch] text-3xl font-semibold leading-tight tracking-[-0.02em] sm:text-4xl">
            Run it where your data has to live
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <Deploy
              title="Cloud"
              body="Hosted by us in the EU or US region you choose. Managed upgrades, backups and monitoring."
              note="Fastest to start"
            />
            <Deploy
              title="Dedicated"
              body="A single-tenant instance on isolated infrastructure with a private network peering option."
              note="For regulated industries"
            />
            <Deploy
              title="Self-hosted"
              body="A single Node service and Postgres. Ships as a container image; runs on Kubernetes or a VM."
              note="Full data control"
            />
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="border-t border-border bg-muted/30">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <h2 className="text-center text-3xl font-semibold leading-tight tracking-[-0.02em] sm:text-4xl">
              Pricing
            </h2>
            <p className="mx-auto mt-3 max-w-[50ch] text-center text-muted-foreground">
              Per editor, per month. Viewers and commenters are free on every
              plan.
            </p>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              <Plan
                name="Team"
                price="$0"
                cadence="up to 10 editors"
                cta="Start free"
                onCta={create}
                items={[
                  "Unlimited documents",
                  "Real-time editing and comments",
                  "20 auto-snapshots per document",
                  "Markdown export",
                ]}
              />
              <Plan
                name="Business"
                price="$12"
                cadence="per editor / month"
                cta="Start a 30-day trial"
                onCta={create}
                featured
                items={[
                  "Everything in Team",
                  "SSO with SAML or OIDC",
                  "Unlimited named versions",
                  "Workspace roles and audit log",
                  "Priority support",
                ]}
              />
              <Plan
                name="Enterprise"
                price="Custom"
                cadence="annual agreement"
                cta="Contact sales"
                href="#demo"
                items={[
                  "Everything in Business",
                  "Self-hosted or dedicated deployment",
                  "SCIM provisioning",
                  "Customer-managed encryption keys",
                  "Uptime SLA and named support",
                ]}
              />
            </div>
          </div>
        </section>

        {/* Demo form */}
        <section id="demo" className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-10 rounded-xl border border-border p-8 md:grid-cols-2 md:p-12">
            <div>
              <h2 className="text-3xl font-semibold leading-tight tracking-[-0.02em]">
                See it with your own documents
              </h2>
              <p className="mt-4 max-w-[48ch] text-muted-foreground">
                A 30-minute walkthrough with a solutions engineer. Bring a real
                spec and we'll import it live.
              </p>
            </div>
            <form
              className="grid gap-3"
              onSubmit={(e) => e.preventDefault()}
            >
              <Field label="Work email" type="email" placeholder="you@company.com" />
              <Field label="Company" placeholder="Company name" />
              <label className="grid gap-1 text-sm">
                <span className="text-muted-foreground">Team size</span>
                <select className="h-10 rounded-md border border-border bg-background px-3">
                  <option>1–50</option>
                  <option>51–250</option>
                  <option>251–1,000</option>
                  <option>1,000+</option>
                </select>
              </label>
              <button
                type="submit"
                className="mt-2 h-10 rounded-md bg-[var(--navy)] text-sm font-medium text-white hover:opacity-90"
              >
                Request a demo
              </button>
            </form>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 text-sm md:grid-cols-4">
          <div>
            <span className="font-semibold">Katagami</span>
            <p className="mt-2 text-xs text-muted-foreground">
              Collaborative Markdown for organizations.
            </p>
          </div>
          <FootCol title="Product" items={["Security", "Deployment", "Pricing", "Changelog"]} />
          <FootCol title="Resources" items={["Documentation", "Trust center", "Status", "Support"]} />
          <FootCol title="Company" items={["About", "Customers", "Careers", "Contact"]} />
        </div>
      </footer>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-4 py-3 text-center">
      <dt className="text-2xl font-semibold tracking-tight">{value}</dt>
      <dd className="mt-1 text-xs text-muted-foreground">{label}</dd>
    </div>
  );
}

function Control({ title, body }: { title: string; body: string }) {
  return (
    <li className="bg-background p-6">
      <h3 className="font-medium">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {body}
      </p>
    </li>
  );
}

function Team({ name, items }: { name: string; items: string[] }) {
  return (
    <div>
      <h3 className="border-b-2 border-[var(--navy)] pb-2 font-medium">
        {name}
      </h3>
      <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  );
}

function Deploy({
  title,
  body,
  note,
}: {
  title: string;
  body: string;
  note: string;
}) {
  return (
    <div className="rounded-lg border border-border p-6">
      <h3 className="font-medium">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {body}
      </p>
      <p className="mt-4 text-xs text-[var(--navy)] dark:text-blue-300">
        {note}
      </p>
    </div>
  );
}

function Plan({
  name,
  price,
  cadence,
  cta,
  onCta,
  href,
  featured,
  items,
}: {
  name: string;
  price: string;
  cadence: string;
  cta: string;
  onCta?: () => void;
  href?: string;
  featured?: boolean;
  items: string[];
}) {
  const btn =
    "mt-6 inline-flex h-10 w-full items-center justify-center rounded-md text-sm font-medium " +
    (featured
      ? "bg-[var(--navy)] text-white hover:opacity-90"
      : "border border-border hover:bg-muted");
  return (
    <div
      className={
        "rounded-lg border bg-background p-6 " +
        (featured ? "border-[var(--navy)]" : "border-border")
      }
    >
      <h3 className="font-medium">{name}</h3>
      <p className="mt-4 text-3xl font-semibold tracking-tight">{price}</p>
      <p className="text-xs text-muted-foreground">{cadence}</p>
      {href ? (
        <a href={href} className={btn}>
          {cta}
        </a>
      ) : (
        <button type="button" onClick={onCta} className={btn}>
          {cta}
        </button>
      )}
      <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
        {items.map((i) => (
          <li key={i} className="flex gap-2">
            <span aria-hidden className="text-[var(--navy)] dark:text-blue-300">
              ✓
            </span>
            {i}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Field({
  label,
  type = "text",
  placeholder,
}: {
  label: string;
  type?: string;
  placeholder: string;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        className="h-10 rounded-md border border-border bg-background px-3 placeholder:text-muted-foreground/60"
      />
    </label>
  );
}

function FootCol({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <span className="font-medium">{title}</span>
      <ul className="mt-2 space-y-1 text-muted-foreground">
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  );
}
