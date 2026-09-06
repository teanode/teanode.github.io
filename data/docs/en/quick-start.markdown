This page gets a mail server running with docker compose in a few minutes.
For the DNS records, the port 25 problem and what to do when mail does not
arrive, read [Getting started](/doc/getting-started) afterwards.

## What you need

- A domain, and the ability to edit its DNS records.
- A host with a stable public address, reachable from the internet on ports
  25, 80, 443 and 587.
- Docker with the compose plugin. The compose file starts PostgreSQL for you.

## 1. Start the server

    mkdir -p /opt/teanode && cd /opt/teanode
    curl -LO https://raw.githubusercontent.com/ziyan/teanode/main/deploy/docker-compose.yml
    docker run --rm ghcr.io/ziyan/teanode:latest config env --output - \
      --hostname mail.example.com --domain example.com \
      --database-url 'postgres://teanode:teanode@127.0.0.1:5432/teanode?sslmode=disable' > .env
    docker compose up -d

Replace `mail.example.com` with the name of your server and `example.com`
with the domain you want mail for. The host name is what your MX record will
point at, so it has to be a name you can add a DNS record for.

Before starting, open `.env` and set `TEANODE_TLS_ACME_EMAIL` to an address
where the certificate authority can reach you. Everything else has a working
default. The server obtains its certificate over HTTP-01 on the first start,
which needs port 80 reachable from the internet.

The compose file also starts ClamAV and SpamAssassin. Both are optional.
Remove them from the file if you do not want them; ClamAV alone wants about
2GB of memory.

## 2. Claim the dashboard

Open `https://mail.example.com/`. The first visitor creates the only account,
so do this right away. If you would rather not race, create the account from
the shell instead:

    docker compose exec teanode teanode user create you

## 3. Publish the DNS records

The dashboard lists every DNS record your domain needs, checks them
periodically, and shows which are still missing. Publish them at your DNS
provider. The MX record is the one that makes mail arrive; the SPF, DKIM and
DMARC records are what make it trusted.

## 4. Forward an address

On the domain's page, add an alias. A pattern such as `^hello$` forwards
`hello@example.com` to an address of yours, and an empty pattern is a
catch-all for everything else. Send a message to the address from another
account and watch it appear in the mail list.

## Where to go next

- [Getting started](/doc/getting-started) explains the DNS records one by
  one, and what to check when mail does not arrive.
- [Deploying](/doc/deploying) covers the container image, upgrades and what
  to back up.
- [Configuration](/doc/configuration) documents every setting.
