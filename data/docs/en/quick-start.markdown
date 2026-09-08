This page gets a mail server running with docker compose in a few minutes.
For the DNS records, the port 25 problem and what to do when mail does not
arrive, read [Getting started](/doc/getting-started) afterwards.

## What you need

- A domain, and the ability to edit its DNS records.
- A host with a stable public address, reachable from the internet on ports
  25, 80, 443 and 587, and on 993 if you want to read the mail in a mail
  program.
- Docker with the compose plugin. The compose file starts PostgreSQL for you.

## 1. Start the server

    mkdir -p /opt/teanode && cd /opt/teanode
    curl -LO https://raw.githubusercontent.com/ziyan/teanode/main/deploy/docker-compose.yml
    docker run --rm ghcr.io/ziyan/teanode:latest config env --output - \
      --hostname mail.example.com --domain example.com > .env
    chmod 600 .env
    docker compose up -d

Replace `mail.example.com` with the name of your server and `example.com`
with the domain you want mail for. The host name is what your MX record will
point at, so it has to be a name you can add a DNS record for.

Before starting, open `.env` and set `TEANODE_TLS_ACME_EMAIL` to an address
where the certificate authority can reach you. Everything else has a working
default. The file holds the database password, which is why it is `chmod 600`. The server obtains its certificate over HTTP-01 on the first start,
which needs port 80 reachable from the internet.

The compose file also starts ClamAV, which is optional; remove it from the
file if you do not want it, since it alone wants about 2GB of memory. Spam is
scored by a filter inside the server, so nothing else is needed for that.

## 2. Claim the dashboard

Open `https://mail.example.com/`. The first visitor creates the only account,
and that account is an administrator with a mailbox of its own, so do this
right away. If you would rather not race, create the account from the shell
instead:

    docker compose exec teanode teanode user create you

## 3. Publish the DNS records

The dashboard lists every DNS record your domain needs, checks them
periodically, and shows which are still missing. Publish them at your DNS
provider. The MX record is the one that makes mail arrive; the SPF, DKIM and
DMARC records are what make it trusted.

## 4. Point an address at your mailbox

A mailbox receives nothing until an address points at it. On the domain's
**Aliases** tab, add one with the kind **Deliver into a mailbox** and pick
yours: the pattern `^you$` makes `you@example.com` yours. Send a message to
it from another account and watch it arrive in your Inbox, unread.

An address that should go somewhere else forwards instead: a pattern such as
`^hello$` sends `hello@example.com` to an inbox you already read, to a
webhook, or to another mail server, and an empty pattern is a catch-all for
everything nothing else matched. One domain can do both.

## 5. Read it in a mail program

Make an app password on **Mailbox settings → Mail programs**, name it for the
device, and type it into Apple Mail, Thunderbird or your phone along with
your address. The program reads over IMAP on port 993 and sends on 587, and
most of them find both from the address on their own. The password is shown
once.

## Where to go next

- [Getting started](/doc/getting-started) explains the DNS records one by
  one, and what to check when mail does not arrive.
- [Deploying](/doc/deploying) covers the container image, upgrades and what
  to back up.
- [Configuration](/doc/configuration) documents every setting.
