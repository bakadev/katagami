# Deploying Katagami to the Hostinger VPS

Target: `https://katagami.bakadev.cloud` on the existing Hostinger KVM 2 VPS (`srv1201852.hstgr.cloud`, IPv4 `72.62.80.77`, Ubuntu 24.04).

## How it fits together

```
Internet
  │
  ▼  ports 80/443
Nginx Proxy Manager  (existing container, Docker network `proxy`)
  ├── bakadev.cloud            → portfolio container  (existing, unchanged)
  └── katagami.bakadev.cloud   → katagami-app:3001    (new, WebSockets on)
                                     │  Docker network `internal`
                                     └── katagami-postgres:5432
```

- One image, `ghcr.io/bakadev/katagami`, serves the API, the `/ws` sync endpoint and the built client.
- Postgres runs in a sibling container with a named volume. It is never exposed to the internet.
- Pushing to `main` builds the image in GitHub Actions and restarts the stack over SSH, the same pattern the portfolio repo already uses.
- Database migrations run automatically every time the app container starts.

Files in this repo that make it work: `Dockerfile`, `docker-compose.prod.yml`, `.env.production.example`, `.github/workflows/deploy.yml`.

---

## Part 1 — DNS (hPanel, ~2 minutes)

1. Sign in at https://hpanel.hostinger.com.
2. Left sidebar → **Domains** → click **bakadev.cloud** → **DNS / Nameservers**.
3. Add a record:
   - Type: **A**
   - Name: `katagami`
   - Points to: `72.62.80.77`
   - TTL: leave the default
4. Save. Propagation is usually under 10 minutes. Check from your laptop:
   ```bash
   dig +short katagami.bakadev.cloud
   # expect: 72.62.80.77
   ```

## Part 2 — Firewall (hPanel, ~2 minutes, recommended)

The VPS currently has **0 firewall rules**, so every container port that gets published is reachable from the internet. Nginx Proxy Manager's admin UI on port 81 is one of them.

1. hPanel → **VPS** → **Manage** on `srv1201852` → left menu **Security** → **Firewall**.
2. Create a firewall (any name) and add accept rules for:
   - TCP **22** (SSH)
   - TCP **80** (HTTP)
   - TCP **443** (HTTPS)
3. Activate it. Do **not** add 81. When you need the Nginx Proxy Manager UI, reach it over an SSH tunnel:
   ```bash
   ssh -L 8181:localhost:81 root@72.62.80.77
   # then open http://localhost:8181 in your browser
   ```
   If you'd rather skip the tunnel for now, add TCP 81 too and remove it later.

## Part 3 — Server preparation (SSH, ~10 minutes)

```bash
ssh root@72.62.80.77
```

### 3.1 See what's running

```bash
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Ports}}'
docker network ls
ls /opt/docker
```

Expected: `nginx-proxy-manager`, the portfolio container, `n8n`, `n8n-postgres`, and a network named `proxy`.

### 3.2 Remove n8n

This deletes n8n and its database permanently. You said it's unused.

```bash
cd /opt/docker/n8n            # adjust if it lives elsewhere; find it with: docker inspect n8n | grep com.docker.compose.project.working_dir
docker compose down --volumes
cd /opt/docker && rm -rf n8n
```

Leave `nginx-proxy-manager` and the portfolio alone.

### 3.3 Create the Katagami stack directory

```bash
mkdir -p /opt/docker/katagami
cd /opt/docker/katagami
```

Create `docker-compose.yml` with the contents of this repo's `docker-compose.prod.yml`. Either copy-paste it into `nano docker-compose.yml`, or fetch it once the repo is public:

```bash
curl -fsSL https://raw.githubusercontent.com/bakadev/katagami/main/docker-compose.prod.yml -o docker-compose.yml
```

Create the secrets file:

```bash
echo "POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d '/+=' | cut -c1-40)" > .env
chmod 600 .env
cat .env     # keep a copy somewhere safe; you'll never need to type it, but don't lose it
```

### 3.4 Let the server pull from GHCR

The image is published to GitHub Container Registry. Pick one:

- **Easiest:** make the package public. After the first successful workflow run, go to https://github.com/orgs/bakadev/packages → **katagami** → **Package settings** → **Change visibility** → Public. No login needed on the server.
- **Private:** create a GitHub personal access token with `read:packages`, then on the server run `docker login ghcr.io -u <github-username>` and paste the token. Docker remembers it.

Check how the portfolio does it: `cat /root/.docker/config.json` shows whether a ghcr.io login already exists. If it does, you're already covered.

### 3.5 First start (manual, before wiring GitHub Actions)

Wait until the workflow in Part 5 has pushed an image at least once, then:

```bash
cd /opt/docker/katagami
docker compose pull
docker compose up -d
docker compose logs -f app      # Ctrl-C to stop following
```

You should see Prisma apply two migrations, then Fastify report it's listening on 3001. Sanity check from inside the server:

```bash
docker exec katagami-app node -e "fetch('http://localhost:3001/api/health').then(r=>r.json()).then(console.log)"
# expect: { ok: true }
```

## Part 4 — Nginx Proxy Manager (browser, ~3 minutes)

1. Open the admin UI (via the tunnel from Part 2, or `http://72.62.80.77:81` if port 81 is open).
2. **Hosts → Proxy Hosts → Add Proxy Host**.
3. **Details** tab:
   - Domain Names: `katagami.bakadev.cloud`
   - Scheme: `http`
   - Forward Hostname / IP: `katagami-app`
   - Forward Port: `3001`
   - **Websockets Support: ON** (required, the editor syncs over WebSockets)
   - Block Common Exploits: ON
4. **SSL** tab:
   - SSL Certificate: **Request a new SSL Certificate**
   - Force SSL: ON
   - HTTP/2 Support: ON
   - Agree to the Let's Encrypt terms
5. Save. Within a minute, `https://katagami.bakadev.cloud` should show the Katagami home page. Open it in two browsers, create a doc, and type in one to see the cursor in the other.

If the certificate request fails, DNS hasn't propagated yet. Wait and retry from the host's SSL tab.

## Part 5 — GitHub Actions (GitHub, ~5 minutes)

The workflow at `.github/workflows/deploy.yml` needs three repository secrets, the same ones the portfolio repo uses. In the `bakadev/katagami` repo: **Settings → Secrets and variables → Actions → New repository secret**.

| Secret | Value |
|---|---|
| `VPS_HOST` | `72.62.80.77` |
| `VPS_USER` | `root` |
| `VPS_SSH_KEY` | The **private** key whose public half is in `/root/.ssh/authorized_keys` on the VPS. Reuse the one from the portfolio repo if you still have it. Otherwise: `ssh-keygen -t ed25519 -f ~/.ssh/katagami-deploy -N ""`, then `ssh-copy-id -i ~/.ssh/katagami-deploy.pub root@72.62.80.77`, and paste the contents of `~/.ssh/katagami-deploy` (no `.pub`). |

Then push to `main` (or **Actions → Deploy Katagami to VPS → Run workflow**). The run builds the image, pushes it to GHCR, SSHes in, pulls and restarts. About three minutes end to end.

The first run will fail at the SSH step if `/opt/docker/katagami` doesn't exist yet. That's fine: do Part 3.3 first, or re-run the workflow after.

## Part 6 — Order of operations, condensed

1. DNS A record (Part 1).
2. Add the three GitHub secrets (Part 5) and push, so an image exists in GHCR.
3. Make the GHCR package public, or log the server in (Part 3.4).
4. SSH in: remove n8n, create `/opt/docker/katagami` with the compose file and `.env`, `docker compose up -d` (Parts 3.2–3.5).
5. Add the proxy host with WebSockets and SSL in Nginx Proxy Manager (Part 4).
6. Firewall (Part 2).
7. From now on, every push to `main` deploys.

---

## Day-2 operations

**Logs**
```bash
cd /opt/docker/katagami && docker compose logs -f app
```

**Restart without redeploying**
```bash
cd /opt/docker/katagami && docker compose restart app
```

**Roll back to a previous image** — every push is also tagged with its commit SHA:
```bash
cd /opt/docker/katagami
docker compose pull            # optional
docker run --rm ghcr.io/bakadev/katagami:<sha> true   # confirm it exists
sed -i 's|ghcr.io/bakadev/katagami:.*|ghcr.io/bakadev/katagami:<sha>|' docker-compose.yml
docker compose up -d
```
Set it back to `:latest` afterwards.

**Database backup** — the Hostinger weekly VPS snapshot covers the volume, but a logical dump is cheap:
```bash
docker exec katagami-postgres pg_dump -U katagami katagami | gzip > /root/katagami-$(date +%F).sql.gz
```

**Restore**
```bash
gunzip -c /root/katagami-YYYY-MM-DD.sql.gz | docker exec -i katagami-postgres psql -U katagami katagami
```

---

## The portfolio site (bakadev.cloud)

Nothing changes. It keeps deploying from `bakadev/portfolio` through its own workflow into `/opt/docker/portfolio`, and Nginx Proxy Manager keeps routing `bakadev.cloud` to it. To rebuild it, push to that repo's `main`.

The `bakadev/vps` repo held the compose files for Nginx Proxy Manager and n8n. After this deployment, the n8n file is dead. It's worth adding `docker-compose.prod.yml` from this repo to `bakadev/vps` as `katagami.docker-compose.yml` so that repo stays an accurate record of what runs on the server, but the source of truth is the copy in `/opt/docker/katagami`.
