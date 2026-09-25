# Contact form: store first, notify second

Status: approved for later, not scheduled. Written 2026-09-25.

## Goal

The `/contact` page (Round 3, option B) shows a form that does nothing yet. When it ships, every message must be kept even if email delivery fails, and Travis must get an email for each one.

## Decision

Option 2 from the three considered:

1. Mail relay only (no record if mail fails).
2. **Store in Postgres, then notify by email.** Chosen.
3. Third-party form endpoint (messages live outside our stack).

Option 2 reuses Prisma and the existing database, and the email step can be added or swapped without touching the form.

## What Travis does outside the code

Two things, both one-time. Plain-English notes follow each step.

### 1. Pick a mail provider and get an API key

Recommendation: **Resend** (https://resend.com). Free tier is 3,000 emails a month, which is far more than a contact form needs. Postmark is the alternative if you already use it.

Steps in Resend:

1. Create an account, then **Domains → Add domain** and enter `bakadev.cloud`.
2. Resend shows three DNS records (one TXT for SPF, one TXT for DKIM, one MX for bounce handling). Add each one in hPanel under **Domains → bakadev.cloud → DNS / Nameservers**. Copy the values exactly. These records tell receiving mail servers that Resend is allowed to send on behalf of your domain, so the notifications don't land in spam.
3. Back in Resend, click **Verify**. It can take up to an hour for DNS to propagate.
4. **API Keys → Create API key**, permission "Sending access", domain `bakadev.cloud`. Copy the key once. It starts with `re_`.

### 2. Put the secrets where the server can read them

The production app reads its configuration from the `.env` file at `/opt/docker/katagami/.env` on the VPS (the same file that already holds `POSTGRES_PASSWORD`). Add three lines:

```
RESEND_API_KEY=re_xxxxxxxx
CONTACT_TO=you@example.com
CONTACT_FROM=Katagami <contact@bakadev.cloud>
```

`CONTACT_TO` is where notifications go. `CONTACT_FROM` must use the verified domain. After editing, restart the stack:

```bash
cd /opt/docker/katagami && docker compose -f docker-compose.prod.yml up -d
```

Nothing changes in GitHub Actions. Secrets stay on the server.

Also: replace the placeholder address on the Contact page with the real one when you have it.

## What the code does (for whoever builds it)

### Data

New Prisma model:

```prisma
model ContactMessage {
  id         String   @id @default(uuid()) @db.Uuid
  name       String
  email      String
  subject    String?
  body       String
  ip         String?
  userAgent  String?  @map("user_agent")
  notifiedAt DateTime? @map("notified_at")
  createdAt  DateTime @default(now()) @map("created_at")

  @@map("contact_messages")
  @@index([createdAt])
}
```

`notifiedAt` stays null if the email fails. A later admin view or a cron can retry those.

### API

`POST /api/contact` with JSON `{ name, email, subject?, body }`.

- Validate: name 1–120 chars, email looks like an email, body 10–5,000 chars.
- Rate limit: 5 per hour per IP, in memory (`@fastify/rate-limit`). Enough to stop casual abuse without a new service.
- Honeypot: the form includes a hidden `website` field. If it is filled, return 200 and store nothing. Bots fill every field; people never see it.
- Insert the row, then try to send email. Email failure is logged and does not fail the request.
- Response: `{ ok: true }`. The page shows "Sent. We reply within two working days." and clears the form.

Config: `RESEND_API_KEY`, `CONTACT_TO`, `CONTACT_FROM`. If `RESEND_API_KEY` is unset (local dev), skip sending and log the message instead.

### Email

Plain text, one per message:

```
From: Katagami <contact@bakadev.cloud>
To: CONTACT_TO
Reply-To: <sender's email>
Subject: [Katagami contact] <subject or first 60 chars of body>

<name> <email> wrote:

<body>

Received 2026-09-25 14:02 UTC, message id <uuid>
```

`Reply-To` set to the sender means replying in your mail client goes straight to them.

### Client

The existing form on `src/routes/Contact.tsx` gets state, a submit handler that posts to the API, disabled state while sending, an inline error on failure, and the success message. No new components.

### Tests

- Route test: valid message returns 200 and creates a row.
- Validation: missing body returns 400 with a field error.
- Honeypot: filled hidden field returns 200 and creates no row.
- Email: with the provider mocked, a send failure still returns 200 and leaves `notifiedAt` null.

## Effort

About half a day including tests. No new services on the VPS.

## Later

- Admin page listing messages (needs OAuth and an admin flag on the user).
- Retry cron for rows with null `notifiedAt`.
